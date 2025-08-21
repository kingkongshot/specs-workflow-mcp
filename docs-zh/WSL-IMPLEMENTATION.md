# WSL 实现详情

本文档详细介绍了 Spec Workflow MCP 服务器中 WSL（Windows Linux 子系统）支持的技术实现。

## 架构概览

WSL 支持通过以下核心组件实现：

- WSL 环境检测算法
- 跨平台路径转换系统
- Windows-Linux 文件系统桥接
- VS Code Remote-WSL 集成

## WSL 检测实现

### 环境识别

```typescript
export function detectWSLEnvironment(): WSLEnvironment {
  // 检查 /proc/version 中的 Microsoft 标识
  if (fs.existsSync("/proc/version")) {
    const version = fs.readFileSync("/proc/version", "utf8");
    if (version.toLowerCase().includes("microsoft")) {
      return analyzeWSLDetails();
    }
  }

  // 检查环境变量
  if (process.env.WSL_DISTRO_NAME) {
    return analyzeWSLDetails();
  }

  return null;
}

function analyzeWSLDetails(): WSLEnvironment {
  const wslDistro = process.env.WSL_DISTRO_NAME || "Unknown";
  const windowsPath = findWindowsMountPoint();

  return {
    isWSL: true,
    wslVersion: detectWSLVersion(),
    wslDistribution: wslDistro,
    windowsPath: windowsPath,
    windowsUsername: extractWindowsUsername(windowsPath),
    linuxUsername: process.env.USER || "unknown",
  };
}
```

### WSL 版本检测

```typescript
function detectWSLVersion(): string {
  try {
    // WSL2 特有的内核版本模式
    const version = fs.readFileSync("/proc/version", "utf8");
    if (version.includes("WSL2")) {
      return "2";
    }

    // 检查 WSL2 特有的文件系统特征
    if (fs.existsSync("/mnt/wsl")) {
      return "2";
    }

    // 默认为 WSL1
    return "1";
  } catch {
    return "unknown";
  }
}
```

### Windows 挂载点发现

```typescript
function findWindowsMountPoint(): string {
  // 标准 WSL 挂载点
  const commonMounts = ["/mnt/c", "/mnt/d", "/mnt/e"];

  for (const mount of commonMounts) {
    if (fs.existsSync(mount)) {
      return mount;
    }
  }

  // 扫描所有可能的挂载点
  try {
    const mntDir = fs.readdirSync("/mnt");
    for (const dir of mntDir) {
      const mountPath = `/mnt/${dir}`;
      if (fs.statSync(mountPath).isDirectory()) {
        return mountPath;
      }
    }
  } catch {
    // 忽略错误
  }

  return "/mnt/c"; // 默认值
}
```

## 路径转换系统

### Windows 到 WSL 转换

```typescript
export function windowsToWSLPath(windowsPath: string): string {
  // 处理不同的 Windows 路径格式
  let normalizedPath = windowsPath.replace(/\\/g, "/");

  // 驱动器字母转换 (C: -> /mnt/c)
  const driveMatch = normalizedPath.match(/^([A-Za-z]):(.*)/);
  if (driveMatch) {
    const [, driveLetter, restPath] = driveMatch;
    return `/mnt/${driveLetter.toLowerCase()}${restPath}`;
  }

  // UNC 路径处理 (\\server\share -> /mnt/server/share)
  const uncMatch = normalizedPath.match(/^\/\/([^\/]+)(.*)/);
  if (uncMatch) {
    const [, server, restPath] = uncMatch;
    return `/mnt/${server}${restPath}`;
  }

  return normalizedPath;
}
```

### WSL 到 Windows 转换

```typescript
export function wslToWindowsPath(wslPath: string): string {
  // WSL 挂载点转换 (/mnt/c/... -> C:/...)
  const mountMatch = wslPath.match(/^\/mnt\/([a-z])(.*)/);
  if (mountMatch) {
    const [, driveLetter, restPath] = mountMatch;
    return `${driveLetter.toUpperCase()}:${restPath.replace(/\//g, "\\")}`;
  }

  // WSL 内部路径转换为网络路径
  const env = detectRemoteEnvironment();
  if (env.isWSL && env.wslDistribution) {
    return `\\\\wsl$\\${env.wslDistribution}${wslPath.replace(/\//g, "\\")}`;
  }

  return wslPath;
}
```

### 智能路径解析

```typescript
export function resolveWSLPath(
  inputPath: string,
  context?: PathContext
): string {
  const env = detectRemoteEnvironment();

  if (!env.isWSL) {
    return path.resolve(inputPath);
  }

  // 相对路径处理
  if (!path.isAbsolute(inputPath)) {
    const basePath = context?.basePath || process.cwd();
    return path.resolve(basePath, inputPath);
  }

  // Windows 格式路径自动转换
  if (inputPath.match(/^[A-Za-z]:/)) {
    return windowsToWSLPath(inputPath);
  }

  return inputPath;
}
```

## 文件系统集成

### 跨平台文件访问

```typescript
export class WSLFileSystem {
  private env: RemoteEnvironment;

  constructor() {
    this.env = detectRemoteEnvironment();
  }

  async readFile(filePath: string): Promise<string> {
    const resolvedPath = this.resolvePath(filePath);
    return fs.promises.readFile(resolvedPath, "utf8");
  }

  async writeFile(filePath: string, content: string): Promise<void> {
    const resolvedPath = this.resolvePath(filePath);

    // 确保目录存在
    await fs.promises.mkdir(path.dirname(resolvedPath), { recursive: true });

    return fs.promises.writeFile(resolvedPath, content, "utf8");
  }

  private resolvePath(filePath: string): string {
    return resolveWSLPath(filePath, {
      basePath: this.env.remoteWorkspaceFolder,
    });
  }
}
```

### 权限管理

```typescript
function fixWSLPermissions(filePath: string): void {
  try {
    // WSL 文件权限修复
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);

      // 确保文件可读写
      if (!(stats.mode & 0o600)) {
        fs.chmodSync(filePath, 0o644);
      }

      // 确保目录可执行
      if (stats.isDirectory() && !(stats.mode & 0o100)) {
        fs.chmodSync(filePath, 0o755);
      }
    }
  } catch (error) {
    console.warn("权限修复失败:", error.message);
  }
}
```

## VS Code 集成

### Remote-WSL 配置

```json
{
  "remote.WSL.fileWatcher.polling": true,
  "remote.WSL.useShellEnvironment": true,
  "terminal.integrated.defaultProfile.windows": "Ubuntu",
  "terminal.integrated.profiles.windows": {
    "Ubuntu": {
      "source": "WSL",
      "distribution": "Ubuntu"
    }
  }
}
```

### 任务配置

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Test WSL Environment",
      "type": "shell",
      "command": "npm",
      "args": ["run", "wsl:test"],
      "group": "test",
      "presentation": {
        "echo": true,
        "reveal": "always"
      },
      "options": {
        "shell": {
          "executable": "wsl",
          "args": []
        }
      }
    }
  ]
}
```

## 环境变量处理

### WSL 环境变量管理

```typescript
function getWSLEnvironmentVariables(): Record<string, string> {
  const wslVars: Record<string, string> = {};

  // WSL 特定变量
  if (process.env.WSL_DISTRO_NAME) {
    wslVars.WSL_DISTRO_NAME = process.env.WSL_DISTRO_NAME;
  }

  if (process.env.WSLENV) {
    wslVars.WSLENV = process.env.WSLENV;
  }

  // Windows PATH 集成
  if (process.env.PATH) {
    const paths = process.env.PATH.split(":");
    const windowsPaths = paths.filter((p) => p.includes("/mnt/c/"));
    wslVars.WINDOWS_PATHS = windowsPaths.join(":");
  }

  return wslVars;
}
```

## 性能优化

### 文件监视优化

```typescript
class WSLFileWatcher {
  private watcher: fs.FSWatcher | null = null;

  watch(paths: string[], options: WatchOptions): void {
    // WSL2 使用原生文件监视
    if (this.isWSL2()) {
      this.setupNativeWatcher(paths, options);
    } else {
      // WSL1 使用轮询
      this.setupPollingWatcher(paths, options);
    }
  }

  private isWSL2(): boolean {
    const env = detectRemoteEnvironment();
    return env.isWSL && env.wslVersion === "2";
  }

  private setupNativeWatcher(paths: string[], options: WatchOptions): void {
    this.watcher = fs.watch(
      paths[0],
      {
        recursive: true,
        persistent: false,
      },
      (eventType, filename) => {
        options.onChange?.(eventType, filename);
      }
    );
  }

  private setupPollingWatcher(paths: string[], options: WatchOptions): void {
    // 轮询实现
    setInterval(() => {
      paths.forEach((p) => this.checkFileChanges(p, options));
    }, options.pollingInterval || 1000);
  }
}
```

### 内存管理

```typescript
function optimizeWSLMemory(): void {
  // WSL 内存使用优化
  if (process.env.NODE_OPTIONS) {
    process.env.NODE_OPTIONS += " --max-old-space-size=2048";
  } else {
    process.env.NODE_OPTIONS = "--max-old-space-size=2048";
  }

  // 垃圾收集优化
  if (global.gc) {
    setInterval(() => {
      global.gc();
    }, 300000); // 5 分钟
  }
}
```

## 测试套件

### WSL 检测测试

```typescript
describe("WSL Detection", () => {
  beforeEach(() => {
    // 模拟 WSL 环境
    process.env.WSL_DISTRO_NAME = "Ubuntu-22.04";
  });

  it("should detect WSL environment correctly", () => {
    const env = detectRemoteEnvironment();

    expect(env.isWSL).toBe(true);
    expect(env.wslDistribution).toBe("Ubuntu-22.04");
    expect(env.environmentType).toBe("wsl");
  });

  it("should detect WSL version", () => {
    // 测试 WSL 版本检测逻辑
    const version = detectWSLVersion();
    expect(["1", "2", "unknown"]).toContain(version);
  });
});
```

### 路径转换测试

```typescript
describe("Path Conversion", () => {
  it("should convert Windows paths to WSL", () => {
    const wslPath = windowsToWSLPath("C:\\Users\\John\\Documents");
    expect(wslPath).toBe("/mnt/c/Users/John/Documents");
  });

  it("should convert WSL paths to Windows", () => {
    const winPath = wslToWindowsPath("/mnt/c/Users/John/Documents");
    expect(winPath).toBe("C:\\Users\\John\\Documents");
  });

  it("should handle relative paths", () => {
    const resolved = resolveWSLPath("./specs");
    expect(resolved).toMatch(/\/.*\/specs$/);
  });
});
```

## 故障排除工具

### 诊断脚本

```typescript
export function runWSLDiagnostics(): DiagnosticsResult {
  const results: DiagnosticsResult = {
    environment: detectRemoteEnvironment(),
    pathTests: [],
    permissions: [],
    performance: {},
  };

  // 路径转换测试
  const testPaths = [
    "C:\\Users\\test\\file.txt",
    "/mnt/c/Users/test/file.txt",
    "./relative/path",
  ];

  for (const testPath of testPaths) {
    try {
      const converted = resolveWSLPath(testPath);
      results.pathTests.push({
        input: testPath,
        output: converted,
        success: true,
      });
    } catch (error) {
      results.pathTests.push({
        input: testPath,
        output: null,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
}
```

## 日志记录

### 结构化日志

```typescript
class WSLLogger {
  private static instance: WSLLogger;

  static getInstance(): WSLLogger {
    if (!this.instance) {
      this.instance = new WSLLogger();
    }
    return this.instance;
  }

  logEnvironmentInfo(env: RemoteEnvironment): void {
    if (env.isWSL) {
      console.error("🐧 WSL 环境检测:");
      console.error(`   版本: WSL${env.wslVersion}`);
      console.error(`   分发版: ${env.wslDistribution}`);
      console.error(`   Windows 用户: ${env.windowsUsername || "Unknown"}`);
      console.error(`   Linux 用户: ${env.linuxUsername || "Unknown"}`);
    }
  }

  logPathConversion(from: string, to: string): void {
    console.error(`🛤️  路径转换: ${from} → ${to}`);
  }
}
```

通过这些技术实现，Spec Workflow MCP 服务器能够在 WSL 环境中无缝运行，并提供完整的跨平台开发体验。

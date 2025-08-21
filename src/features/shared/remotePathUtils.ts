/**
 * Remote development utilities for VS Code Remote SSH and WSL support
 */

import { homedir } from "os";
import { join, resolve, isAbsolute } from "path";
import { existsSync, readFileSync } from "fs";
import process from "process";

export interface RemoteEnvironmentInfo {
  isRemote: boolean;
  isWSL: boolean;
  wslVersion?: string;
  wslDistribution?: string;
  windowsPath?: string;
  remoteUser?: string;
  remoteHost?: string;
  localWorkspaceFolder?: string;
  remoteWorkspaceFolder?: string;
  environmentType: "local" | "ssh" | "wsl" | "container";
}

/**
 * Detect WSL environment and version
 */
function detectWSLEnvironment(): {
  isWSL: boolean;
  version?: string;
  distribution?: string;
  windowsPath?: string;
} {
  // Check if running in WSL
  const isWSL =
    existsSync("/proc/version") &&
    readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft");

  if (!isWSL) {
    return { isWSL: false };
  }

  let version: string | undefined;
  let distribution: string | undefined;
  let windowsPath: string | undefined;

  try {
    // Detect WSL version
    const wslEnv = process.env.WSL_DISTRO_NAME;
    if (wslEnv) {
      distribution = wslEnv;
    }

    // Check if WSL2 by examining kernel version
    const procVersion = readFileSync("/proc/version", "utf8");
    if (procVersion.includes("WSL2")) {
      version = "2";
    } else if (procVersion.includes("Microsoft")) {
      version = "1";
    }

    // Try to get Windows path mapping
    if (existsSync("/etc/wsl.conf")) {
      const wslConf = readFileSync("/etc/wsl.conf", "utf8");
      // Look for automount root configuration
      const rootMatch = wslConf.match(/root\s*=\s*([^\r\n]+)/);
      if (rootMatch) {
        windowsPath = rootMatch[1];
      }
    }

    // Default Windows mount point
    if (!windowsPath && existsSync("/mnt/c")) {
      windowsPath = "/mnt/c";
    }
  } catch {
    // Ignore errors in WSL detection details
  }

  return {
    isWSL: true,
    version,
    distribution,
    windowsPath,
  };
}

/**
 * Detect if running in VS Code Remote SSH, WSL, or container environment
 */
export function detectRemoteEnvironment(): RemoteEnvironmentInfo {
  const vscodeRemoteName = process.env.VSCODE_REMOTE_NAME;
  const sshConnection = process.env.SSH_CONNECTION;
  const sshClient = process.env.SSH_CLIENT;
  const remoteContainers = process.env.REMOTE_CONTAINERS;

  // Detect WSL environment
  const wslInfo = detectWSLEnvironment();

  // Check if running in remote environment
  const isRemote = !!(
    vscodeRemoteName ||
    sshConnection ||
    sshClient ||
    remoteContainers ||
    wslInfo.isWSL
  );

  let remoteUser: string | undefined;
  let remoteHost: string | undefined;
  let environmentType: "local" | "ssh" | "wsl" | "container" = "local";

  // Determine environment type
  if (remoteContainers) {
    environmentType = "container";
  } else if (wslInfo.isWSL) {
    environmentType = "wsl";
  } else if (vscodeRemoteName || sshConnection || sshClient) {
    environmentType = "ssh";
  }

  if (isRemote && vscodeRemoteName) {
    // Parse remote connection info from VSCODE_REMOTE_NAME
    if (vscodeRemoteName.includes("wsl")) {
      // WSL connection
      const match = vscodeRemoteName.match(/wsl\+(.+)/);
      if (match) {
        remoteHost = match[1];
        remoteUser = process.env.USER || process.env.USERNAME;
      }
    } else {
      // SSH connection
      const match = vscodeRemoteName.match(/ssh-remote\+(.+)@(.+)/);
      if (match) {
        remoteUser = match[1];
        remoteHost = match[2];
      }
    }
  }

  return {
    isRemote,
    isWSL: wslInfo.isWSL,
    wslVersion: wslInfo.version,
    wslDistribution: wslInfo.distribution,
    windowsPath: wslInfo.windowsPath,
    remoteUser,
    remoteHost,
    localWorkspaceFolder: process.env.VSCODE_WORKSPACE_FOLDER_LOCAL,
    remoteWorkspaceFolder: process.env.VSCODE_WORKSPACE_FOLDER || process.cwd(),
    environmentType,
  };
}

/**
 * Convert Windows path to WSL path
 */
export function windowsToWSLPath(windowsPath: string): string {
  // Handle different Windows path formats
  const normalizedPath = windowsPath.replace(/\\/g, "/");

  // Convert drive letters (C:/ -> /mnt/c/)
  const driveMatch = normalizedPath.match(/^([A-Za-z]):\//);
  if (driveMatch) {
    const driveLetter = driveMatch[1].toLowerCase();
    return `/mnt/${driveLetter}/${normalizedPath.substring(3)}`;
  }

  return normalizedPath;
}

/**
 * Convert WSL path to Windows path
 */
export function wslToWindowsPath(wslPath: string): string {
  // Handle WSL mount paths (/mnt/c/ -> C:/)
  const mountMatch = wslPath.match(/^\/mnt\/([a-z])\/(.*)$/);
  if (mountMatch) {
    const driveLetter = mountMatch[1].toUpperCase();
    const pathPart = mountMatch[2] || "";
    return `${driveLetter}:/${pathPart}`;
  }

  return wslPath;
}

/**
 * Get WSL distribution information
 */
export function getWSLDistributionInfo(): {
  name?: string;
  version?: string;
  defaultUID?: string;
} | null {
  const remoteInfo = detectRemoteEnvironment();

  if (!remoteInfo.isWSL) {
    return null;
  }

  try {
    // Try to get distribution info from /etc/os-release
    if (existsSync("/etc/os-release")) {
      const osRelease = readFileSync("/etc/os-release", "utf8");
      const nameMatch = osRelease.match(/^NAME="?([^"\n]+)"?$/m);
      const versionMatch = osRelease.match(/^VERSION="?([^"\n]+)"?$/m);

      return {
        name: nameMatch ? nameMatch[1] : undefined,
        version: versionMatch ? versionMatch[1] : undefined,
        defaultUID: process.env.USER || process.env.USERNAME,
      };
    }
  } catch {
    // Ignore errors
  }

  return {
    name: remoteInfo.wslDistribution,
    version: remoteInfo.wslVersion,
    defaultUID: process.env.USER || process.env.USERNAME,
  };
}

/**
 * Resolve path for remote environment, handling WSL, SSH, and container paths
 */
export function resolveRemotePath(inputPath: string): string {
  const remoteInfo = detectRemoteEnvironment();

  if (!remoteInfo.isRemote) {
    // Not in remote environment, return as-is
    return resolve(inputPath);
  }

  // Handle WSL-specific path resolution
  if (remoteInfo.isWSL) {
    // If it looks like a Windows path, convert it to WSL path
    if (inputPath.match(/^[A-Za-z]:[/\\]/)) {
      const wslPath = windowsToWSLPath(inputPath);
      return resolve(wslPath);
    }
  }

  // In remote environment
  if (isAbsolute(inputPath)) {
    // Already absolute path, use as-is
    return inputPath;
  }

  // Relative path, resolve relative to current working directory
  return resolve(process.cwd(), inputPath);
}

/**
 * Get user home directory, works in both local and remote environments
 */
export function getRemoteHomeDirectory(): string {
  const remoteInfo = detectRemoteEnvironment();

  if (remoteInfo.isRemote) {
    // In remote environment, use actual remote home
    return homedir();
  }

  return homedir();
}

/**
 * Normalize path separators for cross-platform compatibility
 */
export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/");
}

/**
 * Check if a path exists, with additional logging for remote debugging
 */
export function checkPathExists(path: string, context?: string): boolean {
  const exists = existsSync(path);
  const remoteInfo = detectRemoteEnvironment();

  if (remoteInfo.isRemote && process.env.NODE_ENV === "development") {
    process.stderr.write(
      `[Remote Debug] Checking path ${
        context ? `(${context})` : ""
      }: ${path} - ${exists ? "EXISTS" : "NOT FOUND"}\n`
    );
  }

  return exists;
}

/**
 * Get workspace-relative path for better portability
 */
export function getWorkspaceRelativePath(absolutePath: string): string {
  const remoteInfo = detectRemoteEnvironment();
  const workspaceFolder = remoteInfo.remoteWorkspaceFolder || process.cwd();

  if (absolutePath.startsWith(workspaceFolder)) {
    return absolutePath.substring(workspaceFolder.length + 1);
  }

  return absolutePath;
}

/**
 * Create a path resolver that works consistently in remote environments
 */
export function createRemotePathResolver(): {
  resolve: (path: string) => string;
  join: (...paths: string[]) => string;
  isAbsolute: (path: string) => boolean;
  exists: (path: string, context?: string) => boolean;
  normalize: (path: string) => string;
  getWorkspaceRelative: (absolutePath: string) => string;
  getHomeDir: () => string;
  remoteInfo: RemoteEnvironmentInfo;
  // WSL-specific functions
  windowsToWSL?: (path: string) => string;
  wslToWindows?: (path: string) => string;
  getWSLInfo?: () => {
    name?: string;
    version?: string;
    defaultUID?: string;
  } | null;
} {
  const remoteInfo = detectRemoteEnvironment();

  const resolver = {
    resolve: resolveRemotePath,
    join: (...paths: string[]): string => join(...paths),
    isAbsolute,
    exists: checkPathExists,
    normalize: normalizePath,
    getWorkspaceRelative: getWorkspaceRelativePath,
    getHomeDir: getRemoteHomeDirectory,
    remoteInfo,
  };

  // Add WSL-specific functions if in WSL environment
  if (remoteInfo.isWSL) {
    return {
      ...resolver,
      windowsToWSL: windowsToWSLPath,
      wslToWindows: wslToWindowsPath,
      getWSLInfo: getWSLDistributionInfo,
    };
  }

  return resolver;
}

/**
 * Log remote environment info for debugging
 */
export function logRemoteEnvironment(): void {
  const remoteInfo = detectRemoteEnvironment();

  if (process.env.NODE_ENV === "development") {
    const debugInfo: Record<string, unknown> = {
      isRemote: remoteInfo.isRemote,
      environmentType: remoteInfo.environmentType,
      user: remoteInfo.remoteUser,
      host: remoteInfo.remoteHost,
      workspaceFolder: remoteInfo.remoteWorkspaceFolder,
      cwd: process.cwd(),
      homeDir: getRemoteHomeDirectory(),
    };

    // Add WSL-specific information
    if (remoteInfo.isWSL) {
      debugInfo.wsl = {
        version: remoteInfo.wslVersion,
        distribution: remoteInfo.wslDistribution,
        windowsPath: remoteInfo.windowsPath,
        distributionInfo: getWSLDistributionInfo(),
      };
    }

    process.stderr.write(
      `[Remote Environment Info] ${JSON.stringify(debugInfo, null, 2)}\n`
    );
  }
}

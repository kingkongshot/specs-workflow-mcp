#!/usr/bin/env node

/**
 * WSL-specific testing script for path conversion and environment detection
 */

import {
  detectRemoteEnvironment,
  windowsToWSLPath,
  wslToWindowsPath,
  getWSLDistributionInfo,
  createRemotePathResolver,
  logRemoteEnvironment,
} from "../dist/features/shared/remotePathUtils.js";

console.log("🐧 WSL Environment and Path Conversion Tests\n");

// Test environment detection
console.log("1. WSL Environment Detection:");
const remoteInfo = detectRemoteEnvironment();
console.log(`   Is WSL: ${remoteInfo.isWSL}`);
console.log(`   WSL Version: ${remoteInfo.wslVersion || "N/A"}`);
console.log(`   Distribution: ${remoteInfo.wslDistribution || "N/A"}`);
console.log(`   Windows Mount: ${remoteInfo.windowsPath || "N/A"}`);
console.log(`   Environment Type: ${remoteInfo.environmentType}\n`);

// Test WSL distribution info
console.log("2. WSL Distribution Information:");
const wslInfo = getWSLDistributionInfo();
if (wslInfo) {
  console.log(`   Name: ${wslInfo.name || "N/A"}`);
  console.log(`   Version: ${wslInfo.version || "N/A"}`);
  console.log(`   Default UID: ${wslInfo.defaultUID || "N/A"}`);
} else {
  console.log("   Not running in WSL environment");
}
console.log();

// Test path conversion
console.log("3. Path Conversion Tests:");
const testWindowsPaths = [
  "C:/Users/username/Documents",
  "D:\\Projects\\my-app",
  "E:/temp/file.txt",
];

const testWSLPaths = [
  "/mnt/c/Users/username/Documents",
  "/mnt/d/Projects/my-app",
  "/home/username/project",
];

console.log("   Windows to WSL conversion:");
testWindowsPaths.forEach((path) => {
  const converted = windowsToWSLPath(path);
  console.log(`     ${path} -> ${converted}`);
});

console.log("\n   WSL to Windows conversion:");
testWSLPaths.forEach((path) => {
  const converted = wslToWindowsPath(path);
  console.log(`     ${path} -> ${converted}`);
});
console.log();

// Test path resolver with WSL functions
console.log("4. WSL Path Resolver:");
const pathResolver = createRemotePathResolver();
console.log(
  `   Has WSL functions: ${
    !!pathResolver.windowsToWSL && !!pathResolver.wslToWindows
  }`
);

if (pathResolver.windowsToWSL && pathResolver.wslToWindows) {
  console.log("   Testing resolver WSL functions:");
  console.log(`     C:/test -> ${pathResolver.windowsToWSL("C:/test")}`);
  console.log(
    `     /mnt/c/test -> ${pathResolver.wslToWindows("/mnt/c/test")}`
  );

  const wslResolverInfo = pathResolver.getWSLInfo?.();
  if (wslResolverInfo) {
    console.log(
      `   WSL Info from resolver: ${JSON.stringify(wslResolverInfo)}`
    );
  }
}
console.log();

// Test file system operations in WSL
console.log("5. File System Tests:");
const testPaths = ["/mnt/c", "/proc/version", "/etc/os-release"];
testPaths.forEach((path) => {
  const exists = pathResolver.exists(path);
  console.log(`   ${path}: ${exists ? "EXISTS" : "NOT FOUND"}`);
});
console.log();

// Environment logging
console.log("6. Detailed Environment Info:");
logRemoteEnvironment();

console.log("\n✅ WSL tests completed!");

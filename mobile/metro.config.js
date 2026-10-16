const fs = require("fs")
const path = require("path")

// On a workspace-filtered install (Vercel) `nativewind` is hoisted to the repo root while `react-native` stays in
// mobile/node_modules, so nativewind's own `require("react-native/package.json")` cannot find it. Making this
// package's node_modules resolvable fixes that without changing any dependency.
process.env.NODE_PATH = [path.join(__dirname, "node_modules"), process.env.NODE_PATH].filter(Boolean).join(path.delimiter)
require("module").Module._initPaths()

const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "..")

const config = getDefaultConfig(projectRoot)

try {
  const rootPkgPath = path.join(workspaceRoot, "package.json")
  if (fs.existsSync(rootPkgPath)) {
    const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, "utf8"))
    const ws = rootPkg.workspaces
    if (Array.isArray(ws) || (ws && typeof ws === "object")) {
      config.server = {
        ...(config.server || {}),
        unstable_serverRoot: workspaceRoot,
      }
    }
  }
} catch {
  // keep Expo default
}

const defaultWatchFolders = Array.isArray(config.watchFolders) ? config.watchFolders : [projectRoot]
config.watchFolders = [...new Set([...defaultWatchFolders, path.join(workspaceRoot, "packages/shared"), workspaceRoot])]
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
]
config.resolver.disableHierarchicalLookup = false
config.resolver.unstable_enablePackageExports = true
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules || {}),
  "@ciuna/shared": path.join(workspaceRoot, "packages/shared"),
}

module.exports = withNativeWind(config, { input: "./global.css" })

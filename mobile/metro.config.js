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

// Packages hoisted to the repo root (gesture-handler, flash-list) would otherwise pick up the root's React 18 (web) and
// crash with two Reacts. These always resolve from mobile/node_modules, whoever imports them.
const SINGLETONS = ["react", "react-dom", "react-native", "react-native-reanimated", "react-native-worklets", "react-native-screens", "react-native-safe-area-context"]
const previousResolve = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = previousResolve || context.resolveRequest
  const pinned = SINGLETONS.find((n) => moduleName === n || moduleName.startsWith(`${n}/`))
  // Only redirect imports that come from outside mobile/ (hoisted packages); mobile's own imports already resolve here.
  if (pinned && !context.originModulePath.startsWith(projectRoot + path.sep)) {
    const local = path.join(projectRoot, "node_modules", pinned)
    if (fs.existsSync(local)) {
      return resolve({ ...context, originModulePath: path.join(local, "package.json") }, moduleName, platform)
    }
  }
  return resolve(context, moduleName, platform)
}

module.exports = withNativeWind(config, { input: "./global.css" })

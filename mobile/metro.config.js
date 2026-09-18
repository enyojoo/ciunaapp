const path = require("path")
const { getDefaultConfig } = require("expo/metro-config")
const { withNativeWind } = require("nativewind/metro")

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, "..")

const config = getDefaultConfig(projectRoot)
config.watchFolders = [path.join(workspaceRoot, "packages/shared")]
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

const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = function override(config, env) {
  // Add a separate entry for the widget
  if (env === "production") {
    // Modify the entry to include widget
    const originalEntry = config.entry;
    config.entry = {
      main: originalEntry,
      widget: path.resolve(__dirname, "src/widget.js"),
    };

    // Modify the output to generate separate bundles
    config.output.filename = "static/js/[name].[contenthash:8].js";
    config.output.chunkFilename = "static/js/[name].[contenthash:8].chunk.js";

    // Ensure we're not using single runtime chunk for multiple entries
    config.optimization.runtimeChunk = false;

    // Find and modify HtmlWebpackPlugin to exclude widget from main html
    config.plugins = config.plugins.map((plugin) => {
      if (plugin instanceof HtmlWebpackPlugin) {
        return new HtmlWebpackPlugin({
          ...plugin.options,
          chunks: ["main"], // Only include main chunk, not widget
        });
      }
      return plugin;
    });
  }

  return config;
};

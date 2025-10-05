/**
 * Script to inject the built widget bundle into static/index.html
 * Run after: npm run build
 */

const fs = require("fs");
const path = require("path");
const glob = require("glob");

// Find the widget bundle
const widgetFiles = glob.sync("build/static/js/widget.*.js");
const widgetCssFiles = glob.sync("build/static/css/widget.*.css");

if (widgetFiles.length === 0) {
  console.error(
    "❌ Widget bundle not found! Make sure npm run build completed successfully."
  );
  process.exit(1);
}

const widgetJsPath = `/build/${widgetFiles[0].replace("build/", "")}`;
const widgetCssPath =
  widgetCssFiles.length > 0
    ? `/build/${widgetCssFiles[0].replace("build/", "")}`
    : null;

console.log("📦 Found widget bundle:", widgetJsPath);
if (widgetCssPath) console.log("🎨 Found widget CSS:", widgetCssPath);

// Read static/index.html
const htmlPath = "static/index.html";
let html = fs.readFileSync(htmlPath, "utf8");

// Remove old widget script tags
html = html.replace(
  /<script src="\/build\/static\/js\/widget\.[^"]+\.js"><\/script>/g,
  ""
);
html = html.replace(
  /<link rel="stylesheet" href="\/build\/static\/css\/widget\.[^"]+\.css">/g,
  ""
);

// Inject new widget CSS before </head>
if (widgetCssPath) {
  const cssTag = `    <link rel="stylesheet" href="${widgetCssPath}">`;
  html = html.replace("</head>", `${cssTag}\n</head>`);
}

// Inject new widget script before </body>
const scriptTag = `    <script src="${widgetJsPath}"></script>`;
html = html.replace("</body>", `${scriptTag}\n</body>`);

// Write back
fs.writeFileSync(htmlPath, html);

console.log("✅ Successfully injected widget bundle into static/index.html");
console.log("🚀 Ready to run! Start Flask with: python app.py");

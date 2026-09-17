"use strict";

const fs = require("fs");
const path = require("path");
const JavaScriptObfuscator = require("javascript-obfuscator");
const CleanCSS = require("clean-css");

const root = path.join(__dirname, "..");
const srcJsPath = path.join(root, "src", "app.js");
const destJsPath = path.join(root, "public", "app.js");

const srcCssPath = path.join(root, "src", "style.css");
const destCssPath = path.join(root, "public", "style.css");

console.log("[1/2] Obfuscating client JavaScript with hexadecimal mangling, RC4/Base64 string encryption, and control flow flattening...");
const rawJs = fs.readFileSync(srcJsPath, "utf8");

const obfuscationResult = JavaScriptObfuscator.obfuscate(rawJs, {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.35,
  stringArray: true,
  stringArrayEncoding: ["rc4", "base64"],
  stringArrayThreshold: 0.8,
  splitStrings: true,
  splitStringsChunkLength: 8,
  identifierNamesGenerator: "hexadecimal",
  renameGlobals: false,
  simplify: true,
  transformObjectKeys: true,
  unicodeEscapeSequence: true,
  sourceMap: false
});

fs.writeFileSync(destJsPath, obfuscationResult.getObfuscatedCode(), "utf8");
console.log(" -> Output written to public/app.js (" + Buffer.byteLength(obfuscationResult.getObfuscatedCode(), "utf8") + " bytes)");

console.log("[2/2] Minifying client stylesheet...");
const rawCss = fs.readFileSync(srcCssPath, "utf8");
const minifiedCss = new CleanCSS({ level: 2 }).minify(rawCss);

if (minifiedCss.errors && minifiedCss.errors.length) {
  console.error("CSS Minification errors:", minifiedCss.errors);
  process.exit(1);
}

fs.writeFileSync(destCssPath, minifiedCss.styles, "utf8");
console.log(" -> Output written to public/style.css (" + Buffer.byteLength(minifiedCss.styles, "utf8") + " bytes)");

console.log("Obfuscation and asset protection completed successfully.");


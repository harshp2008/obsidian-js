const fs = require("fs");
const path = require("path");

// Create dist directory if it doesn't exist
const distDir = path.join(__dirname, "..", "dist");
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
  console.log("Created dist directory");
}

// Copy index.css from src to dist
const srcCss = path.join(__dirname, "..", "src", "index.css");
const distCss = path.join(distDir, "index.css");
try {
  if (fs.existsSync(srcCss)) {
    fs.copyFileSync(srcCss, distCss);
    console.log("Copied index.css to dist");
  } else {
    console.warn("src/index.css does not exist");
  }
} catch (err) {
  console.error("Error copying index.css:", err);
}

// Copy all CSS files from public/css to dist
const publicCssDir = path.join(__dirname, "..", "public", "css");
if (fs.existsSync(publicCssDir)) {
  try {
    // Create dist/css if it doesn't exist
    const distCssDir = path.join(distDir, "css");
    if (!fs.existsSync(distCssDir)) {
      fs.mkdirSync(distCssDir, { recursive: true });
    }

    // Copy all files
    const cssFiles = fs.readdirSync(publicCssDir);
    cssFiles.forEach((file) => {
      const srcFile = path.join(publicCssDir, file);
      const destFile = path.join(distCssDir, file);

      // Only copy files, not directories
      if (fs.statSync(srcFile).isFile()) {
        fs.copyFileSync(srcFile, destFile);
        console.log(`Copied ${file} to dist/css`);
      }
    });
  } catch (err) {
    console.error("Error copying CSS files:", err);
  }
} else {
  console.warn("public/css directory does not exist");
}

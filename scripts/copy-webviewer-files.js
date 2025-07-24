const fs = require('fs-extra');
const path = require('path');

const sourcePath = path.resolve('../../node_modules/@pdftron/webviewer/public');
const destPath = path.resolve('./public/webviewer/');

fs.access(destPath, fs.constants.F_OK, async (err) => {
  if (err === null) {
    return;
  }
  try {
    await fs.copy(sourcePath, destPath);
    console.log('WebViewer files copied over successfully');
  } catch (err) {
    console.error(err);
  }
});

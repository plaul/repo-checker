/**
 * GENERATE.js
 * 
 * The following file is used to generate necessary files for the application to run.
 * Usage: npm run generate
 */

import fs from 'fs';

/**
 * Creates a directory if it does not exist
 * 
 * @param {String} dir - Name of directory to create 
 */
function mkdir(...args) {
  args.forEach(dir => {
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
    }
  });
}

/**
 * Creates a file if it does not exist
 * 
 * @param {String} file - Name of file to create
 * @param {String} content - Content of file
 */
function touch(file, content) {
  fs.writeFileSync(file, content);
}

/**
 * Main function
 */
function main() {
  // Add necessary directories
  mkdir('result', 'result/output', 'result/input');

  const content = `exerciseRepository ${process.cwd()}\\result\\output\nname1;GitHub-Url1;week1`;
  touch('result/input/repos-to-check.txt', content);
}

main();
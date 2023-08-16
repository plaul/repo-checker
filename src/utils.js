import {exec} from "child_process"
import fs from "fs"
import path from "path"


// Helper function to execute shell commands
export  function executeCommand(command)  {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stdout && stdout !=="") {
        resolve(stdout);
      } else if (stderr) {
        resolve(stderr);
      }
      if (error) {
        //console.warn(error);
        reject(error);
      }
    });
  });
}

/*
export  function executeCommand(command)  {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (stderr) {
        resolve(stderr);
      } else if (stdout) {
        resolve(stdout);
      }
      if (error) {
        //console.warn(error);
        reject(error);
      }
    });
  });
}
*/

// Helper function to delete folder recursively
export function deleteFolderRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file, index) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // recurse
        deleteFolderRecursive(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(dirPath);
  }
}

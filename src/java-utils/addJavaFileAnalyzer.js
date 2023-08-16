import path from "path"
import fs from "fs"

export function addJavaFilerAnalyzer(__dirname, cloneDir) {
  // Source path of JavaFileAnalyzer.java in your project
  const sourcePath = path.join(__dirname, 'JavaFileAnalyzer.java');

  const destDir = path.join(cloneDir, 'src', 'main', 'java', 'analyzer')
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  // Destination path in the cloned project
  const destinationPath = path.join(cloneDir, 'src', 'main', 'java', 'analyzer','JavaFileAnalyzer.java');
  
  fs.copyFileSync(sourcePath, destinationPath);
}
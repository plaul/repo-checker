import path from "path"
import fs from "fs"
import  { exec } from'child_process'
import {JAR_FILE_NAME} from "./addPluginsToPom.js"

export function getJavaFileDetailsFromJava(filePath,cloneDir) {
  const targetDir = path.join(cloneDir, "target")  
  const analyzerJar = path.join(targetDir,JAR_FILE_NAME);
  return new Promise((resolve, reject) => {
   exec(`java -jar ${analyzerJar} ${filePath}`, (error, stdout) => {
      if (error) {
        reject(error);
      } else {
        // Parse the output from the Java program
        const matches = stdout.match(/constructors=(\d+), fields=(\d+), methods=(\d+)/);
        if (matches) {
          resolve({
            constructors: parseInt(matches[1], 10),
            fields: parseInt(matches[2], 10),
            methods: parseInt(matches[3], 10)
          });
        } else {
          reject(new Error('Unexpected output format'));
        }
      }
    });
  });
}

const adjustForLombok = (content, details) => {
  if (content.includes("@Data") || content.includes("@Getter")) {
      details.methods += details.fields;  // For each field, a getter is added
  }

  if (content.includes("@Data") || content.includes("@Setter")) {
      details.methods += details.fields;  // For each field, a setter is added
  }

  if (content.includes("@AllArgsConstructor")) {
      details.constructors += 1;
  }

  if (content.includes("@NoArgsConstructor")) {
      details.constructors += 1;
  }

  // We're not considering all Lombok annotations, just a subset.
  // Additional annotations like @Builder would require more logic.

  return details;
};

const listFilesRecursiveWithJava = async (dirPath, indent = '') => {
  let result = '';
  const entries = fs.readdirSync(dirPath);

  for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const isDirectory = fs.lstatSync(fullPath).isDirectory();

      // Skip hidden directories
      if (isDirectory && (entry.startsWith('.') || entry === "target")) {
          continue;
      }

      // Detect if the file is a Java file
      if (entry.endsWith('.java') && entry !== "JavaFileAnalyzer.java") {
          const content = fs.readFileSync(fullPath, 'utf8');
          let details = await getJavaFileDetailsFromJava(fullPath,cloneDir);
          details = adjustForLombok(content, details);

          result += `${indent}${entry} (constructors=${details.constructors}, fields=${details.fields}, methods=${details.methods})\n`;
      } else {
          result += `${indent}${entry}\n`;
      }

      if (isDirectory) {
          result += await listFilesRecursive(fullPath, indent + '  ');
      }
  }

  return result;
};



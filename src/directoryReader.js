import { getJavaFileDetailsFromJava } from "./java-utils/javaDetailsFromJava.js"
import config from "../config.js"
import fs from "fs-extra"
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from "path"
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

//const repoUrl = 'https://github.com/kea-fall2023/carsw1.git';  // Replace with your repo URL
const cloneDir = path.join(__dirname, 'tempRepo');
const DIRECTORY = "##_dir_##"

// Helper function to extract Java file details
const getJavaFileDetails = (filePath) => {
  const content = fs.readFileSync(filePath, 'utf-8');

  // Simplified regex patterns to detect fields, methods, and constructors
  const fieldPattern = /\b(private|protected|public|static)?\s+\w+\s+\w+\s*;/g;
  const methodPattern = /\b(private|protected|public|static)?\s+\w+\s+\w+\s*\(/g;
  const constructorPattern = /(?:public|private|protected)\s+[A-Z][a-zA-Z0-9]*\s*\(/g;

  const fields = (content.match(fieldPattern) || []).length;
  const methods = (content.match(methodPattern) || []).length;
  const constructors = (content.match(constructorPattern) || []).length;

  return {
    fields,
    methods,
    constructors
  };
};

const adjustForLombok = (content, details) => {
  const includeJavaGetterAndSetter = config?.includeJavaGetterAndSetter
  if (includeJavaGetterAndSetter) {
    if (content.includes("@Data") || content.includes("@Getter")) {
      details.methods += details.fields;  // For each field, a getter is added
    }

    if (content.includes("@Data") || content.includes("@Setter")) {
      details.methods += details.fields;  // For each field, a setter is added
    }
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

let previousEntry = ""
export const listFilesRecursive = async (dirPath, indent = '', useJavaPackage) => {
  let result = '';
  const entries = fs.readdirSync(dirPath);
  for (const e of entries) {
    const fullPath = path.join(dirPath, e);
    const isDirectory = fs.lstatSync(fullPath).isDirectory();
    // Skip hidden directories
    if (isDirectory && (e.startsWith('.') || e === "target")) {
      continue;
    }

    const entry = isDirectory ? DIRECTORY + e : e
    if (config.skipFiles.includes(entry)) {
      continue
    }
    // Detect if the file is a Java file
    if (entry.endsWith('.java') && entry !== "JavaFileAnalyzer.java") {
      const content = fs.readFileSync(fullPath, 'utf8');
      let details
      if (useJavaPackage) {
        details = await getJavaFileDetailsFromJava(fullPath, cloneDir);
      } else {
        details = await getJavaFileDetails(fullPath)
      }
      details = adjustForLombok(content, details);
      result += `${indent}<div class="java-file">${entry} (constructors=${details.constructors}, fields=${details.fields}, methods=${details.methods})</div>\n`;
    } else {
      if (entry === `${DIRECTORY}src`) {
        result += `${indent}${entry}`;
      }
      else if ([`${DIRECTORY}java`, `${DIRECTORY}main`, `${DIRECTORY}test`].includes(entry) || previousEntry === "java") {
        if (entry === "test") {
          result += "#-_#src"
        }
        result += `.${entry}`;
        if (previousEntry === "java") {
          previousEntry = ""
          result += "\n"
        }
        if (entry === `${DIRECTORY}java`) {
          previousEntry = "java"
        }
      }
      else {
        result += `${indent}${entry}\n`;
      }
    }
    if (isDirectory) {
      result += await listFilesRecursive(fullPath, indent + '  ');
    }
  }
  return result;
};


function processString(input) {
  return input.split('\n').map(line => {
    // Check if the line contains the ##_dir_## tag
    if (line.includes('##_dir_##')) {
      // Remove all ##_dir_## tags
      let processedLine = line.replace(/##_dir_##/g, '');

      // Extract leading spaces
      const leadingSpaces = processedLine.match(/^\s*/)[0];

      // Trim the line to remove leading and trailing whitespaces
      processedLine = processedLine.trim();

      // Surround it with <p> tags
      return `${leadingSpaces}<p class="directory">${processedLine}</p>`;
    }

    // Return the original line if it doesn't contain the tag
    return line;
  }).join('\n');
}


function processContentV2(input) {
  return input.split('\n').map(line => {
    // Count leading spaces
    const leadingSpaces = line.match(/^\s*/)[0].length;

    // Calculate left margin based on leading spaces
    const leftMargin = (leadingSpaces / 2) * 5;

    // Check if the line already contains a <div> or <p> tag
    if (/<div>|<p>/.test(line)) {
      return line.trim().replace(/(\<div>|\<p>)/, `$1<style="margin-left:${leftMargin}px;">`);
    }
    // Check if the line starts with leading spaces but without a tag
    else if (leadingSpaces > 0) {
      return `<div style="margin-left:${leftMargin}px;">${line.trim()}</div>`;
    }
    // For lines with no leading spaces and not surrounded by a tag
    else {
      return `<div>${line.trim()}</div>`;
    }
  }).join('\n');
}

function removeSpaces(input) {
  return input.split('\n').map(line => {
    // Count leading spaces
    const leadingSpaces = line.match(/^\s*/)[0].length;

    // Calculate left margin based on leading spaces
    const leftMargin = (leadingSpaces / 2) * 8;

    // Check if the line already contains a <div> or <p> tag
    if (/<div|<p/.test(line)) {
      return line.trim().replace(/(\<div[^>]*>|\<p[^>]*>)/, match => `${match.slice(0, -1)} style="margin-left:${leftMargin}px;">`);
    }
    // Check if the line starts with leading spaces but without a tag
    else if (leadingSpaces > 0) {
      return `<div class="file" style="margin-left:${leftMargin}px;">${line.trim()}</div>`;
    }
    // For lines with no leading spaces and not surrounded by a tag
    else {
      return `<div class="file">${line.trim()}</div>`;
    }
  }).join('\n');
}

export async function readGithubRepo(cloneDir) {
  const fileList = await listFilesRecursive(cloneDir);
  const v1 = processString(fileList)
  const v2 = removeSpaces(v1)
  return v2
}
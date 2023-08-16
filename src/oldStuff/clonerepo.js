import { executeCommand, deleteFolderRecursive } from './utils/utils.js';

import { getJavaFileDetailsFromJava } from "./utils/javaDetailsFromJava.js"
import fs from "fs-extra"
import path from 'path';
import { setupAllJavaStuff } from "./utils/setupAllJavaStuff.js"
import { fileURLToPath } from 'url';
import { dirname } from "path"
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const repoUrl = 'https://github.com/kea-fall2023/carsw1.git';  // Replace with your repo URL
const cloneDir = path.join(__dirname, 'tempRepo');
const outputFile = path.join(__dirname, 'fileList.txt');


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

let previousEntry = ""
const listFilesRecursive = async (dirPath, indent = '',useJavaPackage) => {
  let result = '';
  const entries = fs.readdirSync(dirPath);
 
  for (const entry of entries) {
    
    const fullPath = path.join(dirPath, entry);
    const isDirectory = fs.lstatSync(fullPath).isDirectory();

    // Skip hidden directories
    if (isDirectory && (entry.startsWith('.') || entry === "target")) {
      continue;
    }

    
    //if(config.skipFiles.includes(entry)){
    //  continue
    //}
    // Detect if the file is a Java file
    if (entry.endsWith('.java') && entry !== "JavaFileAnalyzer.java") {
      const content = fs.readFileSync(fullPath, 'utf8');
      let details 
      if(useJavaPackage){
        details= await getJavaFileDetailsFromJava(fullPath, cloneDir);
      } else {
        details = await getJavaFileDetails(fullPath)
      }
      details = adjustForLombok(content, details);
      result += `${indent}${entry} (constructors=${details.constructors}, fields=${details.fields}, methods=${details.methods})\n`;
    } else {
     // result += `${indent}${entry}`;
      if(entry ==="src"){
        result += `${indent}${entry}`;
      }
      else if(["java","main","test"].includes(entry)|| previousEntry==="java"){
        result += `.${entry}`;
        if(previousEntry === "java"){
          previousEntry = ""
          result += "\n"
        }
        if(entry === "java"){
          previousEntry = "java"
        }
      }
      else{
        result += `${indent}${entry}\n`;
      }
    }
    if (isDirectory) {
      result += await listFilesRecursive(fullPath, indent + '  ');
    }
  }

  return result;
};



const cloneRepository = async () => {
  console.log(`Cloning ${repoUrl} into ${cloneDir}...`);
  await executeCommand(`git clone ${repoUrl} ${cloneDir}`);
}

const deleteRepository = async () => {
  console.log('Deleting the cloned directory...');
  deleteFolderRecursive(cloneDir);
}

const listFiles = async () => {
  try {
    console.log('Listing files and directories...');
    const fileList = await listFilesRecursive(cloneDir);
    fs.writeFileSync(outputFile, fileList);
    console.log(`Result written to ${outputFile}`);

  } catch (error) {
    console.error('Error executing tasks:', error);
  }
};


// Main function
const runMavenTask = async (task) => {
  console.log(`Running mvn clean ${task}...`);
  return executeCommand(`cd ${cloneDir} && mvn clean ${task}`);
};

const config = {
  deleteClonedRepositoryWhenDone: false,
  skipFiles : ["mvnw","mvnw.cmd","pom.xml",".gitignore"]
}

let status = "Status for XXXXXXX\n"



function parseMavenOutput(output) {
  const lines = output.split('\n');
  let capturing = false;
  let result = "";
  const TAB = "   "

  for (let line of lines) {
    // Start capturing on the first [ERROR] line
    if (line.startsWith("[ERROR] Failures")) {
      capturing = true;
      result += line.trim() + " \n";
      continue;
    }

    // Stop capturing when we reach [INFO] BUILD FAILURE
    if (line.startsWith("[INFO] BUILD FAILURE")) {
      capturing = false;
      break;
    }

    // If we are in capturing mode, process the line
    if (capturing) {
      if (line.startsWith("[ERROR]")) {
        result += TAB + line.replace("[ERROR]   ", "").trim() + " \n";  // Removing [ERROR] prefix and trimming whitespace
      } else if (line.startsWith("[ERROR] Tests run:")) {
        result += "\n" + TAB + line.replace("[ERROR] ", "").trim() + " \n";
      }
    }
  }
  return result.trim();
}


const runAll = async () => {
  //const f = await listFilesRecursive(cloneDir);
  //status += f
  //console.log(status)
  //return 
  try {
    await deleteRepository()
    try {
      const response =await cloneRepository()
      console.log(response)
    } catch (err) {
      status += "Jeg kunne ikke clone dit repository. Enten eksistere det ikke, eller er er private!"
      throw err
    }
    status += "Jeg har succesfuldt klonet dit projekt\n"
    let task = "compile"
    try {
      await runMavenTask(task);
      status += "Jeg havde efterfølgende ingen problemer med at bygge dit projekt\n"
      task = "test"
      let output = await runMavenTask(task)
      if (output.includes(['ERROR'])) {
        const formattedOutput = parseMavenOutput(output);
        status += "Der er test fejl i din afleverede løsning:\n"
        status += formattedOutput + "\n"
      }
      else { fs.writeFileSync(outputFile, fileList);
        status += "Ingen test problemer med din afleverede kode\n"
        //Kør kun package hvis test gik godt, ellers ved vi den vil fejle
        task = "package"
        await runMavenTask(task)
        status += "Det lykkes mig også at pakke dit projekt til en jar-fil\n"
      }
    } catch (error) {
      if (task === "compile") {
        status += "Jeg kunne ikke bygge dit clonede projekt med maven. Det er dårlig stil at skubbe kode op der ikke bygger!"
        throw new Error("Could not build")
      }
      if (task === "test") {
        console.log(error)
        status += "Ukendt fejl opstod i forbindelse med afvikling af test via maven\n"
        throw new Error("Could not test")
      }
      console.error(`Error executing maven ${task} - task`, error);
    }
    //await setupAllJavaStuff(cloneDir)
    await listFiles()
  } catch (err) {
    // console.log(err)
  }
  finally {
    //console.log(status)
    config.deleteClonedRepositoryWhenDone && deleteRepository()
  }
  const fileList = await listFilesRecursive(cloneDir);
  status+= "FILE-LISTING\n"
  status += fileList
  console.log(status)
  
}
//rAll()
runAll()

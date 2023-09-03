import { executeCommand, deleteFolderRecursive } from './utils.js';
import { readGithubRepo } from "./directoryReader.js"
import config from "../config.js"
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from "path"
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
let GIT_REPO_ROOT = ""
let studentName
let repoUrl
let localRepoName
let handinName
let cloneDir

export function setGitRepoRoot(root) {
  GIT_REPO_ROOT = path.join(root, "git-repos")
}

const cloneRepository = async () => {
  console.info(`Cloning ${repoUrl} into ${cloneDir}...`);
  return executeCommand(`git clone ${repoUrl} ${cloneDir}`);
}

const deleteRepository = async () => {
  console.info('Deleting the cloned directory...');
  return deleteFolderRecursive(cloneDir);
}

// Main function
const runMavenTask = async (task) => {
  console.log(`Running mvn clean ${task}...`);
  //return executeCommand(`cd ${cloneDir} && mvn clean ${task} 2>&1`);
  return executeCommand(`cd ${cloneDir} && mvn clean ${task}`);
};

function parseMavenOutput(output) {
  const hasTestErrors = output.includes('[ERROR] Failures');
  const isOk = output.includes('[INFO] BUILD SUCCESS');

  const lines = output.split('\n');
  let capturing = false;
  let result = "";
  const TAB = "<div style='margin-left:10px;'>"
  const ERR_TAB = "<div class='error' style='margin-left:10px;'>"
  const START = "<div>"
  const OK_START = "<div class='success'>"
  const ERR_START = "<div class='error'>"
  const END = "</div>"
  if (isOk) {
    for (let line of lines) {
      if (line.startsWith("[INFO] Tests run:")) {
        result += OK_START + line.trim() + END + " \n";
      }
      if (line.startsWith("[INFO] BUILD SUCCESS")) {
        break
      }
    }
  }
  else if (hasTestErrors) {
    for (let line of lines) {
      // Start capturing on the first [ERROR] line
      if (line.startsWith("[ERROR] Failures")) {
        capturing = true;
        result += ERR_START + line.trim() + END + " \n";
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
          result += ERR_TAB + line.replace("[ERROR]   ", "").trim() + END + " \n";  // Removing [ERROR] prefix and trimming whitespace
        } else if (line.startsWith("[ERROR] Tests run:")) {
          result += "\n" + ERR_TABTAB + line.replace("[ERROR] ", "").trim() + " \n";
        }
      }
    }
  }
  return result.trim();
}

const START = "<div class='info'>"
const ERR_START = "<div class='error'>"
const END = "</div>"
let status = ""
export const runAllTasks = async (sName, gitUrl, exName) => {
  studentName = sName
  repoUrl = gitUrl
  handinName = exName.replace(/ /g, "")
  status = "<div>#############################################################</div>\n"
  status += `<div class="subtitle">Status for ${studentName}</div>\n`
  status += "<div>#############################################################</div>\n"
  localRepoName = handinName + sName.replace(/ /g, "");
  cloneDir = path.join(GIT_REPO_ROOT, localRepoName);
  try {
    await deleteRepository()
    
    const cloneStatus = await cloneRepository()
    if(cloneStatus.includes("Repository not found")){
      status += ERR_START + "Jeg kunne ikke clone dit repository. Enten eksisterer det ikke, eller er PRIVATE!" + END
      throw new Error("Could not clone")
    }
    status += `${START}Jeg har succesfuldt klonet dit projekt (<a href="${repoUrl}">Repo</a>) ${END}\n`
    
    let task = "package"
    try {
      let output = await runMavenTask(task)
      const formattedOutput = parseMavenOutput(output);
      //if(output.includes("ERROR") && !output.includes("[ERROR] Tests run:")){  
      //  status += `${ERR_START}Jeg kunne IKKE bygge dit projekt\n${END}\n`
      //}
      if(output.includes("COMPILATION ERROR")){  
        status += `${ERR_START}Jeg kunne IKKE bygge (compilere) dit projekt\n
        Det er dårlig stil at skubbe kode op der ikke bygger!\n
        ${END}\n`
      }
      else if (output.includes(['[ERROR] Tests run:'])) {
        status += `${ERR_START}Der er test fejl i din afleverede løsning:${END}\n`
        status += formattedOutput + "\n"
      }
      else {
        status += `${START}Ingen test problemer med din afleverede kode${END}\n`
        status += formattedOutput + "\n"
        if(output.includes("[INFO] Building jar:")){
          status += `${START}Det lykkes mig at pakke dit projekt til en jar-fil${END}\n`
        }
      }
    } catch (error) {
      if (task === "compile") {
        status += `${ERR_START}Jeg kunne ikke bygge dit clonede projekt med maven. Det er dårlig stil at skubbe kode op der ikke bygger!${END}`
        throw new Error("Could not build")
      }
      if (task === "test") {
        console.log(error)
        status += `${ERR_START}Ukendt fejl opstod i forbindelse med afvikling af test via maven${END}\n`
        throw new Error("Could not test")
      }
      console.error(`Error executing maven ${task} - task`, error);
    }
    //await setupAllJavaStuff(cloneDir)
    status += "<div style='margin-top:10px;'>############## Reading Directory Details ###############</div>"
    status += await readGithubRepo(cloneDir)
  } catch (err) {
    console.log(err)
    status += `${ERR_START}${err.message}${END}\n`
  }
  finally {
    config.deleteClonedRepositoryWhenDone && deleteRepository()
  }
  return status
  //fs.writeFileSync(outputFile, status);  
}

//runAllTasks("Donald Duck","https://github.com/kea-fall2023/carsw1.git","Uge 1")

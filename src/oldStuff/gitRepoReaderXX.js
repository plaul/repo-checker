import { readGithubRepo } from "../directoryReader.js"
import fs from "fs"
import path from "path"
import { fileURLToPath } from 'url';
import { dirname } from "path"
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const cloneDir = path.join(__dirname, 'tempRepo');
const outputFile = path.join(__dirname, 'file.html');

async function tester() {
  try {
    const fileList = await readGithubRepo(cloneDir)
    fs.writeFileSync(outputFile, fileList);
    console.log(`Result written to ${outputFile}`);

  } catch (error) {
    console.error('Error executing tasks:', error);
  }
}
//tester()

import {updatePomPlugins} from "./addPluginsToPom.js"
import addJavaParserDependency from './addJavaParserDependency.js';
import { addJavaFilerAnalyzer } from "./addJavaFileAnalyzer.js"

import { fileURLToPath } from 'url';
import { dirname } from "path"
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export async function setupAllJavaStuff(cloneDir){

  await addJavaParserDependency(cloneDir)
  await addJavaFilerAnalyzer(__dirname, cloneDir)
  updatePomPlugins(cloneDir)
}
import xml2js from 'xml2js';
import fs from "fs-extra"
import path from 'path';

//Add the com.github.javaparser dependency to an existing pom-file
export default async function addJavaParserDependency (rootPath)  {
  const pomFilePath = path.join(rootPath, "pom.xml")
  const parser = new xml2js.Parser();
  const builder = new xml2js.Builder();

  const xmlContent = fs.readFileSync(pomFilePath, 'utf8');
  const pomObject = await parser.parseStringPromise(xmlContent);

  // Define the JavaParser dependency
  const javaParserDependency = {
    groupId: 'com.github.javaparser',
    artifactId: 'javaparser-core',
    version: '3.23.1'
  };

  // Check if dependencies tag exists; if not, create one
  if (!pomObject.project.dependencies) {
    pomObject.project.dependencies = [{ dependency: [] }];
  }

  // Check if the dependency array exists within it; if not, create one
  if (!pomObject.project.dependencies[0].dependency) {
    pomObject.project.dependencies[0].dependency = [];
  }

  // Add the JavaParser dependency
  pomObject.project.dependencies[0].dependency.push(javaParserDependency);

  // Convert back to XML and write to file
  const updatedXmlContent = builder.buildObject(pomObject);
  fs.writeFileSync(pomFilePath, updatedXmlContent);
}

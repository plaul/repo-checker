import fs from "fs"
import path from "path"
import xml2js from 'xml2js';

const FINAL_NAME = "project-with-javafileanalyzer"
//IMPORTANT You cannot rename this, but its needed with THIS value in the maven-assembly-plugin
const DESCRIPTOR = 'jar-with-dependencies'
const MAIN_CLASS = "analyzer.JavaFileAnalyzer" 
export const JAR_FILE_NAME = `${FINAL_NAME}-${DESCRIPTOR}.jar`

/**
 * Adds or updates the spring-boot-maven-plugin with a configuration <skip>true</skip>
 * @param {*} xmlObj 
 */
export function updateSpringBootMavenPlugin(xmlObj) {
  let foundSpringBootPlugin = false;

  xmlObj.project.build[0].plugins[0].plugin.forEach(plugin => {
      const artifactId = plugin.artifactId[0];

      if (artifactId === 'spring-boot-maven-plugin') {
          foundSpringBootPlugin = true;
          if (!plugin.configuration) {
              plugin.configuration = [{}];
          }
          plugin.configuration[0].skip = ['true'];
      }
  });

  if (!foundSpringBootPlugin) {
      const newPlugin = {
          groupId: ['org.springframework.boot'],
          artifactId: ['spring-boot-maven-plugin'],
          configuration: [{
              skip: ['true']
          }]
      };
      xmlObj.project.build[0].plugins[0].plugin.push(newPlugin);
  }
}

export function updateMavenJarPlugin(xmlObj) {
  let foundJarPlugin = false;

  xmlObj.project.build[0].plugins[0].plugin.forEach(plugin => {
      const artifactId = plugin.artifactId[0];

      if (artifactId === 'maven-jar-plugin') {
          foundJarPlugin = true;
          plugin.configuration = [{
              archive: [{
                  manifest: [{
                      mainClass: [MAIN_CLASS]
                  }]
              }]
          }];
      }
  });

  if (!foundJarPlugin) {
      const newPlugin = {
          groupId: ['org.apache.maven.plugins'],
          artifactId: ['maven-jar-plugin'],
          version: ['3.2.0'],
          configuration: [
            {
              finalName: FINAL_NAME,
              archive: [{
                  manifest: [{
                      mainClass: [MAIN_CLASS]
                  }]
              }]
          }]
      };
      xmlObj.project.build[0].plugins[0].plugin.push(newPlugin);
  }
}

export function updateMavenAssemblyPlugin(xmlObj) {
  let foundAssemblyPlugin = false;

  xmlObj.project.build[0].plugins[0].plugin.forEach(plugin => {
      const artifactId = plugin.artifactId[0];

      if (artifactId === 'maven-assembly-plugin') {
          foundAssemblyPlugin = true;
          plugin.configuration = [{
              descriptorRefs: [{
                  descriptorRef: [DESCRIPTOR]
              }],
              archive: [{
                  manifest: [{
                      mainClass: [MAIN_CLASS]
                  }]
              }]
          }];
          plugin.executions = [{
              execution: [{
                  id: ['make-assembly'],
                  phase: ['package'],
                  goals: [{
                      goal: ['single']
                  }]
              }]
          }];
      }
  });

  if (!foundAssemblyPlugin) {
      const newPlugin = {
          groupId: ['org.apache.maven.plugins'],
          artifactId: ['maven-assembly-plugin'],
          version: ['3.3.0'],
          configuration: [{
            finalName: FINAL_NAME,
              descriptorRefs: [{descriptorRef: [DESCRIPTOR]
              }],
              archive: [{
                  manifest: [{
                      mainClass: [MAIN_CLASS]
                  }]
              }]
          }],
          executions: [{
              execution: [{
                  id: ['make-assembly'],
                  phase: ['package'],
                  goals: [{
                      goal: ['single']
                  }]
              }]
          }]
      };
      xmlObj.project.build[0].plugins[0].plugin.push(newPlugin);
  }
}


export async function updatePomPlugins(rootPath){
    const pomFilePath = path.join(rootPath, "pom.xml")
    const parser = new xml2js.Parser();
    const builder = new xml2js.Builder();
  
    const xmlContent = fs.readFileSync(pomFilePath, 'utf8');

  // Parse the XML content
  const parsedXmlObject = await parser.parseStringPromise(xmlContent);
  
  // Update the parsed object using the functions
  updateSpringBootMavenPlugin(parsedXmlObject);
  updateMavenJarPlugin(parsedXmlObject);
  updateMavenAssemblyPlugin(parsedXmlObject);
  // Convert the updated object back to XML
  const updatedXml = builder.buildObject(parsedXmlObject);  
  // Save the updated XML back to the pom.xml file
  fs.writeFileSync(pomFilePath, updatedXml);  
}


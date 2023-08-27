import fs from 'fs';
import { runAllTasks, setGitRepoRoot } from "./src/gitRepoInvestigator.js"
import path from 'path';

function isValidLine(line) {
  // Use a regular expression to verify the structure
  // This regex captures any character (except semicolon) before and after the GitHub repo URL
  const regex = /^[^;]+;https:\/\/github\.com\/[^\/]+\/[^\/]+;[^;]+$/;
  return regex.test(line);
}

function readAndParseFile(filePath) {
  let content = "";
  try {
     content = fs.readFileSync(filePath, 'utf-8');
  }
  catch (err) {
    console.error(`Could not read file ${filePath}. Exiting.`)
    process.exit(1);
  }
  const lines = content.split('\n').map(line => line.trim()); // remove newline and 
  let exerciseDirectory = "";
  if (lines[0].startsWith("exerciseRepository")) {
    exerciseDirectory = lines[0].split(" ")[1];
    lines.shift();//remove the line
  }
  else {
    console.error("First line must be 'exerciseRepository: <path>'");
    console.error("Fix this, and try again. ");
    process.exit(1);
  }
  const validLines = lines.filter(isValidLine);
  const nonValidLines = lines.filter(line => !isValidLine(line));
  return {
    exerciseDirectory,
    validLines,
    nonValidLines,
  };
}

async function main(...args) {
  // Get the path to the file containing the configuration
  const file = `${process.cwd()}\\result\\input\\repos-to-check.txt`;
  
  // Open and parse lines from file
  let lines
  try{
    console.log(`Reading file ${file}`);
    lines = readAndParseFile(file)
  }catch(err) {
    console.error("Error");
    console.error(`Could not read file ${file}. Exiting.`)
    process.exit(1);
  }
  
  // Check if there are any NON valid lines in the file
  // and print them to the console
  if (lines.nonValidLines.length > 0) {
    console.error("The following lines are not valid, and will not be used:");
    lines.nonValidLines.forEach(line => console.log(line));
    //process.exit(1);
  }

  // Check if there are any valid lines in the file
  // and exit the program if not
  if (lines.validLines.length === 0) {
    console.log("No valid lines found. Exiting.");
    return;
  }

  // Set the output directory for the results
  setGitRepoRoot(lines.exerciseDirectory);

  // Run the repo-checker for each repository found on each line
  const results = [];
  for (const studentHandin of lines.validLines) {
    console.log(studentHandin);
    const arr = studentHandin.split(";")
    const [studentName, gitUrl, exerciseName] = studentHandin.split(";");
    const res = await runAllTasks(studentName, gitUrl, exerciseName);
    results.push(res);
  }

  // Create a HTML file with the results
  const status = results.join("<br><br>")
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
    <style>
    .directory {
      margin-top: 0px;
      padding:0px;
      margin-bottom: 0px;
      color:blue;
    }
    .java-file  {
      font-weight: 700;
      color: darkgreen
    }
    .error {
      font-weight: bold;
      color:red
    }
    .subtitle {
        font-size: 2em;
    }
    .success {
        color: green;
    }
  </style>
</head>
<body style="font-family: sans-serif;">
  ${status}
</body>
</html>
 `

  // Write the HTML file to the output directory
  const outputFileName = path.join(lines.exerciseDirectory, "index.html");
  console.log(`Writing output to ${outputFileName}`);
  fs.writeFileSync(outputFileName, html);
}

main(...process.argv);
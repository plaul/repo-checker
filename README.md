# Installation
1. Install dependencies.
```
$ npm install
```
2. Generate config directories and files.
```
$ npm run generate
```
3. Open `./result/input/repos-to-check.txt` and configure the repositories you want to check.
The output of your `repos-to-check.txt`-file should contain some predefined input similair to below:
```
exerciseRepository C:\Users\pc\Desktop\repo-checker\result\output
name1;GitHub URL;week1
```
The first line `exerciseRepository` specifies the directory where the repo-checker should output the results. You can easily change this path to another, if prefered.

The following line: `name1;GitHub URL;week1` specifies the repository the application should inspect. Replace the keys with something like `someName;https://github.com/username/repository;week1`. Note: you can inspect multiple repositories by adding multiple lines specifying repositories, for example:
```
someName;https://github.com/username/repository;week1
someName2;https://github.com/username2/repository2;week1
someName3;https://github.com/username3/repository3;week1
```
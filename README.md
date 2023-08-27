# How to use

1. Install dependencies.
```
$ npm install
```
1. Generate a config file and the directory to hold generated results.

Create a file repos-to-check.txt with  content as illustrated below
```
exerciseRepository C:\Users\pc\Desktop\repo-checker\result\output
name1;GitHub URL;week1
```
The first line `exerciseRepository` specifies the directory where the repo-checker should output the results. You can change this path to another, if prefered.

The following line: `name1;GitHub URL;week1` specifies the repository the application should inspect. Replace the keys with something like `studentName;https://github.com/username/repository;week1`. Note: you can inspect multiple repositories by adding multiple lines specifying repositories, for example:
```
someName;https://github.com/username/repository;week1
someName2;https://github.com/username2/repository2;week1
someName3;https://github.com/username3/repository3;week1
```
3. Execute the start command to inspect the repositories.
```
$ npm start repos-to-check.txt
```
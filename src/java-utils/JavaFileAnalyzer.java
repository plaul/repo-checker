package analyzer;

import com.github.javaparser.JavaParser;
import com.github.javaparser.ParseResult;
import com.github.javaparser.ast.CompilationUnit;
import com.github.javaparser.ast.body.ClassOrInterfaceDeclaration;
import com.github.javaparser.ast.body.ConstructorDeclaration;
import com.github.javaparser.ast.body.FieldDeclaration;
import com.github.javaparser.ast.body.MethodDeclaration;

import java.io.File;
import java.io.IOException;
import java.util.Optional;

public class JavaFileAnalyzer {

    public static void main(String[] args) {
        if (args.length != 1) {
            System.out.println("Please provide a Java file path as an argument.");
            return;
        }

        String filePath = args[0];
        analyzeJavaFile(filePath);
    }

    public static void analyzeJavaFile(String filePath) {
        File file = new File(filePath);
        JavaParser javaParser = new JavaParser();

        try {
            ParseResult<CompilationUnit> parseResult = javaParser.parse(file);
            if (parseResult.isSuccessful()) {
                Optional<CompilationUnit> optCu = parseResult.getResult();
                if (optCu.isPresent()) {
                    CompilationUnit cu = optCu.get();
                    cu.findAll(ClassOrInterfaceDeclaration.class).forEach(cls -> {
                        int numConstructors = cls.findAll(ConstructorDeclaration.class).size();
                        int numFields = cls.findAll(FieldDeclaration.class).size();
                        int numMethods = cls.findAll(MethodDeclaration.class).size();

                        System.out.println(cls.getName() + ": constructors=" + numConstructors + ", fields=" + numFields + ", methods=" + numMethods);
                    });
                }
            } else {
                System.out.println("Error parsing the Java file.");
                parseResult.getProblems().forEach(problem -> System.out.println(problem.toString()));
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }
}

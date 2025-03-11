#!/usr/bin/env node
import fs from "fs";
import path from "path";
import * as ts from "typescript";

// read the path argument
const resourceDir = process.argv[2] ?? "src/language";

// Update the i18ncodegen.json configuration
const configPath = "./node_modules/typescript-i18n-transformer/tsconfig.i18ncodegen.json";

// Read the existing config
const i18ncodegenJson = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Update the resource directory
i18ncodegenJson.compilerOptions.plugins[0].resourceDir = resourceDir;

// Write the updated config back
fs.writeFileSync(configPath, JSON.stringify(i18ncodegenJson, null, 2));

// Run the TypeScript compiler programmatically
function compileWithTsApi(configPath: string): void {
    console.log(`Compiling TypeScript project with config: ${configPath}`);
    
    try {
        // Read the config file
        const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
        
        if (configFile.error) {
            throw new Error(`Error reading config file: ${configFile.error.messageText}`);
        }
        
        // Parse the config
        const parsedConfig = ts.parseJsonConfigFileContent(
            configFile.config,
            ts.sys,
            path.dirname(configPath)
        );
        
        if (parsedConfig.errors.length) {
            throw new Error(`Error parsing config: ${parsedConfig.errors[0].messageText}`);
        }
        
        // Load the transformer module
        const transformerPath = path.resolve(path.dirname(configPath), i18ncodegenJson.compilerOptions.plugins[0].transform);
        const transformerModule = require(transformerPath);
        
        // Create a program
        const program = ts.createProgram({
            rootNames: parsedConfig.fileNames,
            options: parsedConfig.options
        });
        
        // Create the custom transformer
        const transformerFactory = transformerModule.default(program, { 
            resourceDir: i18ncodegenJson.compilerOptions.plugins[0].resourceDir 
        });
        
        // Emit output with custom transformer
        const emitResult = program.emit(
            undefined, // targetSourceFile
            undefined, // writeFile
            undefined, // cancellationToken
            undefined, // emitOnlyDtsFiles
            { before: [transformerFactory] } // customTransformers
        );
        
        // Report diagnostics
        const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);
        
        allDiagnostics.forEach(reportDiagnostic);
        
        if (emitResult.emitSkipped) {
            throw new Error("TypeScript compilation failed");
        }
        
        console.log('TypeScript compilation completed successfully.');
    } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

// Helper function for reporting diagnostics
function reportDiagnostic(diagnostic: ts.Diagnostic): void {
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
    
    if (diagnostic.file) {
        const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
        console.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
        console.error(message);
    }
}

// Run the compiler
compileWithTsApi(configPath);

#!/usr/bin/env node
import path from "path";
import * as ts from "typescript";
import { parseArgs } from "util";

import i18nUpdateTableTransformer from "./i18nUpdateTableTransformer";

const args = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
        resourceDir: { type: "string", short: "r", default: "src/language" },
        tsConfigPath: { type: "string", short: "c", default: "tsconfig.json" }
    }
});

// Run the TypeScript compiler programmatically
function compileWithTsApi(configPath: string): void {
    console.log(`Transforming TypeScript project with config: ${configPath}`);

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

        parsedConfig.options.skipLibCheck = true;
        parsedConfig.options.noEmit = true;
        parsedConfig.options.declaration = true;

        // Create a program
        const program = ts.createProgram({
            rootNames: parsedConfig.fileNames,
            options: parsedConfig.options
        });

        // Create the custom transformer
        const transformerFactory = i18nUpdateTableTransformer(program, {
            resourceDir: args.values.resourceDir
        });

        // Emit output with custom transformer
        const emitResult = program.emit(
            undefined, // targetSourceFile
            undefined, // writeFile
            undefined, // cancellationToken
            undefined, // emitOnlyDtsFiles
            { before: [transformerFactory] } // customTransformers
        );
        emitResult;

        // // Report diagnostics
        // const allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

        // allDiagnostics.forEach(reportDiagnostic);

        // if (emitResult.emitSkipped) {
        //     throw new Error("TypeScript compilation failed");
        // }

        // console.log("TypeScript compilation completed successfully.");

        console.log("TypeScript transformation completed successfully.");
    } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

// Helper function for reporting diagnostics
// function reportDiagnostic(diagnostic: ts.Diagnostic): void {
//     const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");

//     if (diagnostic.file) {
//         const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
//         console.error(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
//     } else {
//         console.error(message);
//     }
// }

// Run the compiler
compileWithTsApi(args.values.tsConfigPath);

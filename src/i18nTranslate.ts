#!/usr/bin/env node
import path from "path";
import * as ts from "typescript";
import { parseArgs } from "util";

import type { FunctionCallMap, TranslationMap } from "./i18nTranslationTransformer";
import i18nTranslationTransformer, { I18nTranslationTransformerCache } from "./i18nTranslationTransformer";

const args = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
        resourceDir: { type: "string", short: "r", default: "src/language" },
        configPath: { type: "string", short: "c", default: "tsconfig.json" }
    }
});

// Run the TypeScript compiler programmatically
async function compileWithTsApi(configPath: string): Promise<void> {
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

        const transformerCache = new I18nTranslationTransformerCache();
        const functionCallMap: FunctionCallMap = {};

        // phase 1: build function call map
        {
            // Create the custom transformer
            const transformerFactory = i18nTranslationTransformer(program, {
                resourceDir: args.values.resourceDir,
                functionCallMapOutput: functionCallMap,
                cache: transformerCache
            });

            // Emit output with custom transformer
            program.emit(
                undefined, // targetSourceFile
                undefined, // writeFile
                undefined, // cancellationToken
                undefined, // emitOnlyDtsFiles
                { before: [transformerFactory] } // customTransformers
            );
        }

        // phase 2: translate with GPT 4o
        // TODO: implement
        const translationMap: TranslationMap = {};

        // phase 3: update table
        {
            // Create the custom transformer
            const transformerFactory = i18nTranslationTransformer(program, {
                resourceDir: args.values.resourceDir,
                translationMap: translationMap,
                cache: transformerCache
            });

            // Emit output with custom transformer
            program.emit(
                undefined, // targetSourceFile
                undefined, // writeFile
                undefined, // cancellationToken
                undefined, // emitOnlyDtsFiles
                { before: [transformerFactory] } // customTransformers
            );
        }

        console.log("TypeScript transformation completed successfully.");
    } catch (error) {
        console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
}

// Run the compiler
compileWithTsApi(args.values.configPath);

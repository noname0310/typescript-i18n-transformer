#!/usr/bin/env node
import fs from "fs";
import openAi from "openai";
import path from "path";
import ts from "typescript";
import { parseArgs } from "util";

import type { TranslationMap, TranslationRequestData } from "./i18nTranslationTransformer";
import i18nTranslationTransformer, { I18nTranslationTransformerCache } from "./i18nTranslationTransformer";

// OpenAI configuration
const openAiClient = new openAi.OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Function to get context from source file
async function getTranslationContext(filePath: string, position: number): Promise<string> {
    try {
        const content = await fs.promises.readFile(filePath, "utf-8");
        const start = Math.max(0, position - 300);
        const end = Math.min(content.length, position + 300);
        return content.slice(start, end);
    } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
        return "";
    }
}

// Function to translate text using GPT-4 with context
async function translateWithGPT4o(
    text: string,
    contexts: string[],
    targetLanguage: string
): Promise<string> {
    try {
        const formattedContexts = contexts
            .map((ctx, index) => `Context ${index + 1}:\n${ctx}`)
            .join("\n\n");

        const response = await openAiClient.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are a professional translator. Translate the given text to ${targetLanguage}. 
                    Consider ALL provided code contexts to ensure accurate translation.
                    The text might appear in multiple places - use all contexts to understand its usage.
                    Respond with ONLY the translation, no explanations or additional text.`
                },
                {
                    role: "user",
                    content: `${formattedContexts}\n\nText to translate: "${text}"`
                }
            ],
            temperature: 0.3,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            max_tokens: 100
        });

        return response.choices[0]?.message?.content?.trim() ?? text;
    } catch (error) {
        console.error(`Translation error for "${text}":`, error);
        return text;
    }
}

const args = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
        resourceDir: { type: "string", short: "r", default: "src/language" },
        configPath: { type: "string", short: "c", default: "tsconfig.json" },
        defaultLanguage: { type: "string", short: "d" }
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
        const translationRequestData: TranslationRequestData = {
            functionCallMap: {},
            untranslatedKeys: {}
        };

        // phase 1: build function call map
        {
            // Create the custom transformer
            const transformerFactory = i18nTranslationTransformer(program, {
                resourceDir: args.values.resourceDir,
                translationRequestData,
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
        const translationMap: TranslationMap = {};

        // Skip translation for default language
        const defaultLanguage = args.values.defaultLanguage;

        // Process each language's untranslated keys
        for (const [language, untranslatedKeySet] of Object.entries(translationRequestData.untranslatedKeys)) {
            // Skip default language
            if (language === defaultLanguage) {
                continue;
            }

            console.log(`Translating to ${language}...`);
            translationMap[language] = {};

            // Process each untranslated key
            for (const key of untranslatedKeySet) {
                const functionCalls = translationRequestData.functionCallMap[key];
                if (!functionCalls || functionCalls.length === 0) {
                    continue;
                }

                // Gather context from all occurrences
                const contexts = await Promise.all(
                    functionCalls.map(({ filePath, pos }) => getTranslationContext(filePath, pos))
                );

                // Extract the actual text to translate (key part after the namespace)
                const textToTranslate = key.split(".")[1];

                // Translate the text with all contexts
                const translation = await translateWithGPT4o(textToTranslate, contexts, language);
                translationMap[language][key] = translation;

                // Log progress
                console.log(`Translated ${key} (${functionCalls.length} occurrences): ${translation}`);
            }
        }

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

import fs from "fs";
import path from "path";
import ts, { factory } from "typescript";

import type { I18nData } from "./i18n";
import { i18nConstructorComment, locTextMethodComment, nsLocTextMethodComment } from "./i18nTransformerConstants";
import { chainBundle, getNodeComment, resolveAliasedSymbol } from "./transformerCommon";

class TransformerBuilder {
    private readonly _program: ts.Program;
    private readonly _locTextMethodSymbols: Set<ts.Symbol>;
    private readonly _nsLocTextMethodSymbols: Set<ts.Symbol>;
    private readonly _replaceTable: Map<string, [number, number]>; // key: namespace.key, value: [index, foundCount]
    private readonly _availableLanguages: Set<string>;

    public constructor(
        program: ts.Program,
        config?: TransformerConfig
    ) {
        this._program = program;

        this._locTextMethodSymbols = new Set();
        this._nsLocTextMethodSymbols = new Set();

        this._availableLanguages = this._gatherMethodSymbolsAndGetConfig();
        const {table, languages} = this._buildReplacementTable();

        config; // for future use
    }

    public makeTransformer<T extends ts.Bundle | ts.SourceFile>(
        context: ts.TransformationContext
    ): ts.Transformer<T> {
        const visitor = (sourceFile: ts.SourceFile): ts.SourceFile => {
            return this._transformI18nMinify(sourceFile, context);
        };

        return chainBundle(visitor);
    }

    private static _getNamespaceFromFileName(fileName: string): string | undefined {
        const dotIndex = fileName.lastIndexOf(".");
        if (dotIndex === -1) {
            return undefined;
        }
        const dot2Index = fileName.lastIndexOf(".", dotIndex - 1);
        if (dot2Index === -1) {
            return undefined;
        }
        return fileName.slice(0, dot2Index);
    }

    private static _getLanguageFromFileName(fileName: string): string | undefined {
        const dotIndex = fileName.lastIndexOf(".");
        if (dotIndex === -1) {
            return undefined;
        }
        const dot2Index = fileName.lastIndexOf(".", dotIndex - 1);
        if (dot2Index === -1) {
            return undefined;
        }
        return fileName.slice(dot2Index + 1, dotIndex);
    }

    private _gatherMethodSymbolsAndGetConfig(): [string | undefined, string[]] {
        let resourcePath: string | undefined = undefined;
        const supportedLanguages: string[] = [];

        const checker = this._program.getTypeChecker();
        for (const sourceFile of this._program.getSourceFiles()) {
            const visitor = (node: ts.Node): void => {
                if (ts.isMethodDeclaration(node)) {
                    const symbol = checker.getSymbolAtLocation(node.name);
                    if (!symbol) return;
                    const comment = getNodeComment(node);
                    if (comment.includes(locTextMethodComment)) {
                        this._locTextMethodSymbols.add(symbol);
                    } else if (comment.includes(nsLocTextMethodComment)) {
                        this._nsLocTextMethodSymbols.add(symbol);
                    }
                }

                if (ts.isNewExpression(node)) {
                    const symbol = resolveAliasedSymbol(checker, checker.getSymbolAtLocation(node.expression));
                    if (symbol) {
                        const comment = getNodeComment(node);
                        if (comment.includes(i18nConstructorComment)) {
                            if (resourcePath !== undefined) {
                                console.error("Multiple I18N constructors found in the program");
                            } else {
                                const args = node.arguments;
                                if (args === undefined || args.length < 2) {
                                    throw new Error("I18N constructor must have at least two arguments");
                                }

                                const resourcePathArg = args[0];
                                if (!ts.isStringLiteral(resourcePathArg)) {
                                    throw new Error("I18N constructor must have a string literal argument");
                                }
                                resourcePath = resourcePathArg.text;

                                const languagesArg = args[1];
                                if (!ts.isArrayLiteralExpression(languagesArg)) {
                                    throw new Error("I18N constructor must have an array literal argument");
                                }
                                for (const element of languagesArg.elements) {
                                    if (!ts.isStringLiteral(element)) {
                                        throw new Error("I18N constructor array literal must have string literal elements");
                                    }
                                    supportedLanguages.push(element.text);
                                }
                            }
                        }
                    }
                }

                ts.forEachChild(node, visitor);
            };
            ts.forEachChild(sourceFile, visitor);
        }

        if (resourcePath === undefined) {
            console.error("No I18N constructor found in the program");
        }

        if (this._locTextMethodSymbols.size === 0 && this._nsLocTextMethodSymbols.size === 0) {
            console.error("No I18N loc text method found in the program");
        }

        return [resourcePath, supportedLanguages];
    }

    private _buildReplacementTable(resourcePath: string, availableLanguages: readonly string[]): {
        files: string[],
        table: Map<string, [number, number]>
    } {
        const table: Map<string, [number, number]> = new Map(); // key: namespace.key, value: [index, foundCount]

        const availableExtensions = availableLanguages.map(language => `.${language}.json`);
        const files = fs.readdirSync(resourcePath).filter(file => {
            if (path.extname(file) !== ".json") {
                return false;
            }

            const dotIndex = file.lastIndexOf(".");
            const dot2Index = dotIndex === -1 ? -1 : file.lastIndexOf(".", dotIndex - 1);
            if (dot2Index === -1) {
                return false;
            }

            const extension = file.slice(dot2Index);
            return availableExtensions.includes(extension);
        });

        const indexStore = new Map<string, number>(); // key: namespace, value: nextIndex
        for (const file of files) {
            const namespace = TransformerBuilder._getNamespaceFromFileName(file);
            if (namespace === undefined) {
                continue;
            }
            const filePath = path.join(resourcePath, file);
            const content = fs.readFileSync(filePath, "utf8");

            const staticTable = (JSON.parse(content) as I18nData).table;
            for (const key of Object.keys(staticTable)) {
                const fullKey = `${namespace}.${key}`;
                let item = table.get(fullKey);
                if (item === undefined) {
                    const index = indexStore.get(namespace) ?? 0;
                    indexStore.set(namespace, index + 1);
                    item = [index, 0];
                    table.set(fullKey, item);
                }
                item[1] += 1;
            }
        }

        // Check if all languages have the same number of keys
        {
            const languageCount = availableLanguages.length;
            for (const [key, item] of table) {
                if (item[1] !== languageCount) {
                    console.error(`I18N table key has partial translations: ${key}`);
                }
            }
        }

        return { files, table };
    }

    private _transformI18nMinify(
        sourceFile: ts.SourceFile,
        context: ts.TransformationContext
    ): ts.SourceFile {
        const checker = this._program.getTypeChecker();
        const languageCount = this._availableLanguages.length;
        const visitor = (node: ts.Node): ts.Node => {
            // Replace I18N loc text table keys
            // if (ts.isExportAssignment(node)) {
            //     const comment = getNodeComment(node);
            //     if (comment.includes(tableComment)) {
            //         if (!ts.isObjectLiteralExpression(node.expression)) {
            //             return node;
            //         }
            //         const tableObj = node.expression;
            //         const newProperties = tableObj.properties.map(prop => {
            //             if (ts.isPropertyAssignment(prop)) {
            //                 if (!ts.isStringLiteral(prop.name)) {
            //                     return prop;
            //                 }
            //                 const key = prop.name.text;
            //                 const index = this._replaceTable.get(key);
            //                 if (index === undefined) {
            //                     console.error(`I18N table key not found: ${key}`);
            //                     return prop;
            //                 } else if (index[1] !== languageCount) {
            //                     return prop;
            //                 }
            //                 const newKey = factory.createNumericLiteral(index[0]);
            //                 return factory.createPropertyAssignment(newKey, prop.initializer);
            //             }
            //             return prop;
            //         });
            //         const newTableObj = factory.createObjectLiteralExpression(newProperties);
            //         return factory.updateExportAssignment(node, node.modifiers, newTableObj);
            //     }
            // }

            // Replace I18N loc text method calls
            if (ts.isCallExpression(node)) {
                const symbol = resolveAliasedSymbol(checker, checker.getSymbolAtLocation(node.expression));
                if (symbol) {
                    if (this._locTextMethodSymbols.has(symbol)) {
                        const args = node.arguments.slice();
                        let updated = false;
                        if (1 <= args.length && ts.isStringLiteral(args[0])) {
                            const key = args[0].text;
                            const index = this._replaceTable.get("default." + key);
                            if (index === undefined) {
                                console.error(`I18N loc text key not found: ${key}`);
                            } else if (index[1] === languageCount) {
                                args[0] = factory.createNumericLiteral(index[0]);
                                updated = true;
                            }
                        }
                        if (updated) {
                            return factory.updateCallExpression(node, node.expression, node.typeArguments, args);
                        }
                    } else if (this._nsLocTextMethodSymbols.has(symbol)) {
                        const args = node.arguments.slice();
                        let updated = false;
                        if (2 <= args.length && ts.isStringLiteral(args[0]) && ts.isStringLiteral(args[1])) {
                            const namespace = args[0].text;
                            const key = args[1].text;
                            const index = this._replaceTable.get(namespace + "." + key);
                            if (index === undefined) {
                                console.error(`I18N loc text key not found: ${key}`);
                            } else if (index[1] === languageCount) {
                                args[1] = factory.createNumericLiteral(index[0]);
                                updated = true;
                            }
                        }
                        if (updated) {
                            return factory.updateCallExpression(node, node.expression, node.typeArguments, args);
                        }
                    }
                }
            }

            return ts.visitEachChild(node, visitor, context);
        };
        return ts.visitEachChild(sourceFile, visitor, context);
    }
}

export type TransformerConfig = {
    //...
};

export function i18nMinifyTransformer(program: ts.Program, config?: TransformerConfig): ts.TransformerFactory<ts.SourceFile> {
    const builder = new TransformerBuilder(program, config);
    return builder.makeTransformer.bind(builder);
}

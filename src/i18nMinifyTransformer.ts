import path from "path";
import ts, { factory } from "typescript";

import { locTextMethodComment, nsLocTextMethodComment, tableComment } from "./i18nTransformerConstants";
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

        this._gatherMethodSymbols();
        const {table, languages} = this._buildReplacementTable();
        this._replaceTable = table;
        this._availableLanguages = languages;

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

    private _gatherMethodSymbols(): void {
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
                ts.forEachChild(node, visitor);
            };
            ts.forEachChild(sourceFile, visitor);
        }

        if (this._locTextMethodSymbols.size === 0 && this._nsLocTextMethodSymbols.size === 0) {
            console.error("No I18N loc text method found in the program");
        }
    }

    private _getNamespaceFromFilename(fileName: string): string | undefined {
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

    private _buildReplacementTable(): { table: Map<string, [number, number]>, languages: Set<string> } {
        const table: Map<string, [number, number]> = new Map();
        const languages: Set<string> = new Set();
        const indexCache: Map<string, number> = new Map(); // key: namespace, value: index
        for (const sourceFile of this._program.getSourceFiles()) {
            const fileName = path.basename(sourceFile.fileName, ".ts");
            const namespace = this._getNamespaceFromFilename(fileName);
            
            console.log("fileName", fileName, "namespace", namespace); //debug
            if (namespace === undefined) {
                continue;
            }
            const visitor = (node: ts.Node): void => {
                if (ts.isExportAssignment(node)) {
                    const comment = getNodeComment(node);
                    if (comment.includes(tableComment)) {
                        if (!ts.isObjectLiteralExpression(node.expression)) {
                            console.error("I18N table must be an object literal");
                            return;
                        }
                        const tableObj = node.expression;
                        for (const prop of tableObj.properties) {
                            if (ts.isPropertyAssignment(prop)) {
                                if (!ts.isStringLiteral(prop.name)) {
                                    console.error("I18N table key must be a string literal");
                                    continue;
                                }
                                const key = prop.name.text;
                                const fullKey = namespace + "." + key;
                                let item = table.get(fullKey);
                                if (item === undefined) {
                                    const index = indexCache.get(namespace) ?? 0;
                                    indexCache.set(namespace, index + 1);
                                    item = [index, 0];
                                    table.set(fullKey, item);
                                }
                                item[1] += 1;
                            }
                        }
                        const dotIndex = fileName.lastIndexOf(".");
                        const languageName = dotIndex === -1 ? fileName : fileName.slice(dotIndex + 1);
                        console.log(languageName); //debug
                        languages.add(languageName);
                    }
                }
                ts.forEachChild(node, visitor);
            };
            ts.forEachChild(sourceFile, visitor);
        }

        // Check if all languages have the same number of keys
        {
            const languageCount = languages.size;
            for (const [key, item] of table) {
                if (item[1] !== languageCount) {
                    console.error(`I18N table key has partial translations: ${key}`);
                }
            }
        }

        return { table, languages };
    }

    private _transformI18nMinify(
        sourceFile: ts.SourceFile,
        context: ts.TransformationContext
    ): ts.SourceFile {
        const checker = this._program.getTypeChecker();
        const languageCount = this._availableLanguages.size;
        const visitor = (node: ts.Node): ts.Node => {
            // Replace I18N loc text table keys
            if (ts.isExportAssignment(node)) {
                const comment = getNodeComment(node);
                if (comment.includes(tableComment)) {
                    if (!ts.isObjectLiteralExpression(node.expression)) {
                        return node;
                    }
                    const tableObj = node.expression;
                    const newProperties = tableObj.properties.map(prop => {
                        if (ts.isPropertyAssignment(prop)) {
                            if (!ts.isStringLiteral(prop.name)) {
                                return prop;
                            }
                            const key = prop.name.text;
                            const index = this._replaceTable.get(key);
                            if (index === undefined) {
                                console.error(`I18N table key not found: ${key}`);
                                return prop;
                            } else if (index[1] !== languageCount) {
                                return prop;
                            }
                            const newKey = factory.createNumericLiteral(index[0]);
                            return factory.createPropertyAssignment(newKey, prop.initializer);
                        }
                        return prop;
                    });
                    const newTableObj = factory.createObjectLiteralExpression(newProperties);
                    return factory.updateExportAssignment(node, node.modifiers, newTableObj);
                }
            }

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

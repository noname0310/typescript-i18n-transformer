import path from "path";
import ts, { factory } from "typescript";

import { locTextMethodComment, nsLocTextMethodComment, tableComment } from "./i18nTransformerConstants";
import { chainBundle, getNodeComment, resolveAliasedSymbol } from "./transformerCommon";

class TransformerBuilder {
    private readonly _program: ts.Program;
    private readonly _replaceTable: Map<string, [number, number]>; // key: namespace.key, value: [index, foundCount]
    private readonly _availableLanguages: Set<string>;

    public constructor(
        program: ts.Program,
        config?: TransformerConfig
    ) {
        this._program = program;
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

    private _buildReplacementTable(): { table: Map<string, [number, number]>, languages: Set<string> } {
        const table: Map<string, [number, number]> = new Map();
        const languages: Set<string> = new Set();
        const indexCache: Map<string, number> = new Map(); // key: namespace, value: index
        for (const sourceFile of this._program.getSourceFiles()) {
            const fileName = path.basename(sourceFile.fileName, ".ts");
            const dotIndex = fileName.lastIndexOf(".");
            const languageName = dotIndex === -1 ? fileName : fileName.slice(dotIndex + 1);
            const namespace = dotIndex === -1 ? undefined : fileName.slice(0, dotIndex);
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
        const fileName = path.basename(sourceFile.fileName, ".ts");
        const dotIndex = fileName.lastIndexOf(".");
        const namespace = dotIndex === -1 ? undefined : fileName.slice(0, dotIndex);

        const visitor = (node: ts.Node): ts.Node => {
            // Replace I18N loc text table keys
            if (ts.isExportAssignment(node) && namespace !== undefined) {
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
                            const fullKey = namespace + "." + key;
                            const index = this._replaceTable.get(fullKey);
                            if (index === undefined) {
                                console.error(`I18N table key not found: ${fullKey}`);
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
                if (symbol && symbol.valueDeclaration) {
                    const comment = getNodeComment(symbol.valueDeclaration);
                    if (comment.includes(locTextMethodComment)) {
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
                    } else if (comment.includes(nsLocTextMethodComment)) {
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

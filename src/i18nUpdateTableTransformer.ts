import fs from "fs";
import path from "path";
import ts from "typescript";

import { i18nConstructorComment, locTextMethodComment, nsLocTextMethodComment, tableComment } from "./i18nTransformerConstants";
import { chainBundle, getNodeComment, resolveAliasedSymbol } from "./transformerCommon";

type TextKey = `${string}.${string}`; // namespace.key (e.g. "default.hello")

class TransformerBuilder {
    private readonly _program: ts.Program;

    private readonly _supportedLanguages: Set<string>;
    private readonly _textKeySet: Set<TextKey>;

    private readonly _resourceDir: string;

    public constructor(
        program: ts.Program,
        config?: TransformerConfig
    ) {
        this._program = program;

        this._supportedLanguages = this._readConfig();
        this._textKeySet = this._buildTextKeySet();

        this._resourceDir = config?.resourceDir ?? "src/language";
    }

    public makeTransformer<T extends ts.Bundle | ts.SourceFile>(
        context: ts.TransformationContext
    ): ts.Transformer<T> {
        context;
        const visitor = (sourceFile: ts.SourceFile): ts.SourceFile => {
            return sourceFile; // do nothing
        };

        return chainBundle(visitor);
    }

    private _readConfig(): Set<string> {
        let constructorFound = false;
        const supportedLanguages: Set<string> = new Set();

        const checker = this._program.getTypeChecker();
        for (const sourceFile of this._program.getSourceFiles()) {
            const visitor = (node: ts.Node): void => {
                if (ts.isNewExpression(node)) {
                    const symbol = resolveAliasedSymbol(checker, checker.getSymbolAtLocation(node.expression));
                    if (symbol && symbol.valueDeclaration) {
                        const comment = getNodeComment(symbol.valueDeclaration);
                        if (comment.includes(i18nConstructorComment)) {
                            if (constructorFound) {
                                console.error("Multiple I18N constructors found in the program");
                            } else {
                                constructorFound = true;

                                const args = node.arguments;
                                if (args === undefined || args.length < 1) {
                                    throw new Error("I18N constructor must have at least one argument");
                                }

                                const arg = args[0];
                                if (!ts.isObjectLiteralExpression(arg)) {
                                    throw new Error("I18N constructor argument must be an object literal");
                                }

                                const properties = arg.properties;
                                for (const prop of properties) {
                                    if (!ts.isPropertyAssignment(prop)) {
                                        throw new Error("I18N constructor argument must have property assignments");
                                    }

                                    if (!ts.isStringLiteral(prop.name)) {
                                        throw new Error("I18N constructor property name must be a string literal");
                                    }

                                    supportedLanguages.add(prop.name.text);
                                }
                            }
                        }
                    }
                }
                ts.forEachChild(node, visitor);
            };
            ts.forEachChild(sourceFile, visitor);
        }

        if (!constructorFound) {
            console.error("I18N constructor not found in the program");
        }

        return supportedLanguages;
    }

    private _buildTextKeySet(): Set<TextKey> {
        const checker = this._program.getTypeChecker();

        const set: Set<TextKey> = new Set();
        for (const sourceFile of this._program.getSourceFiles()) {
            const visitor = (node: ts.Node): void => {
                if (ts.isCallExpression(node)) {
                    const symbol = resolveAliasedSymbol(checker, checker.getSymbolAtLocation(node.expression));
                    if (symbol && symbol.valueDeclaration) {
                        const comment = getNodeComment(symbol.valueDeclaration);
                        if (comment.includes(locTextMethodComment)) {
                            console.log("locTextMethod", node.arguments);
                            if (1 <= node.arguments.length && ts.isStringLiteral(node.arguments[0])) {
                                const key = node.arguments[0].text;
                                set.add(`default.${key}`);
                            } else {
                                console.error("locTextMethod must have string literal argument");
                            }
                        } else if (comment.includes(nsLocTextMethodComment)) {
                            if (2 <= node.arguments.length) {
                                if (ts.isStringLiteral(node.arguments[0]) && ts.isStringLiteral(node.arguments[1])) {
                                    const ns = node.arguments[0].text;
                                    const key = node.arguments[1].text;
                                    set.add(`${ns}.${key}`);
                                } else {
                                    console.error("nsLocTextMethod must have string literal arguments");
                                }
                            }
                        }
                    }
                }
                ts.forEachChild(node, visitor);
            };
            ts.forEachChild(sourceFile, visitor);
        }

        return set;
    }

    public updateTable(): void {
        const languageFileNameToTextsMap = new Map<string, string[]>();
        for (const textKey of this._textKeySet) {
            const dotIndex = textKey.indexOf(".");
            const [ns, key] = [textKey.slice(0, dotIndex), textKey.slice(dotIndex + 1)];
            for (const language of this._supportedLanguages) {
                const fileName = path.join(this._resourceDir, `${ns}.${language}.ts`).replace(/\\/g, "/");

                let texts = languageFileNameToTextsMap.get(fileName);
                if (!texts) {
                    texts = [];
                    languageFileNameToTextsMap.set(fileName, texts);
                }

                texts.push(key);
            }
        }

        const tableEndPostFix = "I18NTABLEEND";

        for (const sourceFile of this._program.getSourceFiles()) {
            const normalizedFileName = path.normalize(sourceFile.fileName).replace(/\\/g, "/");
            //remove before src
            const trimmedFileName = normalizedFileName.replace(/.*\/src\//, "src/");

            const textKeys = languageFileNameToTextsMap.get(trimmedFileName);
            if (textKeys !== undefined) {
                const content = fs.readFileSync(normalizedFileName, "utf-8");
                const firstLeftBraceIndex = content.indexOf("{");
                const tableEndIndex = content.lastIndexOf(tableEndPostFix);
                const lastRightBraceIndex = content.lastIndexOf("}", tableEndIndex);
                const table = content.slice(firstLeftBraceIndex + 1, lastRightBraceIndex);
                const parsedTable = JSON.parse(`{${table}}`) as Record<string, string>;

                const leftKeys = new Set(Object.keys(parsedTable));
                let addedKeys = 0;
                for (const key of textKeys) {
                    if (parsedTable[key]) {
                        leftKeys.delete(key);
                        continue;
                    }

                    parsedTable[key] = key;
                    addedKeys += 1;
                }

                if (addedKeys !== 0) {
                    const newTable = JSON.stringify(parsedTable, null, 4);
                    const newContent = content.slice(0, firstLeftBraceIndex) + newTable + content.slice(lastRightBraceIndex + 1);
                    fs.writeFileSync(normalizedFileName, newContent, "utf-8");
                    console.log(`Added ${addedKeys} keys to ${trimmedFileName}`);
                }

                if (leftKeys.size !== 0) {
                    console.warn(`Unused keys in ${trimmedFileName}: ${Array.from(leftKeys).join(", ")}`);
                }

                languageFileNameToTextsMap.delete(trimmedFileName);
            }
        }

        for (const [fileName, textKeys] of languageFileNameToTextsMap) {
            const content = `/* eslint-disable */\n\n/** ${tableComment} */\nexport default ${JSON.stringify(Object.fromEntries(textKeys.map(key => [key, key])), null, 4)}; /** ${tableEndPostFix} */\n`;
            fs.writeFileSync(fileName, content, "utf-8");
            console.log(`Created ${fileName}`);
        }
    }
}

export type TransformerConfig = {
    resourceDir?: string;
};

export function i18nMinifyTransformer(program: ts.Program, config?: TransformerConfig): ts.TransformerFactory<ts.SourceFile> {
    const builder = new TransformerBuilder(program, config);
    builder.updateTable();
    return builder.makeTransformer.bind(builder);
}

export default i18nMinifyTransformer;

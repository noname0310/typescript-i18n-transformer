import fs from "fs";
import path from "path";
import ts from "typescript";

import { i18nConstructorComment, locTextMethodComment, nsLocTextMethodComment, tableEndPostFix } from "./i18nTransformerConstants";
import { chainBundle, getNodeComment, resolveAliasedSymbol } from "./transformerCommon";

type TextKey = `${string}.${string}`; // namespace.key (e.g. "default.hello")

export type FunctionCallMap = {
    [key: TextKey]: {
        filePath: string;
        line: number;
        column: number;
    }[];
}

export type TranslationMap = {
    [language: string]: {
        [key: TextKey]: string;
    };
}

export class I18nTranslationTransformerCache {
    public textKeySet: Set<TextKey> | undefined;
    public supportedLanguages: Set<string> | undefined;

    public constructor() {
        this.textKeySet = undefined;
        this.supportedLanguages = undefined;
    }
}

class TransformerBuilder {
    private readonly _program: ts.Program;

    private readonly _functionCallMapOutput: FunctionCallMap | undefined;
    private readonly _cache: I18nTranslationTransformerCache;

    private readonly _resourceDir: string;

    public constructor(
        program: ts.Program,
        config?: TransformerConfig
    ) {
        this._program = program;

        this._functionCallMapOutput = config?.functionCallMapOutput;

        this._cache = config?.cache ?? new I18nTranslationTransformerCache();
        if (this._cache.textKeySet === undefined || this._functionCallMapOutput !== undefined) {
            this._cache.textKeySet = this._buildTextKeySet();
        }

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

    private _funtionCallMapAdd(key: TextKey, filePath: string, line: number, column: number): void {
        if (!this._functionCallMapOutput) {
            return;
        }

        if (!this._functionCallMapOutput[key]) {
            this._functionCallMapOutput[key] = [];
        }

        this._functionCallMapOutput[key].push({ filePath, line, column });
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
                            if (1 <= node.arguments.length && ts.isStringLiteral(node.arguments[0])) {
                                const key = node.arguments[0].text;
                                set.add(`default.${key}`);
                                this._funtionCallMapAdd(`default.${key}`, sourceFile.fileName, node.getStart(sourceFile), node.getStart(sourceFile));
                            } else {
                                console.error("locTextMethod must have string literal argument");
                            }
                        } else if (comment.includes(nsLocTextMethodComment)) {
                            if (2 <= node.arguments.length) {
                                if (ts.isStringLiteral(node.arguments[0]) && ts.isStringLiteral(node.arguments[1])) {
                                    const ns = node.arguments[0].text;
                                    const key = node.arguments[1].text;
                                    set.add(`${ns}.${key}`);
                                    this._funtionCallMapAdd(`${ns}.${key}`, sourceFile.fileName, node.getStart(sourceFile), node.getStart(sourceFile));
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

    public updateTable(translationMap: TranslationMap): void {
        const supportedLanguages = this._cache.supportedLanguages ?? this._readConfig();
        this._cache.supportedLanguages = supportedLanguages;

        const absoluteResourceDir = path.resolve(this._resourceDir);
        translationMap;

        const languageFileNameToTextsMap = new Map<string, string[]>();
        for (const textKey of this._cache.textKeySet!) {
            const dotIndex = textKey.indexOf(".");
            const [ns, key] = [textKey.slice(0, dotIndex), textKey.slice(dotIndex + 1)];
            for (const language of supportedLanguages) {
                const fileName = path.join(absoluteResourceDir, `${ns}.${language}.ts`);

                let texts = languageFileNameToTextsMap.get(fileName);
                if (!texts) {
                    texts = [];
                    languageFileNameToTextsMap.set(fileName, texts);
                }

                texts.push(key);
            }
        }

        for (const sourceFile of this._program.getSourceFiles()) {
            const fileName = path.basename(sourceFile.fileName, ".ts");
            const [namespace, language] = fileName.split(".");

            const resolvedFileName = path.resolve(sourceFile.fileName);
            const textKeys = languageFileNameToTextsMap.get(resolvedFileName);
            if (textKeys !== undefined) {
                const content = fs.readFileSync(resolvedFileName, "utf-8");
                const firstLeftBraceIndex = content.indexOf("{");
                const tableEndIndex = content.lastIndexOf(tableEndPostFix);
                const lastRightBraceIndex = content.lastIndexOf("}", tableEndIndex);
                const table = content.slice(firstLeftBraceIndex + 1, lastRightBraceIndex);
                const parsedTable = JSON.parse(`{${table}}`) as Record<string, string>;

                const leftKeys = new Set(Object.keys(parsedTable));
                let translatedKeys = 0;
                for (const key of textKeys) {
                    if (parsedTable[key]) {
                        leftKeys.delete(key);
                    }
                    const translation = translationMap[language]?.[`${namespace}.${key}`] as string | undefined;
                    if (translation !== undefined) {
                        parsedTable[key] = translation;
                        translatedKeys += 1;
                    }
                }

                if (translatedKeys !== 0) {
                    const newTable = JSON.stringify(parsedTable, null, 4);
                    const newContent = content.slice(0, firstLeftBraceIndex) + newTable + content.slice(lastRightBraceIndex + 1);
                    fs.writeFileSync(resolvedFileName, newContent, "utf-8");
                    console.log(`Added ${translatedKeys} keys to ${resolvedFileName}`);
                }

                if (leftKeys.size !== 0) {
                    console.warn(`Untranslated keys in ${resolvedFileName}: ${Array.from(leftKeys).join(", ")}`);
                }
            }
        }
    }
}

export type TransformerConfig = {
    resourceDir?: string;
    functionCallMapOutput?: FunctionCallMap;
    translationMap?: TranslationMap;
    cache?: I18nTranslationTransformerCache;
};

export function i18nTranslationTransformer(program: ts.Program, config?: TransformerConfig): ts.TransformerFactory<ts.SourceFile> {
    const builder = new TransformerBuilder(program, config);
    if (config?.translationMap) {
        builder.updateTable(config.translationMap);
    }
    return builder.makeTransformer.bind(builder);
}

export default i18nTranslationTransformer;

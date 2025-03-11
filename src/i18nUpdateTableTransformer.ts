import fs from "fs";
import path from "path";
import ts from "typescript";

import { locTextMethodComment, nsLocTextMethodComment } from "./i18nTransformerConstants";
import { chainBundle, getNodeComment, resolveAliasedSymbol } from "./transformerCommon";

type TextKey = `${string}.${string}`; // namespace.key (e.g. "default.hello")

class TransformerBuilder {
    private readonly _program: ts.Program;
    private readonly _locTextMethodSymbols: Set<ts.Symbol>;
    private readonly _nsLocTextMethodSymbols: Set<ts.Symbol>;
    private readonly _textKeySet: Set<TextKey>;

    public constructor(
        program: ts.Program,
        config?: TransformerConfig
    ) {
        this._program = program;
        this._locTextMethodSymbols = new Set();
        this._nsLocTextMethodSymbols = new Set();

        this._gatherMethodSymbols();
        this._textKeySet = this._buildTextKeySet();

        config; // for future use
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
    }

    private _buildTextKeySet(): Set<TextKey> {
        const checker = this._program.getTypeChecker();

        const set: Set<TextKey> = new Set();
        for (const sourceFile of this._program.getSourceFiles()) {
            const visitor = (node: ts.Node): void => {
                if (ts.isCallExpression(node)) {
                    const symbol = resolveAliasedSymbol(checker, checker.getSymbolAtLocation(node.expression));
                    if (symbol) {
                        if (this._locTextMethodSymbols.has(symbol)) {
                            if (1 <= node.arguments.length && ts.isStringLiteral(node.arguments[0])) {
                                const key = node.arguments[0].text;
                                set.add(`default.${key}`);
                            } else {
                                console.error("locTextMethod must have string literal argument");
                            }
                        } else if (this._nsLocTextMethodSymbols.has(symbol)) {
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
            for (const language of supportedLanguages) {
                const fileName = path.join("src/bundled_res/language", `${ns}.${language}.ts`).replace(/\\/g, "/");

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
    //...
};

export function i18nUpdateTableTransformer(program: ts.Program, config?: TransformerConfig): ts.TransformerFactory<ts.SourceFile> {
    const builder = new TransformerBuilder(program, config);
    builder.updateTable();
    return builder.makeTransformer.bind(builder);
}

export default i18nUpdateTableTransformer;

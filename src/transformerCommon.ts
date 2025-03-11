import ts, { factory } from "typescript";

export function chainBundle<T extends ts.SourceFile | ts.Bundle>(
    transformSourceFile: (x: ts.SourceFile) => ts.SourceFile | undefined
): (x: T) => T {
    function transformBundle(node: ts.Bundle): ts.Bundle {
        return factory.createBundle(
            node.sourceFiles.map(transformSourceFile).filter((x): x is ts.SourceFile => Boolean(x))
        );
    }

    return function transformSourceFileOrBundle(node: T): T {
        return ts.isSourceFile(node)
            ? (transformSourceFile(node) as T)
            : (transformBundle(node as ts.Bundle) as T);
    };
}

export function getNodeComment(node: ts.Node): string {
    return node.getSourceFile().getFullText().slice(node.getFullStart(), node.getStart());
}

export function resolveAliasedSymbol(checker: ts.TypeChecker, sym?: ts.Symbol): ts.Symbol | undefined {
    if (!sym) return;
    while ((sym.flags & ts.SymbolFlags.Alias) !== 0) {
        const newSym = checker.getAliasedSymbol(sym);
        if (newSym.name === "unknown") return sym;
        sym = newSym;
    }
    return sym;
}

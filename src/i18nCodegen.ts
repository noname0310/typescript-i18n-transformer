#!/usr/bin/env node
import { execSync } from "child_process";

// read the path argument
const path = process.argv[2] ?? "src/language";
path;

// execute "tspc --project ../tsconfig.i18ncodegen.json"
const result = execSync(
    "npx tspc --project ./node_modules/typescript-i18n-transformer/tsconfig.i18ncodegen.json",
    { encoding: "utf-8" }
);
console.log(result);

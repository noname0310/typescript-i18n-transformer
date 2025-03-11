#!/usr/bin/env node
import { execSync } from "child_process";
import fs from "fs";

// read the path argument
const path = process.argv[2] ?? "src/language";

// edit i18ncodegen.json compilerOptions.plugins[0].resourceDir
const i18ncodegenJson = JSON.parse(fs.readFileSync("./node_modules/typescript-i18n-transformer/tsconfig.i18ncodegen.json", "utf-8"));
i18ncodegenJson.compilerOptions.plugins[0].resourceDir = path;
fs.writeFileSync("./node_modules/typescript-i18n-transformer/tsconfig.i18ncodegen.json", JSON.stringify(i18ncodegenJson, null, 2));

// execute "tspc --project ../tsconfig.i18ncodegen.json"
const result = execSync(
    "npx tspc --project ./node_modules/typescript-i18n-transformer/tsconfig.i18ncodegen.json",
    { encoding: "utf-8" }
);
console.log(result);

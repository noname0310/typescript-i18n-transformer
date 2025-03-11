/* eslint-disable @typescript-eslint/naming-convention */
import pluginJs from "@eslint/js";
import stylisticJs from "@stylistic/eslint-plugin-js";
import stylisticTs from "@stylistic/eslint-plugin-ts";
import pluginReact from "eslint-plugin-react";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import tseslint from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"] },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    {
        plugins: {
            "simple-import-sort": simpleImportSort,
            "@stylistic/js": stylisticJs,
            "@stylistic/ts": stylisticTs
        },
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json"
            }
        },
        rules: {
            "@typescript-eslint/consistent-type-imports": ["error", {
                prefer: "type-imports"
            }],

            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-empty-object-type": "off",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-unused-expressions": "off",
            "@typescript-eslint/no-namespace": "off",

            "@typescript-eslint/explicit-member-accessibility": ["error", {
                accessibility: "explicit",

                overrides: {
                    accessors: "explicit",
                    constructors: "explicit",
                    methods: "explicit",
                    properties: "explicit",
                    parameterProperties: "explicit"
                }
            }],

            "@typescript-eslint/prefer-readonly": ["error"],
            "@typescript-eslint/explicit-function-return-type": ["error"],
            "@typescript-eslint/array-type": ["error"],
            "@typescript-eslint/prefer-includes": ["error"],
            "@stylistic/ts/space-before-blocks": ["error"],

            "@stylistic/ts/type-annotation-spacing": ["error", {
                before: false,
                after: true,

                overrides: {
                    arrow: {
                        before: true,
                        after: true
                    }
                }
            }],

            "@typescript-eslint/naming-convention": ["warn", {
                selector: "default",
                format: ["camelCase"]
            }, {
                selector: "variable",
                format: ["camelCase", "UPPER_CASE", "snake_case", "PascalCase"],
                leadingUnderscore: "allow"
            }, {
                selector: "parameter",
                format: ["camelCase"],
                leadingUnderscore: "allow"
            }, {
                selector: "enumMember",
                format: ["PascalCase", "UPPER_CASE"]
            }, {
                selector: "memberLike",
                modifiers: ["public", "static"],
                format: ["PascalCase", "UPPER_CASE"],
                leadingUnderscore: "allow"
            }, {
                selector: "memberLike",
                modifiers: ["private", "static"],
                format: ["PascalCase", "UPPER_CASE"],
                leadingUnderscore: "require"
            }, {
                selector: "memberLike",
                modifiers: ["public"],
                format: ["camelCase"],
                leadingUnderscore: "allow"
            }, {
                selector: "memberLike",
                modifiers: ["private"],
                format: ["camelCase"],
                leadingUnderscore: "require"
            }, {
                selector: "memberLike",
                modifiers: ["protected"],
                format: ["camelCase"],
                leadingUnderscore: "require"
            }, {
                selector: "typeLike",
                format: ["PascalCase"]
            }, {
                selector: "variable",
                format: ["camelCase", "UPPER_CASE"]
            }, {
                selector: "variable",
                modifiers: ["const", "global"],
                format: ["PascalCase", "camelCase", "UPPER_CASE"],
                leadingUnderscore: "allow"
            }, {
                selector: "function",
                format: ["PascalCase", "camelCase"],
                leadingUnderscore: "allow"
            }, {
                selector: "function",
                modifiers: ["exported", "global"],
                format: ["PascalCase", "camelCase"],
                leadingUnderscore: "allow"
            }, {
                selector: "interface",
                format: ["PascalCase"]
            }, {
                selector: "class",
                format: ["PascalCase"],
                leadingUnderscore: "allow"
            }, {
                "selector": "import",
                "format": ["camelCase", "PascalCase"],
                "leadingUnderscore": "allow"
            }],

            "brace-style": ["error", "1tbs"],
            "comma-dangle": ["error", "never"],
            "comma-spacing": ["error"],
            "eol-last": ["error", "always"],
            "indent": ["error", 4],
            "linebreak-style": ["error", "unix"],
            "keyword-spacing": ["error"],
            "no-debugger": "warn",
            "no-inner-declarations": "off",

            "no-plusplus": ["error", {
                allowForLoopAfterthoughts: true
            }],

            "no-trailing-spaces": ["error"],
            "quotes": ["error", "double"],
            "semi": ["error", "always"],
            "semi-spacing": ["error"],
            "simple-import-sort/imports": "error",
            "simple-import-sort/exports": "error",
            "space-before-blocks": ["error"],
            "space-before-function-paren": ["error", "never"],
            "space-in-parens": ["error"],
            "space-infix-ops": ["error"],
            "space-unary-ops": ["error"],
            "react/react-in-jsx-scope": "off"
        }
    }
];

// eslint.config.mjs
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
    // ===================================
    // 1. Global Ignores
    // ===================================
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "coverage/**",
            "*.config.{js,mjs}",
        ],
    },

    // ===================================
    // 2. TypeScript Source Files
    // ===================================
    {
        files: ["src/**/*.ts"],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
        ],
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // "no-console": "error",
            "dot-notation": "error",
        },
    },

    // ===================================
    // 3. TypeScript Test Files
    // ===================================
    {
        files: ["**/*.spec.ts", "**/*.test.ts"],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
        ],
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.eslint.json", // Separate config for tests
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "no-console": "off", // Allow console in tests
            "dot-notation": "error",
            "@typescript-eslint/no-explicit-any": "off",
        },
    },

    // ===================================
    // 4. JavaScript Files (no type checking)
    // ===================================
    {
        files: ["**/*.{js,mjs,cjs}"],
        extends: [eslint.configs.recommended],
        rules: {
            // "no-console": "off", // Config files often use console
        },
    },
);
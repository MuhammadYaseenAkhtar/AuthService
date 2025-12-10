// eslint.config.mjs
import eslint from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
    {
        // MUST be first — prevents ESLint from scanning dist
        ignores: ["dist/**", "node_modules/**", "eslint.config.mjs"],
    },

    // JS Recommended Rules
    eslint.configs.recommended,

    // TS + Type Checking Rules
    ...tseslint.configs.recommendedTypeChecked,

    // Shared parser options for TS
    {
        files: ["src/**/*.{ts,js}"],
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            // "no-console": "error",
        },
    },
]);

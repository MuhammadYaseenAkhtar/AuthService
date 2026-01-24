import { defineConfig } from "tsup";

export default defineConfig({
    // entry: ["src/**/*.ts"], // for multiple files, preserve the structure of folders and files
    entry: ["src/server.ts"], //single file generates, best for production
    target: "node24",
    platform: "node",
    splitting: false,
    sourcemap: true,
    clean: true,
    format: "esm",
    bundle: true,
});

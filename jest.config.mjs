// jest.config.mjs
export default {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    collectCoverage: true,
    coverageProvider: "v8",
    collectCoverageFrom: [
        "src/**/*.ts",
        "!src/**/index.ts",
        "!src/config/**",
        "!src/constants/**",
        "!src/migration/**",
        "!src/tests/**",
        "!**/node_modules/**",
        "!src/server.ts",
    ],
    extensionsToTreatAsEsm: [".ts"],

    transform: {
        "^.+\\.tsx?$": [
            "ts-jest",
            {
                useESM: true,
            },
        ],
    },

    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
};

import { config } from "dotenv";

config({ path: `.env.${process.env.NODE_ENV}` });

// const { PORT, NODE_ENV, DB_HOST, DB_PORT, DB_USERNAME, DB_PASSWORD, DB_NAME } =
//     process.env;
export const Config = {
    PORT: Number(requiredEnv("PORT")),
    NODE_ENV: requiredEnv("NODE_ENV"),
    DB_HOST: requiredEnv("DB_HOST"),
    DB_PORT: Number(requiredEnv("DB_PORT")),
    DB_USERNAME: requiredEnv("DB_USERNAME"),
    DB_PASSWORD: requiredEnv("DB_PASSWORD"),
    DB_NAME: requiredEnv("DB_NAME"),
};

function requiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
        console.error(
            `❌ Configuration Error: Missing required environment variable: ${name}`,
        );
        console.error(
            `   Check your .env.${process.env.NODE_ENV || "local"} file`,
        );
        process.exit(1); // Exit with error code
    }
    return value;
}

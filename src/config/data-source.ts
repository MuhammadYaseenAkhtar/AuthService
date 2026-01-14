import "reflect-metadata";
import { DataSource } from "typeorm";
import { Config } from "./index.ts";

export const AppDataSource = new DataSource({
    type: "postgres",
    host: Config.DB_HOST,
    port: Config.DB_PORT,
    username: Config.DB_USERNAME,
    password: Config.DB_PASSWORD,
    database: Config.DB_NAME,
    // synchronize: true, // Don't use it in production
    // synchronize: Config.NODE_ENV === "dev" || Config.NODE_ENV === "test",
    synchronize: false,
    logging: false,
    entities: ["src/entity/*.ts"],
    migrations: ["src/migration/*.ts"],
    subscribers: [],
});

import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entity/User.ts";
import { Config } from "./index.ts";
import { RefreshToken } from "../entity/RefreshToken.ts";

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
    entities: [User, RefreshToken],
    migrations: ["src/migration/*.ts"],
    subscribers: [],
});

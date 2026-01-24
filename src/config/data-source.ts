import "reflect-metadata";
import { DataSource } from "typeorm";
import { Config } from "./index.ts";
import { Migration1768093143252 } from "../migration/1768093143252-migration.ts";
import { RenameTables1768350402389 } from "../migration/1768350402389-renameTables.ts";
import { CreateTenantsTable1768365015279 } from "../migration/1768365015279-createTenantsTable.ts";
import { User } from "../entity/User.ts";
import { RefreshToken } from "../entity/RefreshToken.ts";
import { Tenant } from "../entity/Tenant.ts";
import { AddTenantIDFKInUserTable1768367107694 } from "../migration/1768367107694-add_TenantID_FK_in_UserTable.ts";

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
    entities: [User, RefreshToken, Tenant],
    migrations:
        Config.NODE_ENV === "test"
            ? [
                  Migration1768093143252,
                  RenameTables1768350402389,
                  CreateTenantsTable1768365015279,
                  AddTenantIDFKInUserTable1768367107694,
              ]
            : ["src/migration/*.{ts,js}"],
    subscribers: [],
});

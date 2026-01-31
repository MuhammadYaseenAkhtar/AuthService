import app from "./app.ts";
import { Config } from "./config/index.ts";
import logger from "./config/logger.ts";
import { AppDataSource } from "./config/data-source.ts";
import { User } from "./entity/User.ts";
import { Roles } from "./constants/index.ts";
import { UserService } from "./services/UserService.ts";

const startServer = async () => {
    try {
        await AppDataSource.initialize();
        logger.info("Database connected successfully");

        const userRepo = AppDataSource.getRepository(User);
        const userService = new UserService(userRepo);

        const PORT = Config.PORT;

        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`, {
                port: PORT,
            });
        });

        const isAdmin = await userRepo.findOne({
            where: { role: Roles.ADMIN },
        });

        if (!isAdmin) {
            const adminUser = await userService.create({
                firstName: "Super Admin",
                lastName: "Super Admin",
                email: "admin@admin.com",
                password: Config.ADMIN_PASSWORD,
                role: Roles.ADMIN,
            });

            if (adminUser) {
                logger.info(
                    `Admin User created successfully. ID: ${adminUser.id}; Name: ${adminUser.firstName}`,
                );
            }
        }
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

await startServer();

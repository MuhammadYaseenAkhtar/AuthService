import app from "./app.ts";
import { Config } from "./config/index.ts";
import logger from "./config/logger.ts";
import { AppDataSource } from "./config/data-source.ts";

const startServer = async () => {
    try {
        await AppDataSource.initialize();
        logger.info("Database connected successfully");

        const PORT = Config.PORT;

        app.listen(PORT, () => {
            logger.info(`Server running on port ${PORT}`, {
                port: PORT,
            });
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

await startServer();

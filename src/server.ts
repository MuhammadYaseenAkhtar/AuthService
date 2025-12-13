import app from "./app.ts";
import { Config } from "./config/index.ts";
import logger from "./config/logger.ts";

const startServer = () => {
    try {
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

startServer();

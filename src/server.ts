import app from "./app.js";
import { Config } from "./config/index.js";

const startServer = () => {
    try {
        const PORT = Config.PORT;

        app.listen(PORT, () =>
            console.log(`app is listening at port: ${PORT}`),
        );
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

startServer();

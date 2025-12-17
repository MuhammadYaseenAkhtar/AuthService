import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import logger from "./config/logger.ts";
import { HttpError } from "http-errors";

const app = express();

app.get("/", (_, res) => {
    res.status(200).send("Welcome to Express app.");
});

//global error handler

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(err.message);
    const statusCode = err.statusCode || 500;

    res.status(statusCode).json({
        errors: [
            {
                type: err.name,
                msg: err.message,
                path: "",
                location: "",
            },
        ],
    });
});
export default app;

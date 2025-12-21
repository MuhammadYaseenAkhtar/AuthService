import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import logger from "./config/logger.ts";
import { HttpError } from "http-errors";
import authRouter from "./routes/auth.route.ts";

const app = express();

app.get("/", (_req, res) => {
    res.status(200).send("Welcome to Express app.");
});

app.use("/auth", authRouter);

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

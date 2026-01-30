import "reflect-metadata";
import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import cookieParser from "cookie-parser";
import logger from "./config/logger.ts";
import { HttpError } from "http-errors";
import authRouter from "./routes/auth.route.ts";
import tenantRouter from "./routes/tenant.route.ts";
import userRouter from "./routes/user.route.ts";
import path from "node:path";
import { fileURLToPath } from "node:url";
import helmet from "helmet";

// ✅ Recreate __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Apply Helmet (all default protections)
app.use(helmet());

// Serve .well-known directory for OIDC/OAuth standards
app.use(
    "/.well-known",
    express.static(path.join(__dirname, "../public/.well-known"), {
        dotfiles: "allow",
    }),
);

// Serve other static files (without dotfiles for security)
// app.use(express.static(path.join(__dirname, "../public")));

app.use(express.json());
app.use(cookieParser());

app.get("/", (_req, res) => {
    res.status(200).send("Welcome to Express app.");
});

app.use("/auth", authRouter);
app.use("/tenants", tenantRouter);
app.use("/users", userRouter);

//global error handler

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: HttpError, _req: Request, res: Response, _next: NextFunction) => {
    logger.error(err.message);
    const statusCode = err.statusCode || err.status || 500;
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

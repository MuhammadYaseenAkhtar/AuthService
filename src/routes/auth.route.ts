import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import { AuthController } from "../controllers/AuthController.ts";
import { UserService } from "../services/UserService.ts";
import { AppDataSource } from "../config/data-source.ts";
import { User } from "../entity/User.ts";
import logger from "../config/logger.ts";
import registerValidator from "../validators/registerValidator.ts";
import { TokenService } from "../services/TokenService.ts";
import { RefreshToken } from "../entity/RefreshToken.ts";
import loginValidator from "../validators/loginValidator.ts";
import { CredentialService } from "../services/CredentialService.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import type { authRequest } from "../types/index.ts";
import validateRefreshToken from "../middlewares/validateRefreshToken.ts";
import parseRefreshToken from "../middlewares/parseRefreshToken.ts";
const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const refreshTokenRepo = AppDataSource.getRepository(RefreshToken);
const tokenService = new TokenService(refreshTokenRepo);
const credentialService = new CredentialService();
const authController = new AuthController(
    userService,
    logger,
    tokenService,
    credentialService,
);

router.post(
    "/register",
    registerValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.register(req, res, next),
);

router.post(
    "/login",
    loginValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.login(req, res, next),
);

router.get(
    "/me",
    authMiddleware,
    (req: Request, res: Response, next: NextFunction) =>
        authController.me(req as authRequest, res, next),
);

router.post(
    "/refresh",
    validateRefreshToken,
    (req: Request, res: Response, next: NextFunction) =>
        authController.refresh(req as authRequest, res, next),
);

router.post(
    "/logout",
    authMiddleware,
    parseRefreshToken,
    (req: Request, res: Response, next: NextFunction) =>
        authController.logout(req as authRequest, res, next),
);

router.post(
    "/logoutAllDevices",
    authMiddleware,
    parseRefreshToken,
    (req: Request, res: Response, next: NextFunction) =>
        authController.logoutAllDevices(req as authRequest, res, next),
);

export default router;

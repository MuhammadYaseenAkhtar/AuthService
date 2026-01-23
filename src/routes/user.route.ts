import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import { canAccess } from "../middlewares/canAccess.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { Roles } from "../constants/index.ts";
import { UserController } from "../controllers/userController.ts";
import { UserService } from "../services/UserService.ts";
import logger from "../config/logger.ts";
import { AppDataSource } from "../config/data-source.ts";
import { User } from "../entity/User.ts";
import createUserValidator from "../validators/createUserValidator.ts";
import { getUserByIdValidator } from "../validators/userParamValidator.ts";
import updateUserValidator from "../validators/updateUserValidator.ts";

const router = express.Router();

const userRepo = AppDataSource.getRepository(User);
const userService = new UserService(userRepo);
const userController = new UserController(userService, logger);

router.post(
    "/",
    authMiddleware,
    canAccess([Roles.ADMIN]),
    createUserValidator,
    (req: Request, res: Response, next: NextFunction) =>
        userController.createUser(req, res, next),
);

router.get(
    "/",
    authMiddleware,
    canAccess([Roles.ADMIN]),
    (req: Request, res: Response, next: NextFunction) =>
        userController.getAllUsers(req, res, next),
);

router.get(
    "/:userId",
    authMiddleware,
    canAccess([Roles.ADMIN]),
    getUserByIdValidator,
    (req: Request, res: Response, next: NextFunction) =>
        userController.getUser(req, res, next),
);

router.delete(
    "/:userId",
    authMiddleware,
    canAccess([Roles.ADMIN]),
    getUserByIdValidator,
    (req: Request, res: Response, next: NextFunction) =>
        userController.deleteUser(req, res, next),
);

router.patch(
    "/:userId",
    authMiddleware,
    canAccess([Roles.ADMIN]),
    getUserByIdValidator,
    updateUserValidator,
    (req: Request, res: Response, next: NextFunction) =>
        userController.updateUser(req, res, next),
);

export default router;

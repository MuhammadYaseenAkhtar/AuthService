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
const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const tokenService = new TokenService();
const authController = new AuthController(userService, logger, tokenService);

router.post(
    "/register",
    registerValidator,
    (req: Request, res: Response, next: NextFunction) =>
        authController.register(req, res, next),
);
export default router;

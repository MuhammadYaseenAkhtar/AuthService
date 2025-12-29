import express from "express";
import { AuthController } from "../controllers/AuthController.ts";
import { UserService } from "../services/UserService.ts";
import { AppDataSource } from "../config/data-source.ts";
import { User } from "../entity/User.ts";
import logger from "../config/logger.ts";
const router = express.Router();

const userRepository = AppDataSource.getRepository(User);
const userService = new UserService(userRepository);
const authController = new AuthController(userService, logger);
router.post("/register", (req, res, next) =>
    authController.register(req, res, next),
);
export default router;

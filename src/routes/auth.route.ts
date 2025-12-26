import express from "express";
import { AuthController } from "../controllers/AuthController.ts";
import { UserService } from "../services/UserService.ts";
const router = express.Router();

const userService = new UserService();
const authController = new AuthController(userService);
router.post("/register", (req, res) => authController.create(req, res));
export default router;

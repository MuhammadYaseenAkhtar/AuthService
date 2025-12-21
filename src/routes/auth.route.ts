import express from "express";
import { AuthController } from "../controllers/AuthController.ts";
const router = express.Router();

const authController = new AuthController();
router.post("/register", (req, res) => authController.create(req, res));
export default router;

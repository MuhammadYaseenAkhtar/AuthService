import express from "express";
import { TenantController } from "../controllers/TenantController.ts";
import { TenantService } from "../services/TenantService.ts";
import { AppDataSource } from "../config/data-source.ts";
import { Tenant } from "../entity/Tenant.ts";
import logger from "../config/logger.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { canAccess } from "../middlewares/canAccess.ts";
import { Roles } from "../constants/index.ts";

const router = express.Router();
const tenantRepo = AppDataSource.getRepository(Tenant);
const tenantService = new TenantService(tenantRepo);
const tenantController = new TenantController(tenantService, logger);

router.post("/", authMiddleware, canAccess([Roles.ADMIN]), (req, res, next) =>
    tenantController.createTenant(req, res, next),
);

export default router;

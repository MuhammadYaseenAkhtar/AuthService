import express from "express";
import { TenantController } from "../controllers/TenantController.ts";
import { TenantService } from "../services/TenantService.ts";
import { AppDataSource } from "../config/data-source.ts";
import { Tenant } from "../entity/Tenant.ts";

const router = express.Router();
const tenantRepo = AppDataSource.getRepository(Tenant);
const tenantService = new TenantService(tenantRepo);
const tenantController = new TenantController(tenantService);
router.post("/", (req, res, next) =>
    tenantController.createTenant(req, res, next),
);
export default router;

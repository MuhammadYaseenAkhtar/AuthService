import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
import { TenantController } from "../controllers/TenantController.ts";
import { TenantService } from "../services/TenantService.ts";
import { AppDataSource } from "../config/data-source.ts";
import { Tenant } from "../entity/Tenant.ts";
import logger from "../config/logger.ts";
import { authMiddleware } from "../middlewares/auth.middleware.ts";
import { canAccess } from "../middlewares/canAccess.ts";
import { Roles } from "../constants/index.ts";
import tenantValidator from "../validators/tenantValidator.ts";

const router = express.Router();
const tenantRepo = AppDataSource.getRepository(Tenant);
const tenantService = new TenantService(tenantRepo);
const tenantController = new TenantController(tenantService, logger);

router.post(
    "/",
    authMiddleware,
    canAccess([Roles.ADMIN]),
    tenantValidator,
    (req: Request, res: Response, next: NextFunction) =>
        tenantController.createTenant(req, res, next),
);

router.get(
    "/",
    authMiddleware,
    canAccess([Roles.ADMIN]),
    (req: Request, res: Response, next: NextFunction) =>
        tenantController.listTenants(req, res, next),
);

export default router;

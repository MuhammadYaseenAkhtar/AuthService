import type { Request, Response } from "express";

export class AuthController {
    create(_req: Request, res: Response) {
        res.status(201).send();
    }
}

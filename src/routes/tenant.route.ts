import express from "express";

const router = express.Router();

router.post("/", (_req, res) => {
    res.status(201).json({ msg: "health check" });
});
export default router;

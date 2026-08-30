import { Router } from "express";
import { getMenu } from "../store.js";

const router = Router();

router.get("/", (req, res) => {
  res.json(getMenu());
});

export default router;

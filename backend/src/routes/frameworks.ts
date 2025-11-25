import { Router } from "express";
import { frameworks } from "../data/frameworks";

const router = Router();

router.get("/", (_req, res) => {
  res.json(
    frameworks.map(fw => ({
      id: fw.id,
      name: fw.name,
      version: fw.version,
      description: fw.description,
      controlsCount: fw.controls.length
    }))
  );
});

router.get("/:id", (req, res) => {
  const fw = frameworks.find(f => f.id === req.params.id);
  if (!fw) return res.status(404).json({ message: "Framework not found" });
  res.json(fw);
});

export default router;

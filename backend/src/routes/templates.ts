import { Router } from "express";
import { templates } from "../data/templates";

const router = Router();

router.get("/", (req, res) => {
  const { frameworkId } = req.query;
  let result = templates;

  if (frameworkId) {
    result = result.filter(t => t.frameworkId === frameworkId);
  }

  res.json(
    result.map(t => ({
      id: t.id,
      frameworkId: t.frameworkId,
      name: t.name,
      description: t.description
    }))
  );
});

router.get("/:id", (req, res) => {
  const t = templates.find(tmp => tmp.id === req.params.id);
  if (!t) return res.status(404).json({ message: "Template not found" });
  res.json(t);
});

export default router;

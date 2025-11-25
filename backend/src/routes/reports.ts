import { Router } from "express";
import { generateReport, ReportRequest } from "../services/reportGenerator";

const router = Router();

router.post("/", (req, res) => {
  try {
    const body = req.body as ReportRequest;
    const result = generateReport(body);
    res.json({ markdown: result.markdown });
  } catch (err: any) {
    res.status(400).json({ message: err.message });
  }
});

export default router;

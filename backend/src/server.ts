import express from "express";
import cors from "cors";
import frameworksRouter from "./routes/frameworks";
import templatesRouter from "./routes/templates";
import reportsRouter from "./routes/reports";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "VulnBoard API" });
});

app.use("/api/frameworks", frameworksRouter);
app.use("/api/templates", templatesRouter);
app.use("/api/reports", reportsRouter);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`VulnBoard backend running on port ${PORT}`);
});

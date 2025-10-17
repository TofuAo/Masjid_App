import express from "express";
const router = express.Router();
import transferYearData from "../scripts/transferYearData.js";

router.post("/migrate-year", async (req, res) => {
  const { fromYear, toYear } = req.body;
  try {
    await transferYearData(fromYear, toYear);
    res.status(200).json({ message: "Year data transferred successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Migration failed." });
  }
});

export default router;

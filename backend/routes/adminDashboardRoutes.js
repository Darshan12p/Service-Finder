const express = require("express");
const router = express.Router();
const { getDashboardSummary } = require("../controllers/adminDashboardController");

router.get("/dashboard/summary", getDashboardSummary);

module.exports = router;




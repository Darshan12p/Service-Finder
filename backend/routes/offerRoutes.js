const express = require("express");
const router = express.Router();
const { getActiveOffers } = require("../controllers/offerController");

router.get("/", getActiveOffers);

module.exports = router;

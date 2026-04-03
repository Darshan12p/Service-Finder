const express = require("express");
const router = express.Router();

const { getUserAddresses, addUserAddress } = require("../controllers/addressController");

// GET addresses
router.get("/:userId", getUserAddresses);

// POST add address
router.post("/:userId", addUserAddress);

module.exports = router;

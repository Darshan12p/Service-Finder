const express = require("express");
const router = express.Router();

const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Offer = require("../models/Offer");

router.post("/seed", async (req, res) => {
  try {
    // Clear old demo data (optional)
    await Promise.all([
      Booking.deleteMany({}),
      Service.deleteMany({}),
      Offer.deleteMany({}),
    ]);

    // Insert Services
    const services = await Service.insertMany([
      { title: "Home Cleaning", category: "Cleaning", price: 1200, isActive: true },
      { title: "AC Repair", category: "AC Repair", price: 800, isActive: true },
      { title: "Gardening", category: "Gardening", price: 600, isActive: true },
    ]);

    // Insert Offers
    const offers = await Offer.insertMany([
      { title: "New User Offer", code: "NEW10", discountType: "percent", value: 10, isActive: true },
      { title: "Flat Discount", code: "FLAT50", discountType: "fixed", value: 50, isActive: true },
    ]);

    // Insert Bookings (dates are recent so dashboard charts show)
    const now = new Date();
    const daysAgo = (n) => {
      const d = new Date(now);
      d.setDate(d.getDate() - n);
      return d;
    };

    const bookings = await Booking.insertMany([
      {
        customerName: "Divya",
        customerEmail: "divya@gmail.com",
        phone: "9999999999",
        city: "Ahmedabad",
        serviceCategory: "Cleaning",
        amount: 1200,
        bookingStatus: "Pending",
        createdAt: daysAgo(0),
      },
      {
        customerName: "Amit",
        customerEmail: "amit@gmail.com",
        phone: "8888888888",
        city: "Rajkot",
        serviceCategory: "AC Repair",
        amount: 800,
        bookingStatus: "Completed",
        createdAt: daysAgo(2),
      },
      {
        customerName: "Neha",
        customerEmail: "neha@gmail.com",
        phone: "7777777777",
        city: "Ahmedabad",
        serviceCategory: "Gardening",
        amount: 600,
        bookingStatus: "Confirmed",
        createdAt: daysAgo(5),
      },
    ]);

    res.json({
      message: "Seeded successfully",
      inserted: {
        services: services.length,
        offers: offers.length,
        bookings: bookings.length,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Seed failed" });
  }
});

module.exports = router;

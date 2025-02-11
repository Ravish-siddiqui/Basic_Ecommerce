const express = require("express");
const router = express.Router();
const User = require("../models/User.model");
const Product = require("../models/Product.model");

// Middleware to ensure user is logged in
const isAuthenticated = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "You must be logged in to use the wishlist" });
  }
  next();
};

// 🛍️ View Wishlist (Fetch products from DB)
router.get("/", isAuthenticated, async (req, res) => {
  try {
    console.log("🔍 User Data in /wishlist:", req.user);

    const user = await User.findById(req.user._id).populate("wishList");

    if (!user) {
      return res.status(404).send("User not found");
    }

    console.log("✅ Fetched Wishlist Data:", user.wishList);

    res.render("wishlist", { wishlist: user.wishList });
  } catch (error) {
    console.error("❌ Error fetching wishlist:", error);
    res.status(500).send("Error fetching wishlist");
  }
});

// ➕ Add Product to Wishlist
router.post("/add/:id", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.id;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Debug: Check wishlist before saving
    console.log("Before Adding Wishlist:", user.wishList);

    // Add to wishlist if not already present
    if (!user.wishList.includes(productId)) {
      user.wishList.push(productId);
      await user.save();
    }

    console.log("✅ After Adding Wishlist:", user.wishList);
    res.redirect("/wishlist");
  } catch (error) {
    console.error("❌ Error adding to wishlist:", error);
    res.status(500).send("Error adding to wishlist");
  }
});

// ❌ Remove Product from Wishlist
router.post("/remove/:id", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const productId = req.params.id;

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Remove product from wishlist
    user.wishList = user.wishList.filter((id) => id.toString() !== productId);
    await user.save();

    console.log(`✅ Product ${productId} removed from wishlist`);
    res.redirect("/wishlist");
  } catch (error) {
    console.error("❌ Error removing from wishlist:", error);
    res.status(500).send("Error removing from wishlist");
  }
});

module.exports = router;

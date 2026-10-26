import express from "express";
import Review from "../models/Review.js";
import Product from "../models/Product.js";
import { requireAuth, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// GET /api/reviews?productId=<id>  OR  GET /api/reviews (all, for admin)
router.get("/", async (req, res) => {
  try {
    const { productId } = req.query;
    const filter = productId ? { productId } : {};
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// POST /api/reviews (auth required)
router.post("/", requireAuth, async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    if (!productId || !rating || !comment) {
      return res.status(400).json({ message: "productId, rating, and comment are required." });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found." });

    const review = await Review.create({
      productId,
      userId: req.user.id,
      userName: req.user.email.split("@")[0],
      rating,
      comment,
      date: new Date().toISOString().split("T")[0],
    });

    // Recalculate product rating
    const newCount = product.reviewCount + 1;
    const newRating = (product.rating * product.reviewCount + rating) / newCount;
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(newRating * 10) / 10,
      reviewCount: newCount,
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

// DELETE /api/reviews/:id (admin only)
router.delete("/:id", requireAdmin, async (req, res) => {
  try {
    const review = await Review.findByIdAndDelete(req.params.id);
    if (!review) return res.status(404).json({ message: "Review not found." });
    res.json({ message: "Review deleted." });
  } catch (err) {
    res.status(500).json({ message: "Server error.", error: err.message });
  }
});

export default router;

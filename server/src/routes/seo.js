import express from "express";
import Product from "../models/Product.js";
import Service from "../models/Service.js";

const router = express.Router();

const BASE_URL = process.env.SITE_URL || "https://gzones.in";

/**
 * GET /sitemap.xml
 * Dynamic XML Sitemap conforming to sitemaps.org standards
 */
router.get("/sitemap.xml", async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    // 1. Static Public Pages
    const staticPages = [
      { loc: `${BASE_URL}/`, priority: "1.0", changefreq: "daily", lastmod: today },
      { loc: `${BASE_URL}/products`, priority: "0.9", changefreq: "daily", lastmod: today },
      { loc: `${BASE_URL}/services`, priority: "0.8", changefreq: "weekly", lastmod: today },
      { loc: `${BASE_URL}/build-pc`, priority: "0.8", changefreq: "weekly", lastmod: today },
      { loc: `${BASE_URL}/contact`, priority: "0.7", changefreq: "monthly", lastmod: today },
    ];

    // 2. Fetch all products from MongoDB
    let productPages = [];
    try {
      const products = await Product.find({}).select("_id slug updatedAt createdAt").lean();
      productPages = products.map((p) => {
        const lastmod = (p.updatedAt || p.createdAt || new Date()).toISOString().split("T")[0];
        return {
          loc: `${BASE_URL}/product/${p._id}`,
          priority: "0.8",
          changefreq: "weekly",
          lastmod,
        };
      });
    } catch (err) {
      console.warn("Could not fetch products for sitemap:", err.message);
    }

    // 3. Assemble XML
    const allEntries = [...staticPages, ...productPages];

    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...allEntries.map(
        (entry) => `  <url>
    <loc>${entry.loc}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
      ),
      "</urlset>",
    ].join("\n");

    res.header("Content-Type", "application/xml; charset=utf-8");
    res.header("Cache-Control", "public, max-age=3600"); // Cache for 1 hour
    res.send(xml);
  } catch (err) {
    console.error("Error generating sitemap:", err);
    res.status(500).send("Error generating sitemap");
  }
});

/**
 * GET /robots.txt
 * Standard Robots Exclusion Protocol file protecting admin/private paths
 */
router.get("/robots.txt", (req, res) => {
  const robotsTxt = `# robots.txt for GadgetZone
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/*
Disallow: /login
Disallow: /reset-password
Disallow: /cart
Disallow: /checkout
Disallow: /orders
Disallow: /my-services
Disallow: /api/auth/
Disallow: /api/orders/
Disallow: /api/admin/
Allow: /api/products
Allow: /api/services
Allow: /sitemap.xml

Sitemap: ${BASE_URL}/sitemap.xml
`;

  res.header("Content-Type", "text/plain; charset=utf-8");
  res.header("Cache-Control", "public, max-age=86400"); // Cache for 24 hours
  res.send(robotsTxt);
});

export default router;


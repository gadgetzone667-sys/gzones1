import express from "express";

const router = express.Router();

// Memory store for contact messages
const contactMessages = [];

// POST /api/contact - Submit contact form
router.post("/", (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    
    if (!name || (!email && !phone) || !message) {
      return res.status(400).json({ message: "Name, contact info, and message are required." });
    }

    const newMessage = {
      id: `msg_${Date.now()}`,
      name,
      email,
      phone: phone || "Not provided",
      subject: subject || "Website Inquiry",
      message,
      createdAt: new Date().toISOString(),
      sellerMobile: "+91 9345600128",
      sellerEmail: "gadgetzone667@gmail.com",
    };

    contactMessages.unshift(newMessage);
    console.log(`📩 NEW CONTACT MESSAGE FOR SELLER (+91 9345600128 | gadgetzone667@gmail.com):`, newMessage);

    res.status(201).json({
      success: true,
      message: "Message received! Sent to seller mobile and email.",
      data: newMessage,
    });
  } catch (err) {
    res.status(500).json({ message: "Server error processing message.", error: err.message });
  }
});

// GET /api/contact - Retrieve all contact messages (for seller)
router.get("/", (_req, res) => {
  res.json(contactMessages);
});

export default router;

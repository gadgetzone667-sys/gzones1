import app from "./app.js";
import connectDB from "./config/db.js";

async function startServer() {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Express server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the application:", error.message);
    process.exit(1);
  }
}

startServer();

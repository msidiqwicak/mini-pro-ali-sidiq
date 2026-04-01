import "dotenv/config";
import app from "./app.js";
import { config } from "./config/env.js";
import prisma from "./lib/prisma.js";

// Test koneksi database dulu sebelum buka server
async function main() {
  try {
    // Cek koneksi Prisma ke Supabase
    await prisma.$connect();
    console.log("✅ Database terhubung");

    // Buka server
    const server = app.listen(config.port, () => {
      console.log(`🎵 SoundWave API running on http://localhost:${config.port}`);
      console.log(`🌍 Environment: ${config.nodeEnv}`);
      console.log(`📡 Frontend allowed: ${config.frontendUrl}`);
    });

    // Handle error saat listen
    server.on("error", (err) => {
      console.error("❌ Server error:", err);
      process.exit(1);
    });

  } catch (err) {
    console.error("❌ Gagal koneksi database:", err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Handle unhandled errors
process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err);
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

void main();
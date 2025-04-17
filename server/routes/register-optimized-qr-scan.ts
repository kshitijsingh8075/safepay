import { Express } from "express";
import optimizedQRScanRoutes from "./optimized-qr-scan";
import { log } from "../vite";

export function registerOptimizedQRScanRoutes(app: Express): void {
  log("Registering Optimized QR Scan Routes...", "routes");
  app.use("/api/optimized-qr", optimizedQRScanRoutes);
}
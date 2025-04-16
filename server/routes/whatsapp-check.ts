import { Express, Request, Response } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { analyzeWhatsAppMessage } from "../services/openai";

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDir = path.join(import.meta.dirname, "..", "..", "uploads");
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `whatsapp-${uniqueSuffix}${ext}`);
  },
});

// Filter to accept only image files
const fileFilter = (req: Request, file: any, cb: any) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max size
  },
});

// Define multer file type
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination: string;
  filename: string;
  path: string;
  buffer: Buffer;
}

// Extended request type with file property
interface RequestWithFile extends Request {
  file?: MulterFile;
}

/**
 * Register WhatsApp check routes
 * @param app Express application
 */
export function registerWhatsAppCheckRoutes(app: Express): void {
  // Endpoint to analyze WhatsApp messages
  app.post("/api/analyze-whatsapp", upload.single("image"), async (req: RequestWithFile, res: Response) => {
    try {
      const description = req.body.description || "";
      let imageBase64 = null;
      
      // If image is uploaded, read it and convert to base64
      if (req.file) {
        const imagePath = req.file.path;
        const imageBuffer = fs.readFileSync(imagePath);
        imageBase64 = imageBuffer.toString("base64");
        
        // Clean up the uploaded file after processing
        fs.unlinkSync(imagePath);
      }
      
      // If neither image nor description is provided
      if (!imageBase64 && !description) {
        return res.status(400).json({
          status: "error",
          message: "Please provide either an image or a description",
        });
      }
      
      // Analyze the message using OpenAI
      const analysis = await analyzeWhatsAppMessage(imageBase64, description);
      
      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing WhatsApp message:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to analyze message",
        error: error.message,
      });
    }
  });
}
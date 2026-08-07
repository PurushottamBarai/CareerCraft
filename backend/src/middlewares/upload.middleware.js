import multer from "multer";
import path from "path";
import { promises as fs } from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../public/uploads");
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const cleanOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, "_");
    cb(null, uniqueSuffix + "-" + cleanOriginalName);
  },
});

const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.txt', '.rtf'];

export const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file format. Please upload a PDF, DOC, DOCX, TXT, or image file."));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

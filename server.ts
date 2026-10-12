import express from "express";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { createServer as createViteServer } from "vite";
import { SystemState, Product, ProductionBatch, StockPosition, Transfer, DepotData, TruckData, AuditLog } from "./src/types.js";

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

// Windows Local Data Storage (Computer-based storage instead of AI Studio)
const DATA_DIR = process.env.APP_DATA_DIR || process.cwd();
const DB_PATH = path.join(DATA_DIR, "db.json");
const ASSETS_DIR = path.join(DATA_DIR, "assets");
const BACKUPS_DIR = path.join(DATA_DIR, "backups");

// Ensure local directories exist on the computer
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}
if (!fs.existsSync(BACKUPS_DIR)) {
  fs.mkdirSync(BACKUPS_DIR, { recursive: true });
}

// Preserve existing data: If target db.json does not exist in DATA_DIR, copy from cwd or backup
if (!fs.existsSync(DB_PATH)) {
  const rootDb = path.join(process.cwd(), "db.json");
  const backupDb = path.join(process.cwd(), "db.backup.json");
  if (fs.existsSync(rootDb)) {
    try {
      fs.copyFileSync(rootDb, DB_PATH);
      console.log(`[Storage] Preserved existing data: copied ${rootDb} to ${DB_PATH}`);
    } catch (e) {
      console.error("[Storage] Failed copying root db.json:", e);
    }
  } else if (fs.existsSync(backupDb)) {
    try {
      fs.copyFileSync(backupDb, DB_PATH);
      console.log(`[Storage] Restored data from backup: ${backupDb} to ${DB_PATH}`);
    } catch (e) {
      console.error("[Storage] Failed copying db.backup.json:", e);
    }
  }
}

app.use(express.json({ limit: '10mb' }));

// API Endpoint to save uploaded files (images, videos) to the server
app.post("/api/upload", (req, res) => {
  try {
    const { fileName, fileData } = req.body; // fileData is base64 string
    if (!fileName || !fileData) {
      return res.status(400).json({ error: "Missing fileName or fileData" });
    }
    
    // Ensure assets directory exists
    if (!fs.existsSync(ASSETS_DIR)) {
      fs.mkdirSync(ASSETS_DIR, { recursive: true });
    }
    
    // Clean the file name to avoid path traversal
    const safeFileName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, "_");
    const filePath = path.join(ASSETS_DIR, safeFileName);
    
    // Strip base64 header if present (e.g., "data:image/png;base64,")
    const base64Data = fileData.replace(/^data:[^;]+;base64,/, "");
    
    // Write file to disk
    fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
    
    console.log(`Successfully saved uploaded file to local disk: ${filePath}`);
    
    res.json({ 
      success: true, 
      url: `/assets/${safeFileName}`,
      fileName: safeFileName
    });
  } catch (error: any) {
    console.error("Failed to save uploaded file:", error);
    res.status(500).json({ error: error.message || "Failed to save file" });
  }
});

// Explicitly serve physical /assets directory from ASSETS_DIR under /assets URL path
app.use("/assets", express.static(ASSETS_DIR));

// Middleware to return 404 for non-existent static assets (images, videos, etc.) in /assets path
app.use((req, res, next) => {
  const isAssetsPath = req.path.startsWith("/assets/") || req.path.includes("input_file");
  if (isAssetsPath) {
    const ext = path.extname(req.path).toLowerCase();
    const isMedia = [".png", ".jpg", ".jpeg", ".gif", ".mp4", ".webm", ".ogg", ".mp3", ".wav", ".svg"].includes(ext) || req.path.includes("input_file");
    
    if (isMedia) {
      const possiblePaths = [
        path.join(ASSETS_DIR, path.basename(req.path)),
        path.join(process.cwd(), req.path),
        path.join(process.cwd(), "public", req.path),
        path.join(process.cwd(), "dist", req.path)
      ];
      
      let exists = false;
      for (const p of possiblePaths) {
        if (fs.existsSync(p) && fs.statSync(p).isFile()) {
          exists = true;
          break;
        }
      }
      
      if (!exists) {
        return res.status(404).send("Not Found");
      }
    }
  }
  next();
});

// Initial Seed Data for products
const initialProducts: Product[] = [
  {
    id: "prod-01",
    name: "TWINNY Grenadine lait",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567011",
    image: "#EF4444", // Red, like Grenadine
    createdAt: "2026-06-01",
    expiryDays: 365,
    unitPriceCost: 1.5,
    unitPriceSell: 3.0,
    tempRequired: -18
  },
  {
    id: "prod-02",
    name: "TWINNY Ananas Coco",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567028",
    image: "#FBBF24", // Yellow, like Ananas Coco
    createdAt: "2026-06-01",
    expiryDays: 365,
    unitPriceCost: 1.5,
    unitPriceSell: 3.0,
    tempRequired: -18
  },
  {
    id: "prod-03",
    name: "Prestige Chocolat Caramel",
    category: "GAMME PREMIUM",
    barcode: "6111234567035",
    image: "#78350F", // Chocolate brown, premium
    createdAt: "2026-06-05",
    expiryDays: 270,
    unitPriceCost: 2.5,
    unitPriceSell: 5.5,
    tempRequired: -20
  },
  {
    id: "prod-04",
    name: "Fraise Melba Gourmande",
    category: "GAMME GOURMET",
    barcode: "6111234567042",
    image: "#F472B6", // Pink, gourmet
    createdAt: "2026-05-20",
    expiryDays: 365,
    unitPriceCost: 2.0,
    unitPriceSell: 4.5,
    tempRequired: -18
  },
  {
    id: "prod-05",
    name: "Mystique Magic Bubblegum",
    category: "GAMME MAGICIEN",
    barcode: "6111234567059",
    image: "#8B5CF6", // Purple, magician
    createdAt: "2026-06-10",
    expiryDays: 180,
    unitPriceCost: 1.8,
    unitPriceSell: 4.0,
    tempRequired: -18
  },
  {
    id: "prod-06",
    name: "CAPITANO Crème de mangue",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567066",
    image: "#F59E0B", // Orange, mango
    createdAt: "2026-06-12",
    expiryDays: 365,
    unitPriceCost: 2.0,
    unitPriceSell: 4.5,
    tempRequired: -18
  },
  {
    id: "prod-07",
    name: "CAPITANO Vanille Chocolat",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567073",
    image: "#7C2D12", // Brown
    createdAt: "2026-06-12",
    expiryDays: 365,
    unitPriceCost: 2.0,
    unitPriceSell: 4.5,
    tempRequired: -18
  },
  {
    id: "prod-08",
    name: "TWISTY Morceaux de Fraise",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567080",
    image: "#F43F5E", // Red pink
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 1.5,
    unitPriceSell: 3.5,
    tempRequired: -18
  },
  {
    id: "prod-09",
    name: "MINI GARCIA Chocolat",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567097",
    image: "#4B5563", // Gray/brown
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 1.2,
    unitPriceSell: 2.5,
    tempRequired: -18
  },
  {
    id: "prod-10",
    name: "BROCHETTE Fraise Citron",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567103",
    image: "#EC4899", // Bright Pink
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 1.2,
    unitPriceSell: 2.5,
    tempRequired: -18
  },
  {
    id: "prod-11",
    name: "DELICIO Vanille Fraise",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567110",
    image: "#FB7185", // Rose
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 1.6,
    unitPriceSell: 3.5,
    tempRequired: -18
  },
  {
    id: "prod-12",
    name: "P'TIPO Vanille Chocolat",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567127",
    image: "#9A3412", // Deep brown
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 1.5,
    unitPriceSell: 3.0,
    tempRequired: -18
  },
  {
    id: "prod-13",
    name: "POT FRIO Coulis Fraise",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567134",
    image: "#E11D48", // Rose red
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 1.8,
    unitPriceSell: 4.0,
    tempRequired: -18
  },
  {
    id: "prod-14",
    name: "GOLDEN GLOBE Yaourt",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567141",
    image: "#0284C7", // Sky blue
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 2.0,
    unitPriceSell: 4.5,
    tempRequired: -18
  },
  {
    id: "prod-29",
    name: "CAPITANO Enrobé Chocolat",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567295",
    image: "#3B2314", // Dark chocolate brown
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 2.2,
    unitPriceSell: 5.0,
    tempRequired: -18
  },
  {
    id: "prod-30",
    name: "CAPITANO Framboise",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567301",
    image: "#EC4899", // Raspberry Pink
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 2.1,
    unitPriceSell: 4.8,
    tempRequired: -18
  },
  {
    id: "prod-31",
    name: "DELICIO Chocolat",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567318",
    image: "#451A03", // Chocolate
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 1.6,
    unitPriceSell: 3.5,
    tempRequired: -18
  },
  {
    id: "prod-32",
    name: "MINI GARCIA Vanille Fraise Coco",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567325",
    image: "#F3E8FF", // Light coconut/strawberry
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 1.2,
    unitPriceSell: 2.5,
    tempRequired: -18
  },
  {
    id: "prod-33",
    name: "P'TIPO Vanille Fraise",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567332",
    image: "#FCE7F3", // Pinkish-white
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 1.5,
    unitPriceSell: 3.0,
    tempRequired: -18
  },
  {
    id: "prod-34",
    name: "POT FRIO Coulis Chocolat",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567349",
    image: "#78350F", // Chocolate syrup
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 1.8,
    unitPriceSell: 4.0,
    tempRequired: -18
  },
  {
    id: "prod-35",
    name: "POT FRIO Coulis Citron",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567356",
    image: "#EAB308", // Lemon Yellow
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 1.8,
    unitPriceSell: 4.0,
    tempRequired: -18
  },
  {
    id: "prod-36",
    name: "GOLDEN GLOBE Fraise",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567363",
    image: "#F43F5E", // Strawberry Red
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 2.0,
    unitPriceSell: 4.5,
    tempRequired: -18
  },
  {
    id: "prod-37",
    name: "GOLDEN GLOBE Chocolat",
    category: "GAMME CLASSIQUE",
    barcode: "6111234567370",
    image: "#4B2E1E", // Chocolate Brown
    createdAt: "2026-06-15",
    expiryDays: 365,
    unitPriceCost: 2.0,
    unitPriceSell: 4.5,
    tempRequired: -18
  },
  {
    id: "prod-15",
    name: "PANDA Vanille Chocolat 1L",
    category: "GAMME GOURMET",
    barcode: "6111234567196",
    image: "#0F172A", // Dark Slate, tub
    createdAt: "2026-06-10",
    expiryDays: 365,
    unitPriceCost: 8.0,
    unitPriceSell: 18.0,
    tempRequired: -18
  },
  {
    id: "prod-16",
    name: "OCEANO Vanille Fraise 1L",
    category: "GAMME GOURMET",
    barcode: "6111234567202",
    image: "#DB2777", // Pink, tub
    createdAt: "2026-06-10",
    expiryDays: 365,
    unitPriceCost: 9.0,
    unitPriceSell: 20.0,
    tempRequired: -18
  },
  {
    id: "prod-38",
    name: "PANDA Nougat Noisettes 1L",
    category: "GAMME GOURMET",
    barcode: "6111234567387",
    image: "#D97706", // Honey amber/nougat, tub
    createdAt: "2026-06-10",
    expiryDays: 365,
    unitPriceCost: 8.5,
    unitPriceSell: 19.0,
    tempRequired: -18
  },
  {
    id: "prod-39",
    name: "PANDA Vanille Fraise 1L",
    category: "GAMME GOURMET",
    barcode: "6111234567394",
    image: "#EC4899", // Strawberry pink, tub
    createdAt: "2026-06-10",
    expiryDays: 365,
    unitPriceCost: 8.0,
    unitPriceSell: 18.0,
    tempRequired: -18
  },
  {
    id: "prod-40",
    name: "OCEANO Vanille Chocolat 1L",
    category: "GAMME GOURMET",
    barcode: "6111234567400",
    image: "#451A03", // Rich chocolate brown, tub
    createdAt: "2026-06-10",
    expiryDays: 365,
    unitPriceCost: 9.0,
    unitPriceSell: 20.0,
    tempRequired: -18
  },
  {
    id: "prod-41",
    name: "OCEANO Vanille Citron 1L",
    category: "GAMME GOURMET",
    barcode: "6111234567417",
    image: "#EAB308", // Lemon yellow, tub
    createdAt: "2026-06-10",
    expiryDays: 365,
    unitPriceCost: 9.0,
    unitPriceSell: 20.0,
    tempRequired: -18
  },
  {
    id: "prod-17",
    name: "CROQUANTY Vanille enrobée",
    category: "GAMME PREMIUM",
    barcode: "6111234567165",
    image: "#D97706", // Amber
    createdAt: "2026-06-10",
    expiryDays: 365,
    unitPriceCost: 2.5,
    unitPriceSell: 5.5,
    tempRequired: -20
  },
  {
    id: "prod-18",
    name: "Prestige Vanille Fraise",
    category: "GAMME PREMIUM",
    barcode: "6111234567158",
    image: "#BE123C", // Deep rose
    createdAt: "2026-06-10",
    expiryDays: 365,
    unitPriceCost: 2.5,
    unitPriceSell: 5.5,
    tempRequired: -20
  },
  {
    id: "prod-19",
    name: "OMEGA Biscuit Caramel",
    category: "GAMME PREMIUM",
    barcode: "6111234567172",
    image: "#1E3A8A", // Blue premium
    createdAt: "2026-06-10",
    expiryDays: 365,
    unitPriceCost: 2.8,
    unitPriceSell: 6.0,
    tempRequired: -20
  },
  {
    id: "prod-20",
    name: "POT FLEURY Fraise Citron",
    category: "GAMME PREMIUM",
    barcode: "6111234567189",
    image: "#EC4899", // Pink flower
    createdAt: "2026-06-10",
    expiryDays: 365,
    unitPriceCost: 2.2,
    unitPriceSell: 5.0,
    tempRequired: -20
  },
  {
    id: "prod-21",
    name: "ALDO Cornet Vanille Fraise",
    category: "GAMME MAGICIEN",
    barcode: "6111234567219",
    image: "#F43F5E", // Rose magic
    createdAt: "2026-06-11",
    expiryDays: 365,
    unitPriceCost: 1.8,
    unitPriceSell: 4.0,
    tempRequired: -18
  },
  {
    id: "prod-22",
    name: "ICE FRUITY Fraise Orange",
    category: "GAMME MAGICIEN",
    barcode: "6111234567226",
    image: "#F97316", // Orange tube
    createdAt: "2026-06-11",
    expiryDays: 365,
    unitPriceCost: 1.0,
    unitPriceSell: 2.0,
    tempRequired: -18
  },
  {
    id: "prod-23",
    name: "ALADINO Ananas Coco",
    category: "GAMME MAGICIEN",
    barcode: "6111234567233",
    image: "#EAB308", // Yellow wizard
    createdAt: "2026-06-11",
    expiryDays: 365,
    unitPriceCost: 1.5,
    unitPriceSell: 3.5,
    tempRequired: -18
  },
  {
    id: "prod-24",
    name: "POUCHY Bonbons",
    category: "GAMME MAGICIEN",
    barcode: "6111234567240",
    image: "#A855F7", // Purple pouch
    createdAt: "2026-06-11",
    expiryDays: 365,
    unitPriceCost: 1.2,
    unitPriceSell: 2.5,
    tempRequired: -18
  },
  {
    id: "prod-25",
    name: "POPEYE Citron Fraise",
    category: "GAMME MAGICIEN",
    barcode: "6111234567257",
    image: "#22C55E", // Green sailor
    createdAt: "2026-06-11",
    expiryDays: 365,
    unitPriceCost: 1.2,
    unitPriceSell: 2.5,
    tempRequired: -18
  },
  {
    id: "prod-26",
    name: "PASTEK Melon Pastèque",
    category: "GAMME MAGICIEN",
    barcode: "6111234567264",
    image: "#EF4444", // Watermelon Red
    createdAt: "2026-06-11",
    expiryDays: 365,
    unitPriceCost: 1.5,
    unitPriceSell: 3.0,
    tempRequired: -18
  },
  {
    id: "prod-27",
    name: "POMMY Vanille Pomme",
    category: "GAMME MAGICIEN",
    barcode: "6111234567271",
    image: "#84CC16", // Lime pomme
    createdAt: "2026-06-11",
    expiryDays: 365,
    unitPriceCost: 1.5,
    unitPriceSell: 3.0,
    tempRequired: -18
  },
  {
    id: "prod-28",
    name: "PIRATOS Vanille Chocolat",
    category: "GAMME MAGICIEN",
    barcode: "6111234567288",
    image: "#78350F", // Chocolate pirate
    createdAt: "2026-06-11",
    expiryDays: 365,
    unitPriceCost: 1.6,
    unitPriceSell: 3.5,
    tempRequired: -18
  }
];

// List of regional depots to support
const regionalDepotsConfig = [
  { name: "Casablanca", trucksCount: 33 },
  { name: "Marrakech", trucksCount: 80 },
  { name: "Agadir", trucksCount: 7 },
  { name: "Fès", trucksCount: 12 },
  { name: "Tanger", trucksCount: 5 },
  { name: "Oujda", trucksCount: 10 },
  { name: "Meknès", trucksCount: 8 },
  { name: "Safi", trucksCount: 5 },
  { name: "Rabat", trucksCount: 15 },
  { name: "Laâyoune", trucksCount: 6 },
  { name: "Berrechid", trucksCount: 5 }
];

function getInitialState(): SystemState {
  const products = initialProducts;
  
  // Create some initial batches
  const batches: ProductionBatch[] = [
    {
      id: "batch-101",
      batchNumber: "LOT-2026-0601-A",
      productId: "prod-01",
      productName: "TWINNY Grenadine lait",
      quantity: 500,
      quantityDamaged: 5,
      quantityExpired: 0,
      productionDate: "2026-06-01",
      expirationDate: "2027-06-01",
      status: "active",
      tempRegistered: -19.5
    },
    {
      id: "batch-102",
      batchNumber: "LOT-2026-0602-B",
      productId: "prod-02",
      productName: "TWINNY Ananas Coco",
      quantity: 400,
      quantityDamaged: 0,
      quantityExpired: 0,
      productionDate: "2026-06-02",
      expirationDate: "2027-06-02",
      status: "active",
      tempRegistered: -21.2
    },
    {
      id: "batch-103",
      batchNumber: "LOT-2026-0610-C",
      productId: "prod-05",
      productName: "Mystique Magic Bubblegum",
      quantity: 800,
      quantityDamaged: 12,
      quantityExpired: 0,
      productionDate: "2026-06-10",
      expirationDate: "2026-12-10",
      status: "active",
      tempRegistered: -18.2
    }
  ];

  // Stock positions
  const stockPositions: StockPosition[] = [];
  
  // Add initial factory stock positions for our products
  stockPositions.push({ id: "sp-01", productId: "prod-01", productName: "TWINNY Grenadine lait", location: "Magasin Usine", quantity: 1500 });
  stockPositions.push({ id: "sp-02", productId: "prod-02", productName: "TWINNY Ananas Coco", location: "Magasin Usine", quantity: 1200 });
  stockPositions.push({ id: "sp-03", productId: "prod-03", productName: "Prestige Chocolat Caramel", location: "Magasin Usine", quantity: 800 });
  stockPositions.push({ id: "sp-04", productId: "prod-04", productName: "Fraise Melba Gourmande", location: "Magasin Usine", quantity: 450 });
  stockPositions.push({ id: "sp-05", productId: "prod-05", productName: "Mystique Magic Bubblegum", location: "Magasin Usine", quantity: 2000 });

  // Add initial stocks in intermediary stops
  stockPositions.push({ id: "sp-06", productId: "prod-01", productName: "TWINNY Grenadine lait", location: "Magasin MICZ", quantity: 300 });
  stockPositions.push({ id: "sp-07", productId: "prod-02", productName: "TWINNY Ananas Coco", location: "Magasin MICZ", quantity: 150 });
  stockPositions.push({ id: "sp-08", productId: "prod-01", productName: "TWINNY Grenadine lait", location: "Magasin Zone Logistique", quantity: 200 });
  stockPositions.push({ id: "sp-09", productId: "prod-03", productName: "Prestige Chocolat Caramel", location: "Magasin Zone Logistique", quantity: 100 });

  // Initial Transfers
  const transfers: Transfer[] = [
    {
      id: "tr-001",
      trackingNumber: "TR-2026-101",
      source: "Magasin Usine",
      destination: "Magasin MICZ",
      items: [
        { productId: "prod-01", productName: "TWINNY Grenadine lait", quantity: 100 },
        { productId: "prod-02", productName: "TWINNY Ananas Coco", quantity: 150 }
      ],
      status: "Received",
      sentAt: "2026-06-25T08:00:00Z",
      receivedAt: "2026-06-25T11:30:00Z",
      carrierName: "Transport Ghazali Truck 04",
      scannedCartons: 250,
      lossCount: 0,
      temperatureAlert: false,
      notes: "Livraison conforme."
    },
    {
      id: "tr-002",
      trackingNumber: "TR-2026-102",
      source: "Magasin MICZ",
      destination: "Magasin Zone Logistique",
      items: [
        { productId: "prod-01", productName: "TWINNY Grenadine lait", quantity: 200 },
        { productId: "prod-03", productName: "Prestige Chocolat Caramel", quantity: 100 }
      ],
      status: "Received",
      sentAt: "2026-06-26T09:00:00Z",
      receivedAt: "2026-06-26T14:15:00Z",
      carrierName: "Transport Ghazali Truck 12",
      scannedCartons: 300,
      lossCount: 0,
      temperatureAlert: false,
      notes: "Reçu et stocké correctement."
    },
    {
      id: "tr-003",
      trackingNumber: "TR-2026-103",
      source: "Magasin Zone Logistique",
      destination: "Dépôt Casablanca",
      items: [
        { productId: "prod-01", productName: "TWINNY Grenadine lait", quantity: 150 },
        { productId: "prod-05", productName: "Mystique Magic Bubblegum", quantity: 250 }
      ],
      status: "In Transit",
      sentAt: "2026-06-28T06:30:00Z",
      receivedAt: null,
      carrierName: "Transporteur Nord-Sud #33",
      scannedCartons: 400,
      lossCount: 0,
      temperatureAlert: false,
      notes: "En route vers Casablanca"
    }
  ];

  // Initialize Depots
  const depots: Record<string, DepotData> = {};
  regionalDepotsConfig.forEach(d => {
    depots[d.name] = {
      name: d.name,
      trucksCount: d.trucksCount,
      stock: [
        { productId: "prod-01", productName: "TWINNY Grenadine lait", quantity: d.name === "Casablanca" || d.name === "Marrakech" ? 400 : 120 },
        { productId: "prod-02", productName: "TWINNY Ananas Coco", quantity: d.name === "Casablanca" || d.name === "Marrakech" ? 250 : 80 },
        { productId: "prod-03", productName: "Prestige Chocolat Caramel", quantity: d.name === "Casablanca" || d.name === "Marrakech" ? 180 : 50 },
        { productId: "prod-05", productName: "Mystique Magic Bubblegum", quantity: d.name === "Casablanca" || d.name === "Marrakech" ? 300 : 90 }
      ],
      returns: [],
      adjustments: [
        { id: "adj-1", date: "2026-06-27", productId: "prod-01", productName: "TWINNY Grenadine lait", type: "reception", quantity: 100, notes: "Seeding stock" }
      ]
    };
  });

  // Setup Trucks
  const trucks: TruckData[] = [];
  
  // Seed a couple of active trucks per depot
  regionalDepotsConfig.forEach((d) => {
    // We add 2 trucks for Casablanca and Marrakech, and 1 for others to keep it light
    const trucksToAdd = (d.name === "Casablanca" || d.name === "Marrakech") ? 2 : 1;
    for (let i = 1; i <= trucksToAdd; i++) {
      const id = `TRK-${d.name.substring(0, 2).toUpperCase()}-${String(i).padStart(2, "0")}`;
      const driverName = `Chauffeur ${d.name} ${i}`;
      trucks.push({
        id,
        driverName,
        depotName: d.name,
        tournee: `Secteur ${d.name} Zone ${i === 1 ? 'Nord' : 'Sud'}`,
        stock: [
          { productId: "prod-01", productName: "TWINNY Grenadine lait", loaded: 50, delivered: 42, returned: 6, lost: 2 },
          { productId: "prod-02", productName: "TWINNY Ananas Coco", loaded: 30, delivered: 28, returned: 1, lost: 1 },
          { productId: "prod-05", productName: "Mystique Magic Bubblegum", loaded: 40, delivered: 40, returned: 0, lost: 0 }
        ],
        deliveries: [
          {
            id: `del-${id}-101`,
            clientName: "Supermarché Marjane " + d.name,
            city: d.name,
            items: [
              { productId: "prod-01", productName: "TWINNY Grenadine lait", quantity: 20 },
              { productId: "prod-02", productName: "TWINNY Ananas Coco", quantity: 15 }
            ],
            status: "Delivered",
            deliveredAt: "2026-06-28T08:30:00Z",
            signature: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='50'><path d='M10,25 Q30,10 50,25 T90,25' fill='none' stroke='black' stroke-width='2'/></svg>",
            gps: { lat: 33.5731, lng: -7.5898 },
            paymentMethod: "Cheque"
          },
          {
            id: `del-${id}-102`,
            clientName: "Alimentation Générale El Hanaa",
            city: d.name,
            items: [
              { productId: "prod-01", productName: "TWINNY Grenadine lait", quantity: 10 },
              { productId: "prod-05", productName: "Mystique Magic Bubblegum", quantity: 20 }
            ],
            status: "Pending",
            deliveredAt: null,
            signature: null,
            gps: null,
            paymentMethod: "Cash"
          }
        ],
        syncPending: false,
        isActive: true
      });
    }
  });

  // Setup initial logs
  const auditLogs: AuditLog[] = [
    {
      id: "log-001",
      timestamp: "2026-06-28T06:30:00Z",
      userId: "user-usine",
      userName: "Rachid Usine",
      role: "Responsable Usine",
      action: "Création de Lot",
      details: "Création du lot de production LOT-2026-0610-C pour 800 cartons de Mystique Magic Bubblegum."
    },
    {
      id: "log-002",
      timestamp: "2026-06-28T07:15:00Z",
      userId: "user-admin",
      userName: "Youssef Zahi",
      role: "Super Admin",
      action: "Transfert Expédié",
      details: "Transfert TR-2026-103 expédié de Magasin Zone Logistique vers Dépôt Casablanca (400 cartons)."
    }
  ];

  return {
    products,
    batches,
    stockPositions,
    transfers,
    depots,
    trucks,
    auditLogs,
    deliveryNotes: [],
    supplyRequests: [],
    bonAvoirs: [],
    bonEncaissements: [],
    bonChanges: []
  };
}

// Read database
function loadState(): SystemState {
  try {
    if (fs.existsSync(DB_PATH)) {
      const fileData = fs.readFileSync(DB_PATH, "utf-8");
      const state: SystemState = JSON.parse(fileData);
      
      // Ensure deliveryNotes is initialized
      if (!state.deliveryNotes) {
        state.deliveryNotes = [];
      }
      if (!state.supplyRequests) {
        state.supplyRequests = [];
      }
      if (!state.bonAvoirs) {
        state.bonAvoirs = [];
      }
      if (!state.bonEncaissements) {
        state.bonEncaissements = [];
      }
      if (!state.bonChanges) {
        state.bonChanges = [];
      }

      // Merge missing initial products
      let updated = false;
      if (state && Array.isArray(state.products)) {
        for (const ip of initialProducts) {
          const exists = state.products.some(p => p.id === ip.id);
          if (!exists) {
            state.products.push(ip);
            updated = true;
          }
        }
      }

      // Ensure all standard regional depots exist in state.depots
      if (!state.depots) {
        state.depots = {};
        updated = true;
      }
      if (!Array.isArray(state.trucks)) {
        state.trucks = [];
        updated = true;
      }

      regionalDepotsConfig.forEach(d => {
        if (!state.depots[d.name]) {
          const stock = (state.products || initialProducts).map(p => ({
            productId: p.id,
            productName: p.name,
            quantity: d.name === "Casablanca" || d.name === "Marrakech" ? 300 : 100,
            startingStock: d.name === "Casablanca" || d.name === "Marrakech" ? 300 : 100
          }));
          state.depots[d.name] = {
            name: d.name,
            trucksCount: d.trucksCount,
            stock,
            returns: [],
            adjustments: []
          };
          updated = true;
        }

        // Ensure at least 1 truck exists for this depot if none exist
        const hasTruck = state.trucks.some(t => t.depotName === d.name);
        if (!hasTruck) {
          const id = `TRK-${d.name.substring(0, 2).toUpperCase()}-01`;
          state.trucks.push({
            id,
            driverName: `Chauffeur ${d.name} 1`,
            depotName: d.name,
            tournee: `Secteur ${d.name} Zone Centre`,
            stock: [
              { productId: "prod-01", productName: "TWINNY Grenadine lait", loaded: 40, delivered: 35, returned: 5, lost: 0 },
              { productId: "prod-02", productName: "TWINNY Ananas Coco", loaded: 30, delivered: 28, returned: 2, lost: 0 },
              { productId: "prod-05", productName: "Mystique Magic Bubblegum", loaded: 30, delivered: 30, returned: 0, lost: 0 }
            ],
            deliveries: [],
            syncPending: false,
            isActive: true
          });
          updated = true;
        }
      });
      
      if (updated) {
        saveState(state);
      }
      
      return state;
    }
  } catch (error) {
    console.error("Failed to parse db.json, returning default seed data.", error);
  }
  
  // Write default seed if it doesn't exist
  const defaultState = getInitialState();
  saveState(defaultState);
  return defaultState;
}

// Write database
function saveState(state: SystemState) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save state to db.json", error);
  }
}

// Automatic backup on computer
function createAutoBackup() {
  try {
    if (fs.existsSync(DB_PATH) && fs.statSync(DB_PATH).size > 100) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = path.join(BACKUPS_DIR, `db-backup-${timestamp}.json`);
      fs.copyFileSync(DB_PATH, backupFile);
      
      const files = fs.readdirSync(BACKUPS_DIR)
        .filter(f => f.startsWith("db-backup-") && f.endsWith(".json"))
        .map(f => path.join(BACKUPS_DIR, f))
        .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
      
      if (files.length > 15) {
        files.slice(15).forEach(f => {
          try { fs.unlinkSync(f); } catch {}
        });
      }
    }
  } catch (err) {
    console.error("[Storage] Auto-backup failed:", err);
  }
}

// Helper to log audit events
function addAuditLog(state: SystemState, action: string, details: string, user = { id: "system", name: "System", role: "Système" }): AuditLog {
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId: user.id,
    userName: user.name,
    role: user.role,
    action,
    details
  };
  state.auditLogs.unshift(newLog);
  // Keep logs to latest 150
  if (state.auditLogs.length > 150) {
    state.auditLogs = state.auditLogs.slice(0, 150);
  }
  return newLog;
}

// System & Storage API endpoints (Local PC storage management)
app.get("/api/system/storage", (req, res) => {
  try {
    const stats = fs.existsSync(DB_PATH) ? fs.statSync(DB_PATH) : null;
    const backupFiles = fs.existsSync(BACKUPS_DIR) 
      ? fs.readdirSync(BACKUPS_DIR).filter(f => f.endsWith(".json"))
      : [];
    const state = loadState();

    res.json({
      success: true,
      dataDir: DATA_DIR,
      dbPath: DB_PATH,
      assetsDir: ASSETS_DIR,
      backupsDir: BACKUPS_DIR,
      dbSizeBytes: stats ? stats.size : 0,
      lastModified: stats ? stats.mtime : null,
      backupsCount: backupFiles.length,
      counts: {
        products: state.products?.length || 0,
        batches: state.batches?.length || 0,
        stockPositions: state.stockPositions?.length || 0,
        transfers: state.transfers?.length || 0,
        trucks: state.trucks?.length || 0,
        deliveryNotes: state.deliveryNotes?.length || 0,
        supplyRequests: state.supplyRequests?.length || 0,
        bonAvoirs: state.bonAvoirs?.length || 0,
        bonEncaissements: state.bonEncaissements?.length || 0,
        bonChanges: state.bonChanges?.length || 0,
        auditLogs: state.auditLogs?.length || 0,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Download full database backup
app.get("/api/system/backup", (req, res) => {
  try {
    if (!fs.existsSync(DB_PATH)) {
      return res.status(404).json({ error: "Database file not found" });
    }
    const filename = `zahi-ice-stock-backup-${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Type", "application/json");
    fs.createReadStream(DB_PATH).pipe(res);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Restore database from uploaded JSON
app.post("/api/system/restore", (req, res) => {
  try {
    const newState = req.body;
    if (!newState || !Array.isArray(newState.products)) {
      return res.status(400).json({ error: "Structure invalide : la liste des produits est requise." });
    }

    if (fs.existsSync(DB_PATH)) {
      const preRestorePath = path.join(BACKUPS_DIR, `pre-restore-${Date.now()}.json`);
      fs.copyFileSync(DB_PATH, preRestorePath);
    }

    saveState(newState);
    res.json({ success: true, message: "Base de données restaurée avec succès", state: newState });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Open storage directory in Windows File Explorer
app.post("/api/system/open-folder", (req, res) => {
  try {
    const targetPath = req.body.folder === "assets" ? ASSETS_DIR : DATA_DIR;
    exec(`explorer "${targetPath}"`);
    res.json({ success: true, opened: targetPath });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// API Routes
app.get("/api/state", (req, res) => {
  res.json(loadState());
});

// Update Product details
app.post("/api/products/:id", (req, res) => {
  const { id } = req.params;
  const { name, category, barcode, expiryDays, unitPriceCost, unitPriceSell, tempRequired, cartonsPerPalette, user } = req.body;
  const state = loadState();
  
  const productIndex = state.products.findIndex(p => p.id === id);
  if (productIndex === -1) {
    return res.status(404).json({ error: "Product not found" });
  }

  const oldProduct = state.products[productIndex];
  const updatedProduct = {
    ...oldProduct,
    name: name !== undefined ? name : oldProduct.name,
    category: category !== undefined ? category : oldProduct.category,
    barcode: barcode !== undefined ? barcode : oldProduct.barcode,
    expiryDays: expiryDays !== undefined ? Number(expiryDays) : oldProduct.expiryDays,
    unitPriceCost: unitPriceCost !== undefined ? Number(unitPriceCost) : oldProduct.unitPriceCost,
    unitPriceSell: unitPriceSell !== undefined ? Number(unitPriceSell) : oldProduct.unitPriceSell,
    tempRequired: tempRequired !== undefined ? Number(tempRequired) : oldProduct.tempRequired,
    cartonsPerPalette: cartonsPerPalette !== undefined ? Number(cartonsPerPalette) : (oldProduct.cartonsPerPalette || 100),
  };

  state.products[productIndex] = updatedProduct;

  // Sync batch expiration dates if expiryDays changed
  if (expiryDays !== undefined && Number(expiryDays) !== oldProduct.expiryDays && Array.isArray(state.batches)) {
    const newExpiry = Number(expiryDays);
    state.batches.forEach(b => {
      if ((b.productId === id || b.productName === oldProduct.name) && b.productionDate) {
        const pDate = new Date(b.productionDate);
        if (!isNaN(pDate.getTime())) {
          pDate.setDate(pDate.getDate() + newExpiry);
          b.expirationDate = pDate.toISOString().split('T')[0];
        }
      }
    });
  }

  // Add an audit log if user context is provided
  if (user) {
    const log = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: user.id || "system",
      userName: user.name || "System",
      role: user.role || "Super Admin",
      action: "Modification Produit",
      details: `Produit modifié : ${updatedProduct.name} (${id})`
    };
    state.auditLogs.unshift(log);
  }

  saveState(state);
  res.json({ success: true, product: updatedProduct, state });
});

// Reset State
app.post("/api/reset", (req, res) => {
  const defaultState = getInitialState();
  saveState(defaultState);
  res.json({ success: true, state: defaultState });
});

// Production: Add new Batch
app.post("/api/production", (req, res) => {
  const { productId, quantity, tempRegistered, batchNumber, newProduct, user } = req.body;
  const state = loadState();
  
  let product;
  let targetProductId = productId;

  if (newProduct && newProduct.name) {
    // Generate new product
    const newId = `prod-${Date.now()}`;
    const createdProduct: Product = {
      id: newId,
      name: newProduct.name,
      category: newProduct.category || "Autre",
      barcode: newProduct.barcode || `6111${Math.floor(100000000 + Math.random() * 900000000)}`,
      image: newProduct.image || "#64748B", // Slate
      createdAt: new Date().toISOString().split('T')[0],
      expiryDays: Number(newProduct.expiryDays || 365),
      unitPriceCost: Number(newProduct.unitPriceCost || 1.5),
      unitPriceSell: Number(newProduct.unitPriceSell || 3.0),
      tempRequired: Number(newProduct.tempRequired || -18)
    };
    state.products.push(createdProduct);
    product = createdProduct;
    targetProductId = newId;
  } else {
    product = state.products.find(p => p.id === productId);
  }

  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const productionDate = new Date().toISOString().split('T')[0];
  const expDate = new Date();
  expDate.setDate(expDate.getDate() + product.expiryDays);
  const expirationDate = expDate.toISOString().split('T')[0];

  const newBatch: ProductionBatch = {
    id: `batch-${Date.now()}`,
    batchNumber: batchNumber || `LOT-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`,
    productId: targetProductId,
    productName: product.name,
    quantity: Number(quantity),
    quantityDamaged: 0,
    quantityExpired: 0,
    productionDate,
    expirationDate,
    status: "active",
    tempRegistered: Number(tempRegistered || -18)
  };

  // Add batch
  state.batches.unshift(newBatch);

  // Update factory stock
  const factoryStock = state.stockPositions.find(
    sp => sp.productId === targetProductId && sp.location === "Magasin Usine"
  );

  if (factoryStock) {
    factoryStock.quantity += Number(quantity);
  } else {
    state.stockPositions.push({
      id: `sp-${Date.now()}`,
      productId: targetProductId,
      productName: product.name,
      location: "Magasin Usine",
      quantity: Number(quantity)
    });
  }

  addAuditLog(
    state,
    "Batch Production",
    `Création du lot ${newBatch.batchNumber} de ${quantity} cartons de "${product.name}" (Temp: ${tempRegistered}°C)`,
    user
  );

  saveState(state);
  res.json({ success: true, batch: newBatch, state });
});

// Report Stock Losses (Factory or Depots)
app.post("/api/losses", (req, res) => {
  const { location, type, quantity, productId, batchId, user } = req.body;
  const state = loadState();

  const product = state.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  const lossQty = Number(quantity);
  if (isNaN(lossQty) || lossQty <= 0) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  if (location === "Magasin Usine") {
    // 1. Deduct from factory stock
    const factoryStock = state.stockPositions.find(
      sp => sp.productId === productId && sp.location === "Magasin Usine"
    );
    if (factoryStock) {
      factoryStock.quantity = Math.max(0, factoryStock.quantity - lossQty);
    }

    // 2. If a specific batch is selected, update that batch
    let batchInfo = "";
    if (batchId) {
      const batch = state.batches.find(b => b.id === batchId);
      if (batch) {
        batch.quantity = Math.max(0, batch.quantity - lossQty);
        if (type === "damaged") {
          batch.quantityDamaged = (batch.quantityDamaged || 0) + lossQty;
        } else {
          batch.quantityExpired = (batch.quantityExpired || 0) + lossQty;
        }
        batchInfo = ` (Lot: ${batch.batchNumber})`;
      }
    }

    addAuditLog(
      state,
      "Perte Usine",
      `Déclaration de perte (${type === "damaged" ? "Casse" : "Expiration"}) de ${lossQty} cartons de "${product.name}" à l'Usine${batchInfo}`,
      user
    );
  } else {
    // Depot loss
    const depot = state.depots[location];
    if (!depot) {
      return res.status(404).json({ error: "Depot not found" });
    }

    let pStock = depot.stock.find(s => s.productId === productId);
    if (!pStock) {
      pStock = {
        productId,
        productName: product.name,
        startingStock: 0,
        quantity: 0
      };
      depot.stock.push(pStock);
    }

    pStock.quantity = Math.max(0, pStock.quantity - lossQty);

    // Register as a depot adjustment
    depot.adjustments.unshift({
      id: `adj-loss-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      productId,
      productName: product.name,
      type: type === "damaged" ? "damaged" : "lost",
      quantity: lossQty,
      notes: `Perte déclarée (${type === "damaged" ? "Casse" : "Expiration"})`
    });

    addAuditLog(
      state,
      "Perte Dépôt",
      `Déclaration de perte (${type === "damaged" ? "Casse" : "Expiration"}) de ${lossQty} cartons de "${product.name}" au Dépôt ${location}`,
      user
    );
  }

  saveState(state);
  res.json({ success: true, state });
});

// Internal Transfers: Create a Transfer
app.post("/api/transfers", (req, res) => {
  const { source, destination, items, carrierName, notes, user } = req.body;
  const state = loadState();

  // Validate stock availability in source location
  for (const item of items) {
    if (source === "Magasin Usine" || source === "Magasin MICZ" || source === "Magasin Zone Logistique") {
      const sourceStock = state.stockPositions.find(
        sp => sp.productId === item.productId && sp.location === source
      );
      if (!sourceStock || sourceStock.quantity < item.quantity) {
        return res.status(400).json({
          error: `Stock insuffisant pour "${item.productName}" au départ de ${source}. (Disponible: ${sourceStock?.quantity || 0}, Demandé: ${item.quantity})`
        });
      }
    } else {
      // If transfer is from regional depot
      const depot = state.depots[source];
      if (depot) {
        const depotStock = depot.stock.find(s => s.productId === item.productId);
        if (!depotStock || depotStock.quantity < item.quantity) {
          return res.status(400).json({
            error: `Stock insuffisant pour "${item.productName}" au ${source}. (Disponible: ${depotStock?.quantity || 0}, Demandé: ${item.quantity})`
          });
        }
      }
    }
  }

  // Deduct stock from source immediately to reserve it
  for (const item of items) {
    if (source === "Magasin Usine" || source === "Magasin MICZ" || source === "Magasin Zone Logistique") {
      const sourceStock = state.stockPositions.find(
        sp => sp.productId === item.productId && sp.location === source
      );
      if (sourceStock) sourceStock.quantity -= item.quantity;
    } else {
      const depot = state.depots[source];
      const depotStock = depot?.stock.find(s => s.productId === item.productId);
      if (depotStock) depotStock.quantity -= item.quantity;
    }
  }

  const totalCartons = items.reduce((sum: number, item: any) => sum + Number(item.quantity), 0);

  const newTransfer: Transfer = {
    id: `tr-${Date.now()}`,
    trackingNumber: `TR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
    source,
    destination,
    items,
    status: "Pending",
    sentAt: new Date().toISOString(),
    receivedAt: null,
    carrierName: carrierName || "Transport Interne Zahi",
    scannedCartons: 0,
    lossCount: 0,
    temperatureAlert: false,
    notes: notes || ""
  };

  state.transfers.unshift(newTransfer);

  addAuditLog(
    state,
    "Expédition Transfert",
    `Transfert ${newTransfer.trackingNumber} de ${totalCartons} cartons créé (${source} ➔ ${destination})`,
    user
  );

  saveState(state);
  res.json({ success: true, transfer: newTransfer, state });
});

// Internal Transfers: Update Status (Start transit, Validate / Receive)
app.post("/api/transfers/:id/status", (req, res) => {
  const { id } = req.params;
  const { status, scannedCartons, lossCount, tempAlert, notes, user } = req.body;
  const state = loadState();

  const transfer = state.transfers.find(t => t.id === id);
  if (!transfer) {
    return res.status(404).json({ error: "Transfer not found" });
  }

  const prevStatus = transfer.status;
  transfer.status = status;

  if (status === "In Transit") {
    addAuditLog(
      state,
      "Transit Transfert",
      `Le transfert ${transfer.trackingNumber} est désormais en transit.`,
      user
    );
  } else if (status === "Received") {
    transfer.receivedAt = new Date().toISOString();
    transfer.scannedCartons = Number(scannedCartons || 0);
    transfer.lossCount = Number(lossCount || 0);
    transfer.temperatureAlert = !!tempAlert;
    transfer.notes = notes || transfer.notes;

    // Credit stock to the destination location
    for (const item of transfer.items) {
      const finalQuantity = item.quantity - (transfer.lossCount > 0 ? Math.min(item.quantity, Math.round(transfer.lossCount / transfer.items.length)) : 0);
      
      if (transfer.destination === "Magasin Usine" || transfer.destination === "Magasin MICZ" || transfer.destination === "Magasin Zone Logistique") {
        const destStock = state.stockPositions.find(
          sp => sp.productId === item.productId && sp.location === transfer.destination
        );
        if (destStock) {
          destStock.quantity += finalQuantity;
        } else {
          state.stockPositions.push({
            id: `sp-${Date.now()}-${item.productId}`,
            productId: item.productId,
            productName: item.productName,
            location: transfer.destination,
            quantity: finalQuantity
          });
        }
      } else {
        // Destination is a regional depot
        const destDepotName = transfer.destination.replace("Dépôt ", "");
        const depot = state.depots[destDepotName];
        if (depot) {
          const depotStock = depot.stock.find(s => s.productId === item.productId);
          if (depotStock) {
            depotStock.quantity += finalQuantity;
          } else {
            depot.stock.push({
              productId: item.productId,
              productName: item.productName,
              quantity: finalQuantity
            });
          }

          // Register adjustment for reception
          depot.adjustments.push({
            id: `adj-${Date.now()}-${item.productId}`,
            date: new Date().toISOString().split('T')[0],
            productId: item.productId,
            productName: item.productName,
            type: "reception",
            quantity: finalQuantity,
            notes: `Réception transfert ${transfer.trackingNumber}`
          });

          // Register losses if any
          if (lossCount > 0) {
            const lossForProduct = Math.round(lossCount / transfer.items.length);
            depot.adjustments.push({
              id: `adj-loss-${Date.now()}-${item.productId}`,
              date: new Date().toISOString().split('T')[0],
              productId: item.productId,
              productName: item.productName,
              type: "lost",
              quantity: lossForProduct,
              notes: `Pertes constatées lors du transfert ${transfer.trackingNumber}`
            });
          }
        }
      }
    }

    addAuditLog(
      state,
      "Réception Transfert",
      `Le transfert ${transfer.trackingNumber} a été reçu au ${transfer.destination}. Pertes: ${transfer.lossCount}, Temp OK: ${!transfer.temperatureAlert}`,
      user
    );
  }

  saveState(state);
  res.json({ success: true, transfer, state });
});

// Depots: Add adjustments (Damage/Loss/Frictions)
app.post("/api/depots/:depotName/adjustments", (req, res) => {
  const { depotName } = req.params;
  const { productId, type, quantity, notes, user } = req.body;
  const state = loadState();

  const depot = state.depots[depotName];
  if (!depot) {
    return res.status(404).json({ error: "Depot not found" });
  }

  const pStock = depot.stock.find(s => s.productId === productId);
  if (!pStock) {
    return res.status(404).json({ error: "Product stock entry not found in depot" });
  }

  const adjustmentQty = Number(quantity);

  // Apply changes to depot stock
  if (type === "damaged" || type === "lost") {
    pStock.quantity -= adjustmentQty;
  } else if (type === "correction") {
    // Treat as general addition or deduction based on notes, or absolute correction
    pStock.quantity += adjustmentQty;
  }

  const newAdjustment = {
    id: `adj-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    productId,
    productName: pStock.productName,
    type,
    quantity: adjustmentQty,
    notes: notes || ""
  };

  depot.adjustments.unshift(newAdjustment);

  addAuditLog(
    state,
    "Ajustement Stock Dépôt",
    `Ajustement de stock au Dépôt ${depotName}: ${type} de ${quantity} cartons de "${pStock.productName}"`,
    user
  );

  saveState(state);
  res.json({ success: true, state });
});

// Depots: Add client returns
app.post("/api/depots/:depotName/returns", (req, res) => {
  const { depotName } = req.params;
  const { productId, quantity, reason, user } = req.body;
  const state = loadState();

  const depot = state.depots[depotName];
  if (!depot) {
    return res.status(404).json({ error: "Depot not found" });
  }

  const product = state.products.find(p => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  // Update depot stock (returns increment stock, but can be flagged for inspection)
  const pStock = depot.stock.find(s => s.productId === productId);
  const returnedQty = Number(quantity);

  if (pStock) {
    pStock.quantity += returnedQty;
  } else {
    depot.stock.push({
      productId,
      productName: product.name,
      quantity: returnedQty
    });
  }

  const newReturn = {
    id: `ret-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    productId,
    productName: product.name,
    quantity: returnedQty,
    reason: reason || "Non vendu"
  };

  depot.returns.unshift(newReturn);

  addAuditLog(
    state,
    "Retour Client Dépôt",
    `Retour enregistré au Dépôt ${depotName}: ${quantity} cartons de "${product.name}" (${reason})`,
    user
  );

  saveState(state);
  res.json({ success: true, state });
});

// Depots: Add a new depot / city
app.post("/api/depots", (req, res) => {
  const { name, user } = req.body;
  const state = loadState();

  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "Invalid depot name" });
  }

  const cleanName = name.trim();
  if (state.depots[cleanName]) {
    return res.status(400).json({ error: "Depot already exists" });
  }

  // Pre-fill with the default/existing active products with startingStock and quantity as 0
  const stock = state.products.map(p => ({
    productId: p.id,
    productName: p.name,
    quantity: 0,
    startingStock: 0
  }));

  state.depots[cleanName] = {
    name: cleanName,
    trucksCount: 0,
    stock,
    returns: [],
    adjustments: []
  };

  addAuditLog(
    state,
    "Création Dépôt",
    `Nouveau dépôt régional créé : ${cleanName}`,
    user
  );

  saveState(state);
  res.json({ success: true, state });
});

// Depots: Update starting stock & current stock
app.post("/api/depots/:depotName/starting-stock", (req, res) => {
  const { depotName } = req.params;
  const { productId, startingStock, quantity, user } = req.body;
  const state = loadState();

  const depot = state.depots[depotName];
  if (!depot) {
    return res.status(404).json({ error: "Depot not found" });
  }

  let pStock = depot.stock.find(s => s.productId === productId);
  if (!pStock) {
    const prod = state.products.find(p => p.id === productId);
    pStock = {
      productId,
      productName: prod ? prod.name : "Inconnu",
      quantity: quantity !== undefined ? Number(quantity) : 0,
      startingStock: startingStock !== undefined ? Number(startingStock) : 0
    };
    depot.stock.push(pStock);
  } else {
    if (startingStock !== undefined) pStock.startingStock = Number(startingStock);
    if (quantity !== undefined) pStock.quantity = Number(quantity);
  }

  addAuditLog(
    state,
    "Ajustement Stock de Départ",
    `Modification du stock de départ au Dépôt ${depotName} pour "${pStock.productName}" (Départ: ${pStock.startingStock}, Actuel: ${pStock.quantity})`,
    user
  );

  saveState(state);
  res.json({ success: true, state });
});

// Trucks: Load stock (Dépôt -> Camion)
app.post("/api/trucks/:truckId/load", (req, res) => {
  const { truckId } = req.params;
  const { items, tournee, user } = req.body; // items: [{ productId, quantity }]
  const state = loadState();

  const truck = state.trucks.find(t => t.id === truckId);
  if (!truck) {
    return res.status(404).json({ error: "Truck not found" });
  }

  const depot = state.depots[truck.depotName];
  if (!depot) {
    return res.status(404).json({ error: "Associated depot not found" });
  }

  // Validate depot has enough stock
  for (const item of items) {
    const depotStock = depot.stock.find(s => s.productId === item.productId);
    if (!depotStock || depotStock.quantity < item.quantity) {
      return res.status(400).json({
        error: `Stock insuffisant au dépôt pour charger "${item.productName}". (Dispo: ${depotStock?.quantity || 0}, Demandé: ${item.quantity})`
      });
    }
  }

  // Process loading
  for (const item of items) {
    // Deduct from depot
    const depotStock = depot.stock.find(s => s.productId === item.productId);
    if (depotStock) {
      depotStock.quantity -= item.quantity;
    }

    // Add to truck stock
    const tStock = truck.stock.find(s => s.productId === item.productId);
    if (tStock) {
      tStock.loaded += item.quantity;
    } else {
      truck.stock.push({
        productId: item.productId,
        productName: item.productName,
        loaded: item.quantity,
        delivered: 0,
        returned: 0,
        lost: 0
      });
    }
  }

  if (tournee) {
    truck.tournee = tournee;
  }

  addAuditLog(
    state,
    "Chargement Camion",
    `Chargement du camion ${truck.id} (${truck.driverName}) au Dépôt ${truck.depotName}. Total: ${items.reduce((s: number, i: any) => s + i.quantity, 0)} cartons.`,
    user
  );

  saveState(state);
  res.json({ success: true, truck, state });
});

// Trucks: Perform delivery (Camion -> Client)
app.post("/api/trucks/:truckId/delivery", (req, res) => {
  const { truckId } = req.params;
  const { clientName, items, signature, gps, paymentMethod, user } = req.body;
  const state = loadState();

  const truck = state.trucks.find(t => t.id === truckId);
  if (!truck) {
    return res.status(404).json({ error: "Truck not found" });
  }

  // Check truck stock availability
  for (const item of items) {
    const truckStock = truck.stock.find(s => s.productId === item.productId);
    const available = (truckStock?.loaded || 0) - (truckStock?.delivered || 0) - (truckStock?.returned || 0) - (truckStock?.lost || 0);
    if (available < item.quantity) {
      return res.status(400).json({
        error: `Stock insuffisant dans le camion pour livrer "${item.productName}". (Disponible: ${available}, Demandé: ${item.quantity})`
      });
    }
  }

  // Deliver items
  for (const item of items) {
    const truckStock = truck.stock.find(s => s.productId === item.productId);
    if (truckStock) {
      truckStock.delivered += item.quantity;
    }
  }

  const deliveryId = `del-${truck.id}-${Date.now()}`;
  const newDelivery = {
    id: deliveryId,
    clientName,
    city: truck.depotName,
    items,
    status: "Delivered" as const,
    deliveredAt: new Date().toISOString(),
    signature: signature || null,
    gps: gps || { lat: 33.5731, lng: -7.5898 }, // Default to Morocco/Casablanca region
    paymentMethod: paymentMethod || "Cash"
  };

  truck.deliveries.push(newDelivery);

  addAuditLog(
    state,
    "Livraison Client",
    `Camion ${truck.id} a livré "${clientName}" - Région ${truck.depotName} (${items.reduce((s: number, i: any) => s + i.quantity, 0)} cartons)`,
    user
  );

  saveState(state);
  res.json({ success: true, delivery: newDelivery, state });
});

// Trucks: End-of-day Returns and Losses (Camion -> Dépôt unloading)
app.post("/api/trucks/:truckId/return", (req, res) => {
  const { truckId } = req.params;
  const { returns, losses, user } = req.body; // returns/losses: [{ productId, quantity, reason }]
  const state = loadState();

  const truck = state.trucks.find(t => t.id === truckId);
  if (!truck) {
    return res.status(404).json({ error: "Truck not found" });
  }

  const depot = state.depots[truck.depotName];
  if (!depot) {
    return res.status(404).json({ error: "Depot not found" });
  }

  // Process returns to Depot
  if (returns && returns.length > 0) {
    for (const ret of returns) {
      const truckStock = truck.stock.find(s => s.productId === ret.productId);
      if (truckStock) {
        truckStock.returned += ret.quantity;
      }

      // Add back to depot stock
      const depotStock = depot.stock.find(s => s.productId === ret.productId);
      if (depotStock) {
        depotStock.quantity += ret.quantity;
      } else {
        depot.stock.push({
          productId: ret.productId,
          productName: ret.productName,
          quantity: ret.quantity
        });
      }

      // Register return in depot returns
      depot.returns.push({
        id: `ret-${Date.now()}-${ret.productId}`,
        date: new Date().toISOString().split('T')[0],
        productId: ret.productId,
        productName: ret.productName,
        quantity: ret.quantity,
        reason: ret.reason || "Retour fin de tournée"
      });
    }
  }

  // Process losses (damaged on truck / stolen / melt)
  if (losses && losses.length > 0) {
    for (const loss of losses) {
      const truckStock = truck.stock.find(s => s.productId === loss.productId);
      if (truckStock) {
        truckStock.lost += loss.quantity;
      }

      // Also register as an adjustment on the depot since the truck belongs to the depot
      depot.adjustments.push({
        id: `adj-loss-truck-${Date.now()}-${loss.productId}`,
        date: new Date().toISOString().split('T')[0],
        productId: loss.productId,
        productName: loss.productName,
        type: "lost",
        quantity: loss.quantity,
        notes: `Perte camion ${truck.id} (${loss.reason || 'Casse'})`
      });
    }
  }

  addAuditLog(
    state,
    "Retour Tournée Camion",
    `Camion ${truck.id} a clôturé sa tournée avec ${returns?.reduce((s: number, i: any) => s + i.quantity, 0) || 0} retours et ${losses?.reduce((s: number, i: any) => s + i.quantity, 0) || 0} pertes au Dépôt ${truck.depotName}.`,
    user
  );

  saveState(state);
  res.json({ success: true, truck, state });
});

// Create Bon de Livraison (Delivery Note) and deduct stock
app.post("/api/delivery-notes", (req, res) => {
  const { clientName, clientCode, date, congNumber, congType, sourceStockLocation, items, discount, user } = req.body;
  const state = loadState();

  if (!clientName || !sourceStockLocation || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: "Missing required delivery note parameters" });
  }

  // Ensure deliveryNotes is initialized
  if (!state.deliveryNotes) {
    state.deliveryNotes = [];
  }

  const validItems = items.filter((it: any) => Number(it.quantity) > 0);
  if (validItems.length === 0) {
    return res.status(400).json({ error: "Le bon de livraison doit contenir au moins un produit avec une quantité supérieure à 0." });
  }

  const generatedNoteNumber = `BL-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  // Deduct stock and process items
  const processedItems = validItems.map((item: any) => {
    const qty = Number(item.quantity);
    const price = Number(item.pricePerCarton || 0);
    const montant = qty * price;

    // Try to find matching product in database to deduct stock correctly
    let matchedProduct = state.products.find(p => 
      p.name.toLowerCase() === item.productName.toLowerCase() ||
      p.name.toLowerCase().includes(item.productName.toLowerCase()) ||
      item.productName.toLowerCase().includes(p.name.toLowerCase())
    );

    // If no matched product, let's create a new product to keep db robust
    if (!matchedProduct) {
      const newId = `prod-bl-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      matchedProduct = {
        id: newId,
        name: item.productName,
        category: "GAMME CLASSIQUE",
        barcode: `6111${Math.floor(100000000 + Math.random() * 900000000)}`,
        image: "#475569", // slate-600
        createdAt: new Date().toISOString().split('T')[0],
        expiryDays: 365,
        unitPriceCost: price * 0.5 / 10,
        unitPriceSell: price / 10,
        tempRequired: -18
      };
      state.products.push(matchedProduct);
    }

    // Now, decrease stock from the specified location
    const cleanLocation = sourceStockLocation.trim();
    const isRegionalDepot = cleanLocation !== "Magasin Usine" && 
                            cleanLocation !== "Magasin MICZ" && 
                            cleanLocation !== "Magasin Zone Logistique" &&
                            !cleanLocation.startsWith("Magasin");

    if (isRegionalDepot) {
      // Deduct from regional depot stock
      const depotName = cleanLocation.replace("Dépôt ", "").trim();
      const depot = state.depots[depotName] || Object.values(state.depots).find(d => d.name === depotName || d.name === cleanLocation);
      
      if (depot) {
        let depotStock = depot.stock.find(s => 
          s.productId === matchedProduct.id || 
          s.productName.toLowerCase().includes(item.productName.toLowerCase()) ||
          item.productName.toLowerCase().includes(s.productName.toLowerCase())
        );

        if (depotStock) {
          depotStock.quantity = Math.max(0, depotStock.quantity - qty);
        } else {
          depotStock = {
            productId: matchedProduct.id,
            productName: matchedProduct.name,
            quantity: 0
          };
          depot.stock.push(depotStock);
        }

        // Add adjustment log for the sale in depot adjustments
        depot.adjustments.unshift({
          id: `adj-bl-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          date: new Date().toISOString().split('T')[0],
          productId: matchedProduct.id,
          productName: matchedProduct.name,
          type: "correction",
          quantity: -qty,
          notes: `Vente BL ${generatedNoteNumber}`
        });
      }
    } else {
      // Deduct from factory/central stock positions
      let sp = state.stockPositions.find(s => 
        (s.productId === matchedProduct.id || s.productName.toLowerCase().includes(item.productName.toLowerCase())) &&
        s.location === cleanLocation
      );

      if (sp) {
        sp.quantity = Math.max(0, sp.quantity - qty);
      } else {
        sp = {
          id: `sp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: matchedProduct.id,
          productName: matchedProduct.name,
          location: cleanLocation,
          quantity: 0
        };
        state.stockPositions.push(sp);
      }
    }

    return {
      productName: item.productName,
      pcsPerCarton: Number(item.pcsPerCarton || 1),
      quantity: qty,
      pricePerCarton: price,
      montant: montant
    };
  });

  const totalAmount = processedItems.reduce((sum, it) => sum + it.montant, 0);
  const discountVal = Number(discount || 0);
  const netPayable = Math.max(0, totalAmount - discountVal);

  const newNote = {
    id: `bl-${Date.now()}`,
    noteNumber: generatedNoteNumber,
    clientName,
    clientCode: clientCode || "CL-GEN",
    date: date || new Date().toISOString().split('T')[0],
    congNumber: congNumber || "AP-01",
    congType: (congType || "AP") as "AP" | "AG" | "AS",
    sourceStockLocation,
    items: processedItems,
    totalAmount,
    discount: discountVal,
    netPayable,
    createdAt: new Date().toISOString()
  };

  state.deliveryNotes.unshift(newNote);

  addAuditLog(
    state,
    "Nouveau Bon de Livraison",
    `Bon de livraison ${newNote.noteNumber} créé pour ${newNote.clientName} (Total: ${newNote.netPayable.toFixed(2)} DH) - Stock débité: ${sourceStockLocation}`,
    user
  );

  saveState(state);
  res.json({ success: true, note: newNote, state });
});

// Create Demande d'Approvisionnement (Supply Request)
app.post("/api/supply-requests", (req, res) => {
  const { date, requestNumber, agency, chefSecteur, magasinier, vendeur, items, totalGlobalDhs, user } = req.body;
  const state = loadState();

  if (!state.supplyRequests) {
    state.supplyRequests = [];
  }

  const generatedRequestNumber = requestNumber || `SR-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`;

  const newRequest = {
    id: `sr-${Date.now()}`,
    requestNumber: generatedRequestNumber,
    date: date || new Date().toISOString().split('T')[0],
    agency: agency || '',
    chefSecteur: chefSecteur || '',
    magasinier: magasinier || '',
    vendeur: vendeur || '',
    items: items || [],
    totalGlobalDhs: Number(totalGlobalDhs || 0),
    createdAt: new Date().toISOString()
  };

  state.supplyRequests.unshift(newRequest);

  // --- Add stock update for Dépôts Régionaux ---
  if (newRequest.agency && state.depots && state.depots[newRequest.agency]) {
    const depot = state.depots[newRequest.agency];
    if (!depot.stock) depot.stock = [];
    
    newRequest.items.forEach((item: any) => {
      const newQty = Number(item.qtyDelivered || 0);
      if (newQty > 0) {
        let stockItem = depot.stock.find(
          (s: any) => s.productId === item.ref || s.productName.toLowerCase() === item.articleName.toLowerCase()
        );
        if (stockItem) {
          stockItem.quantity = (stockItem.quantity || 0) + newQty;
        } else {
          depot.stock.push({
            productId: item.ref,
            productName: item.articleName,
            quantity: newQty
          });
        }
      }
    });
  }

  addAuditLog(
    state,
    "Nouvelle Demande d'Approvisionnement",
    `Demande d'approvisionnement N° ${newRequest.requestNumber} créée pour l'agence ${newRequest.agency} par ${newRequest.vendeur}`,
    user
  );

  saveState(state);
  res.json({ success: true, request: newRequest, state });
});

// Create Bon de Retour d'Avoir (Credit Note)
app.post("/api/bon-avoirs", (req, res) => {
  const { date, number, clientCodeLeft, clientCodeRight, congType, congNumber, items, montantAvoirDirhams, user } = req.body;
  const state = loadState();

  if (!state.bonAvoirs) {
    state.bonAvoirs = [];
  }

  const generatedNumber = number || `AV-${String(Math.floor(100000 + Math.random() * 900000))}`;

  const newAvoir = {
    id: `av-${Date.now()}`,
    number: generatedNumber,
    date: date || new Date().toISOString().split('T')[0],
    clientCodeLeft: clientCodeLeft || '',
    clientCodeRight: clientCodeRight || '',
    congType: congType || '',
    congNumber: congNumber || '',
    items: items || [],
    montantAvoirDirhams: Number(montantAvoirDirhams || 0),
    createdAt: new Date().toISOString()
  };

  state.bonAvoirs.unshift(newAvoir);

  addAuditLog(
    state,
    "Nouveau Bon d'Avoir",
    `Bon d'avoir N° ${newAvoir.number} créé pour client ${newAvoir.clientCodeRight || newAvoir.clientCodeLeft} (Total: ${newAvoir.montantAvoirDirhams.toFixed(2)} DH)`,
    user
  );

  saveState(state);
  res.json({ success: true, bonAvoir: newAvoir, state });
});

// Create Bon d'Encaissement (Cash Receipt)
app.post("/api/bon-encaissements", (req, res) => {
  const { number, vendeur, date, items, totalRecu, observation, visaCaissier, visaVendeur, user } = req.body;
  const state = loadState();

  if (!state.bonEncaissements) {
    state.bonEncaissements = [];
  }

  const generatedNumber = number || `EC-${String(Math.floor(100000 + Math.random() * 900000))}`;

  const newEncaissement = {
    id: `ec-${Date.now()}`,
    number: generatedNumber,
    vendeur: vendeur || '',
    date: date || new Date().toISOString().split('T')[0],
    items: items || [],
    totalRecu: Number(totalRecu || 0),
    observation: observation || '',
    visaCaissier: !!visaCaissier,
    visaVendeur: !!visaVendeur,
    createdAt: new Date().toISOString()
  };

  state.bonEncaissements.unshift(newEncaissement);

  addAuditLog(
    state,
    "Nouveau Bon d'Encaissement",
    `Bon d'encaissement N° ${newEncaissement.number} créé (Total: ${newEncaissement.totalRecu.toFixed(2)} DH)`,
    user
  );

  saveState(state);
  res.json({ success: true, bonEncaissement: newEncaissement, state });
});

// Create Bon de Change
app.post("/api/bon-changes", (req, res) => {
  const { number, date, clientCodeLeft, clientCodeRight, congType, congNumber, items, montantChangeDirhams, user } = req.body;
  const state = loadState();

  if (!state.bonChanges) {
    state.bonChanges = [];
  }

  const generatedNumber = number || `CH-${String(Math.floor(100000 + Math.random() * 900000))}`;

  const newChange = {
    id: `ch-${Date.now()}`,
    number: generatedNumber,
    date: date || new Date().toISOString().split('T')[0],
    clientCodeLeft: clientCodeLeft || '',
    clientCodeRight: clientCodeRight || '',
    congType: congType || '',
    congNumber: congNumber || '',
    items: items || [],
    montantChangeDirhams: Number(montantChangeDirhams || 0),
    createdAt: new Date().toISOString()
  };

  state.bonChanges.unshift(newChange);

  addAuditLog(
    state,
    "Nouveau Bon de Change",
    `Bon de Change N° ${newChange.number} créé (Total: ${newChange.montantChangeDirhams.toFixed(2)} DH)`,
    user
  );

  saveState(state);
  res.json({ success: true, bonChange: newChange, state });
});

// Update Delivery Note (BL) and adjust stock accordingly
app.put("/api/delivery-notes/:id", (req, res) => {
  const { id } = req.params;
  const { clientName, clientCode, date, congNumber, congType, sourceStockLocation, items, discount, user } = req.body;
  const state = loadState();

  if (!state.deliveryNotes) {
    state.deliveryNotes = [];
  }

  const noteIndex = state.deliveryNotes.findIndex(n => n.id === id);
  if (noteIndex === -1) {
    return res.status(404).json({ error: "Bon de livraison non trouvé" });
  }

  const oldNote = state.deliveryNotes[noteIndex];

  // 1. REVERT old stock deductions
  if (oldNote.items && Array.isArray(oldNote.items)) {
    for (const item of oldNote.items) {
      const qty = Number(item.quantity);
      const cleanLocation = oldNote.sourceStockLocation.trim();
      const isRegionalDepot = cleanLocation !== "Magasin Usine" && 
                              cleanLocation !== "Magasin MICZ" && 
                              cleanLocation !== "Magasin Zone Logistique" &&
                              !cleanLocation.startsWith("Magasin");

      let matchedProduct = state.products.find(p => p.name.toLowerCase() === item.productName.toLowerCase());

      if (matchedProduct) {
        if (isRegionalDepot) {
          const depotName = cleanLocation.replace("Dépôt ", "").trim();
          const depot = state.depots[depotName] || Object.values(state.depots).find(d => d.name === depotName || d.name === cleanLocation);
          if (depot) {
            const depotStock = depot.stock.find(s => s.productId === matchedProduct!.id);
            if (depotStock) {
              depotStock.quantity += qty; // Add back
            }
          }
        } else {
          const sp = state.stockPositions.find(s => s.productId === matchedProduct!.id && s.location === cleanLocation);
          if (sp) {
            sp.quantity += qty; // Add back
          }
        }
      }
    }
  }

  // 2. APPLY new stock deductions
  const validItems = (items || []).filter((it: any) => Number(it.quantity) > 0);
  const processedItems = validItems.map((item: any) => {
    const qty = Number(item.quantity);
    const price = Number(item.pricePerCarton || 0);
    const montant = qty * price;

    let matchedProduct = state.products.find(p => p.name.toLowerCase() === item.productName.toLowerCase());
    if (!matchedProduct) {
      const newId = `prod-bl-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      matchedProduct = {
        id: newId,
        name: item.productName,
        category: "GAMME CLASSIQUE",
        barcode: `6111${Math.floor(100000000 + Math.random() * 900000000)}`,
        image: "#475569",
        createdAt: new Date().toISOString().split('T')[0],
        expiryDays: 365,
        unitPriceCost: price * 0.5 / 10,
        unitPriceSell: price / 10,
        tempRequired: -18
      };
      state.products.push(matchedProduct);
    }

    const cleanLocation = sourceStockLocation.trim();
    const isRegionalDepot = cleanLocation !== "Magasin Usine" && 
                            cleanLocation !== "Magasin MICZ" && 
                            cleanLocation !== "Magasin Zone Logistique" &&
                            !cleanLocation.startsWith("Magasin");

    if (isRegionalDepot) {
      const depotName = cleanLocation.replace("Dépôt ", "").trim();
      const depot = state.depots[depotName] || Object.values(state.depots).find(d => d.name === depotName || d.name === cleanLocation);
      if (depot) {
        let depotStock = depot.stock.find(s => s.productId === matchedProduct!.id);
        if (depotStock) {
          depotStock.quantity = Math.max(0, depotStock.quantity - qty);
        } else {
          depotStock = {
            productId: matchedProduct!.id,
            productName: matchedProduct!.name,
            quantity: 0
          };
          depot.stock.push(depotStock);
        }
      }
    } else {
      let sp = state.stockPositions.find(s => s.productId === matchedProduct!.id && s.location === cleanLocation);
      if (sp) {
        sp.quantity = Math.max(0, sp.quantity - qty);
      } else {
        sp = {
          id: `sp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          productId: matchedProduct!.id,
          productName: matchedProduct!.name,
          location: cleanLocation,
          quantity: 0
        };
        state.stockPositions.push(sp);
      }
    }

    return {
      productName: item.productName,
      pcsPerCarton: Number(item.pcsPerCarton || 1),
      quantity: qty,
      pricePerCarton: price,
      montant: montant
    };
  });

  const totalAmount = processedItems.reduce((sum, it) => sum + it.montant, 0);
  const discountVal = Number(discount || 0);
  const netPayable = Math.max(0, totalAmount - discountVal);

  const updatedNote = {
    ...oldNote,
    clientName,
    clientCode: clientCode || oldNote.clientCode,
    date: date || oldNote.date,
    congNumber: congNumber || oldNote.congNumber,
    congType: (congType || oldNote.congType) as "AP" | "AG" | "AS",
    sourceStockLocation,
    items: processedItems,
    totalAmount,
    discount: discountVal,
    netPayable,
    updatedAt: new Date().toISOString()
  };

  state.deliveryNotes[noteIndex] = updatedNote;

  addAuditLog(
    state,
    "Modification Bon de Livraison",
    `Mise à jour du bon de livraison ${updatedNote.noteNumber} (Nouveau net: ${updatedNote.netPayable.toFixed(2)} DH) par ${user}`,
    user
  );

  saveState(state);
  res.json({ success: true, note: updatedNote, state });
});

// Update Demande d'Approvisionnement
app.put("/api/supply-requests/:id", (req, res) => {
  const { id } = req.params;
  const { date, requestNumber, agency, chefSecteur, magasinier, vendeur, items, totalGlobalDhs, user } = req.body;
  const state = loadState();

  if (!state.supplyRequests) {
    state.supplyRequests = [];
  }

  const index = state.supplyRequests.findIndex(r => r.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Demande non trouvée" });
  }

  const oldRequest = state.supplyRequests[index];
  const oldAgency = oldRequest ? oldRequest.agency : '';

  const updatedRequest = {
    ...state.supplyRequests[index],
    requestNumber: requestNumber || state.supplyRequests[index].requestNumber,
    date: date || state.supplyRequests[index].date,
    agency: agency || '',
    chefSecteur: chefSecteur || '',
    magasinier: magasinier || '',
    vendeur: vendeur || '',
    items: items || [],
    totalGlobalDhs: Number(totalGlobalDhs || 0),
    updatedAt: new Date().toISOString()
  };

  state.supplyRequests[index] = updatedRequest;

  // --- Update stock for Dépôts Régionaux ---
  // Revert all old quantities from the old depot
  if (oldAgency && state.depots && state.depots[oldAgency]) {
    const oldDepot = state.depots[oldAgency];
    if (!oldDepot.stock) oldDepot.stock = [];

    (oldRequest.items || []).forEach((item: any) => {
      const oldQty = Number(item.qtyDelivered || 0);
      if (oldQty > 0) {
        let stockItem = oldDepot.stock.find(
          (s: any) => s.productId === item.ref || s.productName.toLowerCase() === item.articleName.toLowerCase()
        );
        if (stockItem) {
          stockItem.quantity = Math.max(0, (stockItem.quantity || 0) - oldQty);
        }
      }
    });
  }

  // Add all new quantities to the new depot
  if (updatedRequest.agency && state.depots && state.depots[updatedRequest.agency]) {
    const newDepot = state.depots[updatedRequest.agency];
    if (!newDepot.stock) newDepot.stock = [];

    updatedRequest.items.forEach((item: any) => {
      const newQty = Number(item.qtyDelivered || 0);
      if (newQty > 0) {
        let stockItem = newDepot.stock.find(
          (s: any) => s.productId === item.ref || s.productName.toLowerCase() === item.articleName.toLowerCase()
        );
        if (stockItem) {
          stockItem.quantity = (stockItem.quantity || 0) + newQty;
        } else {
          newDepot.stock.push({
            productId: item.ref,
            productName: item.articleName,
            quantity: newQty
          });
        }
      }
    });
  }

  addAuditLog(
    state,
    "Modification Demande Approvisionnement",
    `Demande d'approvisionnement N° ${state.supplyRequests[index].requestNumber} mise à jour par ${user}`,
    user
  );

  saveState(state);
  res.json({ success: true, request: state.supplyRequests[index], state });
});

// Update Bon d'Avoir
app.put("/api/bon-avoirs/:id", (req, res) => {
  const { id } = req.params;
  const { date, number, clientCodeLeft, clientCodeRight, congType, congNumber, items, montantAvoirDirhams, user } = req.body;
  const state = loadState();

  if (!state.bonAvoirs) {
    state.bonAvoirs = [];
  }

  const index = state.bonAvoirs.findIndex(b => b.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Bon d'avoir non trouvé" });
  }

  state.bonAvoirs[index] = {
    ...state.bonAvoirs[index],
    number: number || state.bonAvoirs[index].number,
    date: date || state.bonAvoirs[index].date,
    clientCodeLeft: clientCodeLeft || '',
    clientCodeRight: clientCodeRight || '',
    congType: congType || '',
    congNumber: congNumber || '',
    items: items || [],
    montantAvoirDirhams: Number(montantAvoirDirhams || 0),
    updatedAt: new Date().toISOString()
  };

  addAuditLog(
    state,
    "Modification Bon d'Avoir",
    `Bon d'avoir N° ${state.bonAvoirs[index].number} mis à jour par ${user}`,
    user
  );

  saveState(state);
  res.json({ success: true, bonAvoir: state.bonAvoirs[index], state });
});

// Update Bon d'Encaissement
app.put("/api/bon-encaissements/:id", (req, res) => {
  const { id } = req.params;
  const { number, vendeur, date, items, totalRecu, observation, visaCaissier, visaVendeur, user } = req.body;
  const state = loadState();

  if (!state.bonEncaissements) {
    state.bonEncaissements = [];
  }

  const index = state.bonEncaissements.findIndex(e => e.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Bon d'encaissement non trouvé" });
  }

  state.bonEncaissements[index] = {
    ...state.bonEncaissements[index],
    number: number || state.bonEncaissements[index].number,
    vendeur: vendeur || '',
    date: date || state.bonEncaissements[index].date,
    items: items || [],
    totalRecu: Number(totalRecu || 0),
    observation: observation || '',
    visaCaissier: !!visaCaissier,
    visaVendeur: !!visaVendeur,
    updatedAt: new Date().toISOString()
  };

  addAuditLog(
    state,
    "Modification Bon d'Encaissement",
    `Bon d'encaissement N° ${state.bonEncaissements[index].number} mis à jour par ${user}`,
    user
  );

  saveState(state);
  res.json({ success: true, bonEncaissement: state.bonEncaissements[index], state });
});

// Update Bon de Change
app.put("/api/bon-changes/:id", (req, res) => {
  const { id } = req.params;
  const { number, date, clientCodeLeft, clientCodeRight, congType, congNumber, items, montantChangeDirhams, user } = req.body;
  const state = loadState();

  if (!state.bonChanges) {
    state.bonChanges = [];
  }

  const index = state.bonChanges.findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: "Bon de change non trouvé" });
  }

  state.bonChanges[index] = {
    ...state.bonChanges[index],
    number: number || state.bonChanges[index].number,
    date: date || state.bonChanges[index].date,
    clientCodeLeft: clientCodeLeft || '',
    clientCodeRight: clientCodeRight || '',
    congType: congType || '',
    congNumber: congNumber || '',
    items: items || [],
    montantChangeDirhams: Number(montantChangeDirhams || 0),
    updatedAt: new Date().toISOString()
  };

  addAuditLog(
    state,
    "Modification Bon de Change",
    `Bon de change N° ${state.bonChanges[index].number} mis à jour par ${user}`,
    user
  );

  saveState(state);
  res.json({ success: true, bonChange: state.bonChanges[index], state });
});

// Post Audit log entry
app.post("/api/audit-logs", (req, res) => {
  const { action, details, user } = req.body;
  const state = loadState();
  const newLog = addAuditLog(state, action, details, user);
  saveState(state);
  res.json({ success: true, log: newLog, state });
});

async function startServer() {
  createAutoBackup();

  // Vite dev server mounting or Production static files serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = fs.existsSync(path.join(__dirname, "index.html"))
      ? __dirname
      : path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    console.log(`[Storage] Database path: ${DB_PATH}`);
    if (process.send) {
      process.send({ status: "ready", port: PORT });
    }
  });
}

startServer();

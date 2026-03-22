import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp"; // Make sure 'sharp' is installed

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    // 🛠️ FIX: Correctly reading FormData instead of JSON
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
        return NextResponse.json({ error: "File required" }, { status: 400 });
    }

    // Convert the uploaded File to a Node.js Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Create an optimized unique filename
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    
    // Define the save path (public/uploads)
    const publicDir = path.join(process.cwd(), "public", "uploads");
    const savePath = path.join(publicDir, filename);

    // 1. Image Optimization Logic using Sharp
    const optimizedBuffer = await sharp(buffer)
      .resize({
        width: 1200,   // Max width 1200px
        height: 1200,  // Max height 1200px
        fit: 'inside', // Maintain aspect ratio
        withoutEnlargement: true // Don't enlarge if image is already small
      })
      .webp({ quality: 80 }) // Compress and convert to WebP
      .toBuffer();

    // 2. Ensure directory exists and Save optimized file
    try {
        await mkdir(publicDir, { recursive: true });
    } catch (err) { 
        // Directory already exists, ignore error
    }

    await writeFile(savePath, optimizedBuffer);

    // 3. Return Optimized URL
    return NextResponse.json({ 
        success: true, 
        message: "Image uploaded and optimized successfully",
        url: `/uploads/${filename}` // This URL will be saved in the database
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Upload Failed. Check server logs." }, { status: 500 });
  }
}
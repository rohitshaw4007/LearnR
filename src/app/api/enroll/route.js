import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";

// FIX 1: Server ko force karein ki data hamesha naya laye (No Caching)
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await connectDB();
    
    // Next.js 15: Cookies async hain
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || "secret123");
    
    // Sirf 'approved' courses fetch karein
    const enrollments = await Enrollment.find({ 
      user: decoded.id, 
      status: "approved" 
    })
    .populate("course")
    .lean();

    // FIX 2: Explicit No-Cache Headers return karein
    return NextResponse.json(
      { enrollments }, 
      { 
        status: 200,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      }
    );

  } catch (error) {
    console.error("Error fetching user enrollments:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
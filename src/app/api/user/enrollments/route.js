import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course"; 

// FIX: Cache ko puri tarah disable karne ki settings (Server Side)
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req) {
  try {
    await connectDB();
    
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || "secret123");
    
    // Step 1: Fetch Enrollments (Approved + Pending Dono allow karein)
    const allEnrollments = await Enrollment.find({ 
      user: decoded.id, 
      status: { $in: ["approved", "pending"] } // <-- Dono status allow karein
    })
    .populate("course")
    .lean();

    // Step 2: DUPLICATE REMOVER LOGIC (Safe Mode)
    const uniqueEnrollments = [];
    const seenCourseIds = new Set();

    for (const enrollment of allEnrollments) {
      // Agar course delete ho gaya hai ya null hai to skip karein
      if (!enrollment.course) continue;

      const courseId = enrollment.course._id.toString(); // ID ko string me convert karna zaroori hai

      // Sirf naye course IDs ko add karein
      if (!seenCourseIds.has(courseId)) {
        uniqueEnrollments.push(enrollment);
        seenCourseIds.add(courseId);
      }
    }

    // Step 3: Response with No-Cache Headers (Client Side ke liye)
    const response = NextResponse.json({ enrollments: uniqueEnrollments }, { status: 200 });
    
    // Browser ko strictly bole ki data store na kare (PC Cache Fix)
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    return response;

  } catch (error) {
    console.error("Error fetching user enrollments:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
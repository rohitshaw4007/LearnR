import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Course from "@/models/Course";
import User from "@/models/User";
import { getDataFromToken } from "@/lib/getDataFromToken";
import { revalidatePath } from "next/cache"; // [1] YE LINE ADD KARO

// ... (isAdmin function same rahega) ...
async function isAdmin(req) {
    // ... code same ...
    try {
        const userId = getDataFromToken(req);
        if (!userId) return false;
        const user = await User.findById(userId);
        if (user && user.role === "admin") {
            return true;
        }
        return false;
    } catch (e) {
        return false;
    }
}

export async function POST(req) {
  try {
    await connectDB();
    
    const isUserAdmin = await isAdmin(req);
    if (!isUserAdmin) {
        return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { title, description, price, duration, level, category, gradient } = body;

    if (!title || !price || !category) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const newCourse = await Course.create({
      title,
      description,
      price,
      duration,
      level,
      category,
      gradient,
      rating: 4.5,
      students: 0
    });

    // [2] YE DO LINES ADD KARO - Cache Clear karne ke liye
    revalidatePath('/courses'); // Courses page refresh hoga
    revalidatePath('/');        // Homepage refresh hoga

    return NextResponse.json({ message: "Course Created Successfully", course: newCourse }, { status: 201 });
  } catch (error) {
    console.error("Course Create Error:", error);
    return NextResponse.json({ error: "Server Error: " + error.message }, { status: 500 });
  }
}

export async function GET() {
    // ... code same ...
    try {
        await connectDB();
        const courses = await Course.find({}).sort({ createdAt: -1 });
        return NextResponse.json(courses);
    } catch (error) {
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}
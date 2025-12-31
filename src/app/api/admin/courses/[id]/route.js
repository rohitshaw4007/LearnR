import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment"; // Enrollment model import kiya

export const dynamic = 'force-dynamic';

// GET: Fetch Single Course with Real-time Student Count
export async function GET(req, { params }) {
    try {
        await connectDB();
        const { id } = await params;
        
        let course = await Course.findById(id).lean();
        if (!course) {
            return NextResponse.json({ error: "Course not found" }, { status: 404 });
        }

        // 1. Asli Enrollment Count pata karein
        const realStudentCount = await Enrollment.countDocuments({ course: id });

        // 2. Agar database ka count galat hai, to usse fix karein
        if (course.students !== realStudentCount) {
             await Course.findByIdAndUpdate(id, { students: realStudentCount });
             course.students = realStudentCount; // Response me bhi update karein
        }

        return NextResponse.json(course);
    } catch (error) {
        console.error("Fetch Course Error:", error);
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}

// PUT: Update Course
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; 
    const body = await req.json();

    const updatedCourse = await Course.findByIdAndUpdate(id, body, { new: true });

    if (!updatedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Course Updated", course: updatedCourse });
  } catch (error) {
    console.error("Update Error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE: Delete Course & Cleanup
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    // 1. Delete the Course
    const deletedCourse = await Course.findByIdAndDelete(id);

    if (!deletedCourse) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // 2. Cleanup: Remove this course ID from all Users
    await User.updateMany(
      { courses: id },
      { $pull: { courses: id } }
    );
    
    // 3. Cleanup: Delete all Enrollments for this course
    await Enrollment.deleteMany({ course: id });

    return NextResponse.json({ message: "Course Deleted & Data Cleaned" });
  } catch (error) {
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
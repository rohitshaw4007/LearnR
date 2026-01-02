import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Course from "@/models/Course";
import User from "@/models/User";
import Enrollment from "@/models/Enrollment"; 

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

        // FIX: Sirf 'approved' status wale students count karein
        const realStudentCount = await Enrollment.countDocuments({ 
            course: id, 
            status: "approved" 
        });

        // Agar count mismatch hai to update karein
        if (course.students !== realStudentCount) {
             await Course.findByIdAndUpdate(id, { students: realStudentCount });
             course.students = realStudentCount; 
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

    if (!updatedCourse) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ message: "Course Updated", course: updatedCourse });
  } catch (error) {
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE: Delete Course & Cleanup
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const deletedCourse = await Course.findByIdAndDelete(id);
    if (!deletedCourse) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Cleanup
    await User.updateMany({ courses: id }, { $pull: { courses: id } });
    await Enrollment.deleteMany({ course: id });

    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
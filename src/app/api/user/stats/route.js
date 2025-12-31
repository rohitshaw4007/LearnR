import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import Course from "@/models/Course";
import User from "@/models/User";
import Notice from "@/models/Notice";
import { getDataFromToken } from "@/lib/getDataFromToken";

export async function GET(req) {
  try {
    await connectDB();
    const userId = getDataFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. User Info Fetch
    const user = await User.findById(userId).select("name email");

    // 2. Enrolled Courses (Approved only)
    const enrollments = await Enrollment.find({ user: userId, status: "approved" })
      .populate({
        path: "course",
        select: "title category gradient liveRoom students", // Only fetch needed fields
      })
      .sort({ updatedAt: -1 }); // Recently accessed first

    // 3. Calculate Stats
    const totalCourses = enrollments.length;
    
    // Check Live Classes
    let liveClassesCount = 0;
    let liveCourseId = null;
    
    enrollments.forEach((e) => {
      if (e.course?.liveRoom?.isLive) {
        liveClassesCount++;
        liveCourseId = e.course._id; // Link to first live course
      }
    });

    // 4. Recent Notices (Last 3 days)
    // Find notices linked to user's enrolled courses
    const courseIds = enrollments.map(e => e.course._id);
    const recentNotices = await Notice.countDocuments({
        course: { $in: courseIds },
        createdAt: { $gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) } // 3 days old
    });

    return NextResponse.json({
      userName: user?.name || "Student",
      totalCourses,
      liveClassesCount,
      liveCourseId,
      recentNotices,
      courses: enrollments.map(e => e.course) // Send course list for display
    });

  } catch (error) {
    console.error("User Stats Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
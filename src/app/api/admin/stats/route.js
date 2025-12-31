import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";

export async function GET() {
  try {
    await connectDB();

    // 1. Total Students (Jinka role 'student' hai)
    const totalStudents = await User.countDocuments({ role: "student" });

    // 2. Total Courses
    const totalCourses = await Course.countDocuments({});

    // 3. Total Revenue (Approved enrollments ka total amount)
    // Hum aggregate function use karenge fast calculation ke liye
    const revenueStats = await Enrollment.aggregate([
      { $match: { status: "approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } }
    ]);
    const totalRevenue = revenueStats.length > 0 ? revenueStats[0].total : 0;

    // 4. Pending Requests Count
    const pendingRequests = await Enrollment.countDocuments({ status: "pending" });

    // 5. Active Subscriptions (Jinka account blocked nahi hai)
    const activeEnrollments = await Enrollment.countDocuments({ status: "approved", isBlocked: false });

    return NextResponse.json({
      totalStudents,
      totalCourses,
      totalRevenue,
      pendingRequests,
      activeEnrollments
    });

  } catch (error) {
    console.error("Stats Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
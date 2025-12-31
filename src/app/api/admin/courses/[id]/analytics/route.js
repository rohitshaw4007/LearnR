import { NextResponse } from "next/server";
import connectDB from "@/lib/db"; 
import mongoose from "mongoose";
import Enrollment from "@/models/Enrollment";
import Test from "@/models/Test";
import Result from "@/models/Result";
import Lecture from "@/models/Lecture";
import User from "@/models/User";

export async function GET(req, { params }) {
  try {
    console.log("🔥 [DEBUG] API Started: /api/admin/courses/[id]/analytics");
    
    // 1. DB Connection Check
    await connectDB();
    console.log("✅ [DEBUG] Database Connected Successfully");

    // --- FIX FOR NEXT.JS 15 ---
    // params ab Promise hai, isliye pehle await karna padega
    const { id } = await params; 
    console.log("🆔 [DEBUG] Course ID received from params:", id);

    // 2. ID Validation
    if (!mongoose.Types.ObjectId.isValid(id)) {
        console.error("❌ [DEBUG] Invalid Course ID Format");
        return NextResponse.json({ error: "Invalid Course ID" }, { status: 400 });
    }

    const courseId = new mongoose.Types.ObjectId(id);
    console.log("🔄 [DEBUG] Converted to mongoose ObjectId:", courseId);

    // --- CHECK 1: Enrollment Data ---
    const rawEnrollmentCount = await Enrollment.countDocuments({ course: courseId });
    console.log("🧐 [DEBUG] Raw Total Enrollments in DB for this Course:", rawEnrollmentCount);

    if (rawEnrollmentCount === 0) {
        console.warn("⚠️ [DEBUG] WARNING: No enrollments found for this course ID. Revenue will be 0.");
    }

    // --- CHECK 2: Revenue Calculation ---
    console.log("💰 [DEBUG] Calculating Revenue (Status: 'approved')...");
    const revenueStats = await Enrollment.aggregate([
      { $match: { course: courseId, status: "approved" } },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: "$amount" },
          totalStudents: { $sum: 1 }
        } 
      }
    ]);
    console.log("📊 [DEBUG] Revenue Aggregation Result:", JSON.stringify(revenueStats, null, 2));

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const totalStudents = revenueStats[0]?.totalStudents || 0;

    // --- CHECK 3: Content Counts ---
    const lectureCount = await Lecture.countDocuments({ courseId: courseId });
    console.log("📚 [DEBUG] Lecture Count:", lectureCount);
    
    const testCount = await Test.countDocuments({ courseId: courseId });
    console.log("📝 [DEBUG] Test Count:", testCount);

    // --- CHECK 4: Test Performance ---
    console.log("📈 [DEBUG] Calculating Test Performance...");
    const performanceStats = await Result.aggregate([
      { $match: { courseId: courseId } },
      { 
        $group: { 
          _id: null, 
          avgScore: { $avg: "$score" }, 
          totalAttempts: { $sum: 1 } 
        } 
      }
    ]);
    console.log("🎯 [DEBUG] Performance Stats:", JSON.stringify(performanceStats, null, 2));

    // --- CHECK 5: Graph Data ---
    console.log("📉 [DEBUG] Generating Graph Data...");
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const graphStats = await Enrollment.aggregate([
      { 
        $match: { 
          course: courseId, 
          status: "approved",
          createdAt: { $gte: sixMonthsAgo }
        } 
      },
      {
        $group: {
          _id: { 
            month: { $month: "$createdAt" }, 
            year: { $year: "$createdAt" } 
          },
          revenue: { $sum: "$amount" },
          students: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    console.log("📊 [DEBUG] Graph Raw Data:", JSON.stringify(graphStats, null, 2));

    const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const graphData = graphStats.map(item => ({
      name: `${monthNames[item._id.month]}`,
      revenue: item.revenue,
      students: item.students
    }));

    // Final Payload
    const payload = {
        revenue: totalRevenue,
        students: totalStudents,
        lectures: lectureCount,
        tests: testCount,
        avgResult: performanceStats[0]?.avgScore || 0,
        totalAttempts: performanceStats[0]?.totalAttempts || 0,
        graphData: graphData.length ? graphData : [],
        recentStudents: [] 
    };

    console.log("✅ [DEBUG] Final Payload Sending to Frontend:", JSON.stringify(payload, null, 2));

    return NextResponse.json({
      success: true,
      data: payload
    });

  } catch (error) {
    console.error("❌ [DEBUG] CRITICAL ERROR IN API:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
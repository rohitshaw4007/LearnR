import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getDataFromToken } from "@/lib/getDataFromToken";
import mongoose from "mongoose";
import Course from "@/models/Course";
import Result from "@/models/Result";
import Test from "@/models/Test";
import Notice from "@/models/Notice";
import User from "@/models/User";

export async function GET(req, { params }) {
  try {
    console.log("\n🔥 [DEBUG START] Student Analytics API Hit");
    await connectDB();
    
    // 1. Params & User Check
    const { id } = await params;
    const userIdString = await getDataFromToken(req); // Token se ID string me milti hai
    
    console.log(`🆔 Request for Course ID: ${id}`);
    console.log(`👤 Logged-in User ID: ${userIdString}`);

    if (!userIdString) {
        console.log("❌ User ID missing in token");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Convert to ObjectId explicitly to prevent mismatch
    const courseId = new mongoose.Types.ObjectId(id);
    const userId = new mongoose.Types.ObjectId(userIdString);

    // 2. DEBUGGING: Check if ANY data exists for this course
    const totalResultsInCourse = await Result.countDocuments({ courseId: courseId });
    console.log(`📊 [DB CHECK] Total Results in this Course (For ALL students): ${totalResultsInCourse}`);

    if (totalResultsInCourse > 0) {
        // Check results for THIS user
        const userResultsCount = await Result.countDocuments({ courseId: courseId, studentId: userId });
        console.log(`👤 [DB CHECK] Results found for CURRENT USER: ${userResultsCount}`);
        
        if (userResultsCount === 0) {
             console.warn("⚠️ WARNING: Data exists in course, but NOT for this logged-in user.");
             console.warn("👉 Suggestion: Login with the student account that took the test, or inject dummy result for this user.");
        }
    } else {
        console.warn("⚠️ WARNING: No Results found in DB for this Course ID at all.");
    }

    // 3. Fetch Basic Info
    const user = await User.findById(userId).select("name");
    const course = await Course.findById(courseId).select("title liveRoom");

    if (!user) console.error("❌ User not found in DB");
    if (!course) console.error("❌ Course not found in DB");

    // 4. Calculate Performance (Fixed Query)
    const results = await Result.find({ 
        studentId: userId, 
        courseId: courseId 
    })
    .populate("testId", "title totalMarks")
    .sort({ createdAt: 1 });

    console.log(`✅ Fetched ${results.length} result documents for graph.`);

    let totalObtained = 0;
    let totalMax = 0;
    
    const performanceGraph = results.map((r, index) => {
        // Marks handling: kabhi kabhi r.score undefined ho sakta hai
        const marks = r.score !== undefined ? r.score : 0;
        const maxMarks = r.totalMarks || r.testId?.totalMarks || 100;
        
        totalObtained += marks;
        totalMax += maxMarks;
        
        return {
            name: `Test ${index + 1}`,
            testName: r.testId?.title || "Test",
            score: marks,
            total: maxMarks,
            percentage: maxMarks > 0 ? (marks / maxMarks) * 100 : 0
        };
    });

    const avgPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

    // 5. Upcoming Tests (Relaxed Query)
    // Sirf 'scheduled' nahi, balki jo future me hain unhe dikhao, status chahe jo ho (debugging ke liye)
    const upcomingTests = await Test.find({ 
      courseId: courseId, 
      scheduledAt: { $gte: new Date() } 
    }).sort({ scheduledAt: 1 }).limit(3);

    // 6. Notices
    const recentNotices = await Notice.find({ course: courseId })
      .sort({ createdAt: -1 })
      .limit(3);

    console.log("🚀 Sending Response to Frontend...\n");

    return NextResponse.json({
      success: true,
      data: {
        studentName: user?.name || "Student",
        courseTitle: course?.title || "Course",
        liveStatus: course?.liveRoom || { isLive: false },
        stats: {
          testsTaken: results.length,
          avgPercentage: avgPercentage,
          pendingTests: upcomingTests.length
        },
        graphData: performanceGraph,
        upcomingTests,
        recentNotices
      }
    });

  } catch (error) {
    console.error("❌ [CRITICAL ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
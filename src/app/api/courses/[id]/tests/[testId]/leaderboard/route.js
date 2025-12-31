import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";
import Result from "@/models/Result";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import { getDataFromToken } from "@/lib/getDataFromToken";

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id, testId } = await params; // id = courseId, testId = examId

    // 1. Verify User
    const userId = await getDataFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2. Fetch Test Data (With Questions for Download)
    const test = await Test.findById(testId);
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    // Security: Only allow Question access if Exam is ENDED
    const isEnded = test.status === 'completed' || new Date() > new Date(new Date(test.scheduledAt).getTime() + (12 * 60 * 60 * 1000));
    
    if (!isEnded) {
        return NextResponse.json({ error: "Leaderboard not available yet." }, { status: 403 });
    }

    // 3. Fetch All Enrollments (To find Absentees)
    const enrollments = await Enrollment.find({ course: id, status: "approved" })
                                        .populate("user", "name email");

    // 4. Fetch All Results (To find Rankers)
    const results = await Result.find({ testId }).sort({ score: -1, timeTaken: 1 });

    // 5. Merge Data (Leaderboard Logic)
    // Create a map of results for quick lookup
    const resultMap = {};
    results.forEach((r, index) => {
        resultMap[r.studentId.toString()] = {
            ...r._doc,
            rank: index + 1
        };
    });

    const leaderboard = enrollments.map(enrollment => {
        const studentId = enrollment.user._id.toString();
        const result = resultMap[studentId];

        if (result) {
            return {
                studentId: enrollment.user._id,
                name: enrollment.user.name,
                status: "Present",
                rank: result.rank,
                score: result.score,
                timeTaken: result.timeTaken,
                isCurrentUser: studentId === userId
            };
        } else {
            return {
                studentId: enrollment.user._id,
                name: enrollment.user.name,
                status: "Absent",
                rank: "-",
                score: 0,
                timeTaken: 0,
                isCurrentUser: studentId === userId
            };
        }
    });

    // Sort: Present (Rankwise) -> Absent
    leaderboard.sort((a, b) => {
        if (a.status === "Present" && b.status === "Absent") return -1;
        if (a.status === "Absent" && b.status === "Present") return 1;
        if (a.status === "Present" && b.status === "Present") return a.rank - b.rank;
        return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ 
        success: true, 
        test: {
            title: test.title,
            totalMarks: test.totalMarks,
            questions: test.questions // Sending questions for generating PDF
        },
        leaderboard 
    });

  } catch (error) {
    console.error("🔥 Leaderboard Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";
import Result from "@/models/Result";
import Enrollment from "@/models/Enrollment";
// User model import is not strictly needed if models are registered, but good for safety
import User from "@/models/User"; 

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  console.log("\n📊 [ANALYTICS API] Request received...");
  
  try {
    await connectDB();
    const { id } = await params;
    
    const test = await Test.findById(id);
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    // 1. Fetch Results
    // 🛠️ FIX: Changed 'fullName' to 'name' (User model has 'name')
    const results = await Result.find({ testId: id })
        .populate("studentId", "name email");

    // 2. Fetch Enrollments
    // 🛠️ FIX: Changed 'fullName' to 'name'
    const enrollments = await Enrollment.find({ course: test.courseId })
        .populate("user", "name email"); 

    // --- PROCESS DATA ---
    const studentsData = [];
    const attemptMap = new Map();

    // A. Process Results (Present Students)
    results.forEach((res) => {
        if (!res.studentId) return;

        const sId = res.studentId._id.toString();
        attemptMap.set(sId, true);

        // 🛠️ FIX: Accessing 'name' instead of 'fullName'
        const safeName = res.studentId.name || "Unknown User";

        studentsData.push({
            id: sId,
            name: safeName, 
            email: res.studentId.email || "No Email",
            score: res.score,
            totalMarks: res.totalMarks,
            status: 'Present',
            timeTaken: res.timeTaken || 0,
            submittedAt: res.createdAt,
            answers: res.answers || []
        });
    });

    // B. Process Enrollments (Absent Students)
    enrollments.forEach((enr) => {
        // Enrollment model usually has 'user'
        const student = enr.user;

        if (!student) return;

        if (!attemptMap.has(student._id.toString())) {
            // 🛠️ FIX: Accessing 'name' instead of 'fullName'
            const safeName = student.name || "Unknown User";
            
            studentsData.push({
                id: student._id.toString(),
                name: safeName,
                email: student.email || "No Email",
                score: 0,
                totalMarks: test.totalMarks,
                status: 'Absent',
                answers: []
            });
        }
    });

    // Sort by Score (Rank)
    studentsData.sort((a, b) => b.score - a.score);
    studentsData.forEach((s, index) => s.rank = index + 1);

    const topStudents = studentsData.filter(s => s.status === 'Present').slice(0, 5);

    // Question Analysis
    const questionStats = test.questions.map((q, idx) => ({
        qIndex: idx + 1,
        questionText: q.questionText,
        wrongCount: 0,
        correctCount: 0,
        unattemptedCount: 0
    }));

    results.forEach(res => {
        if(res.answers && Array.isArray(res.answers)){
            res.answers.forEach((ans, qIdx) => {
                if (qIdx < questionStats.length) {
                    const correctOpt = test.questions[qIdx].correctOption;
                    if (ans === null || ans === undefined || ans === -1) {
                        questionStats[qIdx].unattemptedCount++;
                    } else if (ans !== correctOpt) {
                        questionStats[qIdx].wrongCount++;
                    } else {
                        questionStats[qIdx].correctCount++;
                    }
                }
            });
        }
    });

    const hardQuestions = [...questionStats].sort((a, b) => b.wrongCount - a.wrongCount).slice(0, 5);

    return NextResponse.json({
        testTitle: test.title,
        totalMarks: test.totalMarks,
        questions: test.questions,
        analytics: {
            topStudents,
            hardQuestions,
            studentsData,
            stats: {
                totalStudents: studentsData.length,
                present: results.length,
                absent: studentsData.length - results.length
            }
        }
    });

  } catch (error) {
    console.error("🔥 Analytics API Error:", error);
    return NextResponse.json({ error: "Analytics Failed: " + error.message }, { status: 500 });
  }
}
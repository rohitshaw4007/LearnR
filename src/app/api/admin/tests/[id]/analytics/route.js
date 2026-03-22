import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";
import Result from "@/models/Result";
import Enrollment from "@/models/Enrollment";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    // 🛠️ FIX: Added 'courseId' here. Iske bina enrollments fetch nahi ho rahe the!
    const test = await Test.findById(id).select('title totalMarks duration validityHours questions courseId');
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    const results = await Result.find({ testId: id }).populate('studentId', 'name email');
    
    // Ab test.courseId proper value dega, aur enrolled students fetch ho jayenge
    const enrollments = await Enrollment.find({ course: test.courseId, status: "approved" }).populate('user', 'name email');

    let studentsData = [];
    let totalScore = 0;
    let presentCount = 0;

    enrollments.forEach(enrollment => {
        const student = enrollment.user;
        if (!student) return;

        const result = results.find(r => r.studentId?._id.toString() === student._id.toString());

        if (result) {
            totalScore += result.score;
            presentCount++;
        }

        studentsData.push({
            studentId: student._id,
            name: student.name,
            email: student.email,
            status: result ? 'Present' : 'Absent',
            score: result ? result.score : 0,
            submittedAt: result ? result.createdAt : null,
            timeTaken: result ? result.timeTaken : 0, 
            answers: result ? result.answers : []      
        });
    });

    // Score ke hisaab se sort karenge taaki toppers upar aayein
    studentsData.sort((a, b) => b.score - a.score);

    // Top students me sirf unko lenge jo Present hain
    const topStudents = studentsData.filter(s => s.status === 'Present').slice(0, 5);
    const averageScore = presentCount > 0 ? (totalScore / presentCount).toFixed(2) : 0;

    return NextResponse.json({
        success: true,
        analytics: {
            testDetails: test,
            totalStudents: studentsData.length,
            presentCount,
            absentCount: studentsData.length - presentCount,
            averageScore,
            studentsData,
            topStudents
        }
    });

  } catch (error) {
    console.error("Analytics API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
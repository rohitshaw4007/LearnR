import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";
import Result from "@/models/Result";
import { getDataFromToken } from "@/lib/getDataFromToken";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params; // id here is testId
    const userId = await getDataFromToken(req);

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await Result.findOne({ testId: id, studentId: userId });
    if (!result) return NextResponse.json({ error: "Result not found" }, { status: 404 });

    const test = await Test.findById(id);
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    // 🛠️ FIX: Ab har question ke sath image aur student ka answer (selectedOption) jayega
    const mappedQuestions = test.questions.map((q, index) => {
      return {
        questionText: q.questionText,
        imageUrl: q.imageUrl || null, // Image Fix
        options: q.options,
        correctOption: q.correctOption,
        selectedOption: result.answers[index] !== undefined ? result.answers[index] : -1, // Skipped Fix
        description: q.description || null,
        marks: q.marks || 1
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        testTitle: test.title,
        studentId: userId,
        totalMarks: test.totalMarks,
        obtainedMarks: result.score,
        correctCount: result.correctCount, // Fix for 0 correct
        wrongCount: result.wrongCount,     // Fix for 0 wrong
        submittedAt: result.createdAt,
        questions: mappedQuestions
      }
    });
  } catch (error) {
    console.error("Result API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
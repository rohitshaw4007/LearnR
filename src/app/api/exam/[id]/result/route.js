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
    const { id } = await params; 
    const userId = await getDataFromToken(req);

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const result = await Result.findOne({ testId: id, studentId: userId });
    if (!result) return NextResponse.json({ error: "Result not found" }, { status: 404 });
    
    // FIX: Agar test abhi in-progress hai toh answer leak mat hone do
    if (result.status === 'in-progress') {
        return NextResponse.json({ error: "Exam is not submitted yet." }, { status: 400 });
    }

    const test = await Test.findById(id);
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    const startTime = new Date(test.scheduledAt).getTime();
    const validityHours = Number(test.validityHours) || 24; 
    const endTime = startTime + (validityHours * 60 * 60 * 1000);
    const currentTime = Date.now();

    const isExamActive = (currentTime < endTime) && (test.status !== 'completed');

    if (isExamActive) {
        return NextResponse.json({
            success: true,
            data: {
                testTitle: test.title,
                studentId: userId,
                isExamActive: true,
                availableAt: new Date(endTime).toISOString(), 
            }
        });
    }

    const mappedQuestions = test.questions.map((q, index) => {
      return {
        questionText: q.questionText,
        imageUrl: q.imageUrl || null, 
        options: q.options,
        correctOption: q.correctOption,
        selectedOption: result.answers[index] !== undefined ? result.answers[index] : -1, 
        description: q.description || null,
        marks: q.marks || 1
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        testTitle: test.title,
        studentId: userId,
        isExamActive: false, 
        totalMarks: test.totalMarks,
        obtainedMarks: result.score,
        correctCount: result.correctCount, 
        wrongCount: result.wrongCount,     
        submittedAt: result.createdAt,
        timeTaken: result.timeTaken, // Yahan frontend ko actual time pass hoga ab
        questions: mappedQuestions
      }
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
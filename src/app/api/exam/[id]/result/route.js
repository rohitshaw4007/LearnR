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

    // --- LEAKAGE PROTECTION LOGIC (BUG FIXED) ---
    // Check if exam is still active based on Time AND Status
    const startTime = new Date(test.scheduledAt).getTime();
    const validityHours = Number(test.validityHours) || 24; // Added Number() for safety
    const endTime = startTime + (validityHours * 60 * 60 * 1000);
    const currentTime = Date.now();

    // Exam active tabhi manenge jab time bacha ho AUR test ka status 'completed' na ho
    const isExamActive = (currentTime < endTime) && (test.status !== 'completed');

    // Agar exam abhi bhi chal raha hai, toh sirf status bhejo, answers nahi
    if (isExamActive) {
        return NextResponse.json({
            success: true,
            data: {
                testTitle: test.title,
                studentId: userId,
                isExamActive: true,
                availableAt: new Date(endTime).toISOString(), // Time when result will be visible
            }
        });
    }

    // --- FULL RESULT GENERATION (Exam Ended) ---
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
        isExamActive: false, // Ab false jayega aur paper dikhega
        totalMarks: test.totalMarks,
        obtainedMarks: result.score,
        correctCount: result.correctCount, 
        wrongCount: result.wrongCount,     
        submittedAt: result.createdAt,
        questions: mappedQuestions
      }
    });
  } catch (error) {
    console.error("Result API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
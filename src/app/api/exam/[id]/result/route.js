import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";
import Result from "@/models/Result";
import { getDataFromToken } from "@/lib/getDataFromToken";

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    console.log("🟢 [API HIT] /api/exam/[id]/result");

    await connectDB();
    
    // 1. Safe Params Handling
    const resolvedParams = await params; 
    const testId = resolvedParams.id;

    if (!testId) {
        return NextResponse.json({ success: false, message: "Test ID is required" }, { status: 400 });
    }

    // 2. Auth Check
    const userId = await getDataFromToken(req);
    if (!userId) {
        return NextResponse.json({ success: false, message: "Unauthorized access" }, { status: 401 });
    }

    // 3. Find Result
    const result = await Result.findOne({ testId: testId, studentId: userId });
    
    if (!result) {
      return NextResponse.json({ 
          success: false, 
          message: "Result not found. It seems you haven't attempted this test yet." 
      });
    }

    // 4. Find Test Details
    const test = await Test.findById(testId);
    if (!test) {
        return NextResponse.json({ success: false, message: "Test Definition not found" });
    }

    // 5. Result Reveal Logic (FIXED)
    // अगर आप चाहते हैं कि यूजर सबमिट करते ही रिजल्ट देख ले, तो इसे true रखें।
    // या आप 12 घंटे वाली शर्त हटा दें।
    const isResultDeclared = true; 
    
    // पुराना लॉजिक जिसे हटाया गया (अगर आपको वापस delay चाहिए तो इसे uncomment करें):
    // const startTime = new Date(test.scheduledAt);
    // const resultRevealTime = new Date(startTime.getTime() + 12 * 60 * 60 * 1000); 
    // const now = new Date();
    // const isResultDeclared = now >= resultRevealTime;

    // 6. Process Questions
    const processedQuestions = test.questions.map((q, index) => {
      // Answers array index match logic
      const answerIndex = result.answers[index];
      
      // Handle -1 or null as "Skipped" (null)
      const selectedOption = (answerIndex !== undefined && answerIndex !== null && answerIndex !== -1) 
          ? answerIndex 
          : null;

      return {
        _id: q._id,
        questionText: q.questionText,
        options: q.options,
        marks: q.marks,
        selectedOption: selectedOption, 
        // अब correctOption हमेशा भेजा जाएगा ताकि "Wrong" न दिखे
        correctOption: isResultDeclared ? q.correctOption : null, 
        description: isResultDeclared ? q.description : null,
      };
    });

    console.log("✅ [API] Data prepared successfully.");

    return NextResponse.json({
      success: true,
      data: {
        testTitle: test.title,
        // ✅ FIX: Model में field का नाम 'score' है, 'obtainedMarks' नहीं।
        obtainedMarks: result.score, 
        totalMarks: result.totalMarks,
        isResultDeclared, 
        revealTime: new Date(), // Immediate reveal
        questions: processedQuestions
      }
    });

  } catch (error) {
    console.error("🔥 [API CRASH]:", error);
    return NextResponse.json({ success: false, message: error.message || "Internal Server Error" }, { status: 500 });
  }
}
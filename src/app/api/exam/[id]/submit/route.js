import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";
import Result from "@/models/Result";
import User from "@/models/User"; 
import { getDataFromToken } from "@/lib/getDataFromToken";
import nodemailer from "nodemailer"; 

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { answers, timeTaken } = await req.json(); 

    const userId = await getDataFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existingResult = await Result.findOne({ testId: id, studentId: userId });
    if (existingResult) {
        return NextResponse.json({ error: "Exam already submitted" }, { status: 400 });
    }

    const test = await Test.findById(id);
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    // --- NEW: Time Validation Logic with Validity Hours ---
    const startTime = new Date(test.scheduledAt).getTime();
    
    // FIX: Hardcoded 12 hours removed. Using validityHours from DB.
    const validityHours = test.validityHours || 24; 
    const validityMs = validityHours * 60 * 60 * 1000;
    
    const endTime = startTime + validityMs; 
    const currentTime = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 mins grace period (Internet slow hone ke case me)

    // ================= [ DEBUG LOGS ] =================
    console.log(`\n--- [SUBMIT EXAM DEBUG] ---`);
    console.log(`Test ID: ${test._id}`);
    console.log(`Validity Set: ${validityHours} Hours`);
    console.log(`Window Expiry Time: ${new Date(endTime).toLocaleString()}`);
    console.log(`Submission Attempt Time: ${new Date(currentTime).toLocaleString()}`);
    console.log(`-------------------------------\n`);
    // ==================================================

    if (currentTime > (endTime + bufferTime)) {
        console.log(`[SUBMIT EXAM DEBUG] ❌ Rejected! Time Over.`);
        return NextResponse.json({ 
            error: "The validity window for this exam is over. Submission not accepted." 
        }, { status: 400 });
    }
    // ----------------------------------------------------

    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;

    test.questions.forEach((q, index) => {
        const userAns = answers[index];
        const correctAns = q.correctOption;
        const questionMarks = parseFloat(q.marks) || 1; 

        if (userAns !== undefined && userAns !== null && parseInt(userAns) !== -1) {
            const userAnsInt = parseInt(userAns);
            const correctAnsInt = parseInt(correctAns);

            if (!isNaN(correctAnsInt)) {
                if (userAnsInt === correctAnsInt) {
                    score += questionMarks; 
                    correctCount++;
                } else {
                    score -= 0.25; 
                    wrongCount++;
                }
            }
        }
    });

    if (score < 0) score = 0;

    const newResult = await Result.create({
        testId: id,
        studentId: userId,
        courseId: test.courseId,
        score,
        totalMarks: test.totalMarks,
        answers, 
        correctCount,
        wrongCount,
        timeTaken: timeTaken || 0,
    });

    try {
        const user = await User.findById(userId);
        if (user && user.email) {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });

            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: user.email,
                subject: `Exam Submitted: ${test.title}`,
                html: `
                  <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #22c55e;">Exam Submitted Successfully!</h2>
                    <p>Hi <strong>${user.name}</strong>,</p>
                    <p>You have successfully submitted the exam: <strong>${test.title}</strong>.</p>
                    <p>Your Score: <strong>${score} / ${test.totalMarks}</strong></p>
                    <p>View your detailed result on the dashboard.</p>
                    <hr style="border:0; border-top:1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #888;">LearnR Examination System</p>
                  </div>
                `,
            });
        }
    } catch (mailError) {}

    console.log(`[SUBMIT EXAM DEBUG] ✅ Success! Result Saved.`);
    return NextResponse.json({ 
        success: true, 
        message: "Exam submitted successfully",
        resultId: newResult._id,
        score 
    });

  } catch (error) {
    console.error(`[SUBMIT EXAM ERROR]`, error);
    return NextResponse.json({ error: "Submission Failed" }, { status: 500 });
  }
}
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";
import Result from "@/models/Result";
import User from "@/models/User"; 
import { getDataFromToken } from "@/lib/getDataFromToken";
import nodemailer from "nodemailer"; 

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { answers } = await req.json(); // Frontend timeTaken ignore kar diya

    const userId = await getDataFromToken(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const test = await Test.findById(id);
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    // Fetch the in-progress session
    const existingResult = await Result.findOne({ testId: id, studentId: userId });
    
    if (!existingResult) {
        return NextResponse.json({ error: "Exam session not found. Please start the exam properly." }, { status: 400 });
    }
    if (existingResult.status === 'completed' || existingResult.status === 'auto-submitted') {
        return NextResponse.json({ error: "Exam already submitted." }, { status: 400 });
    }

    // --- TIME VALIDATION (Server Side Tracking) ---
    const currentTime = Date.now();
    const bufferTimeMs = 5 * 60 * 1000; // 5 min grace period slow internet ke liye

    // 1. Check Validity Window Expiry
    const startTime = new Date(test.scheduledAt).getTime();
    const validityMs = (test.validityHours || 24) * 60 * 60 * 1000;
    const endTimeWindow = startTime + validityMs; 
    
    if (currentTime > (endTimeWindow + bufferTimeMs)) {
        return NextResponse.json({ 
            error: "The validity window for this exam is over. Submission not accepted." 
        }, { status: 400 });
    }

    // 2. Strict Duration Check (Duration Hacker Block)
    const startedAtTime = existingResult.startedAt.getTime();
    const maxDurationMs = test.duration * 60 * 1000;
    const exactTimeTakenSec = Math.floor((currentTime - startedAtTime) / 1000); // Server calculated time
    
    if (currentTime > (startedAtTime + maxDurationMs + bufferTimeMs)) {
        return NextResponse.json({ error: "Exam time limit exceeded. Submission rejected." }, { status: 400 });
    }

    // ==========================================
    // SCORE CALCULATION 
    // ==========================================
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
                    wrongCount++;
                }
            }
        }
    });

    if (score < 0) score = 0;

    // 3. Update result record database me save kardo
    existingResult.answers = answers;
    existingResult.score = score;
    existingResult.correctCount = correctCount;
    existingResult.wrongCount = wrongCount;
    existingResult.timeTaken = exactTimeTakenSec; // Server side exact time!
    existingResult.status = 'completed';
    
    await existingResult.save();

    // 4. SEND SUCCESS MAIL
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
                  </div>
                `,
            });
        }
    } catch (mailError) {}

    return NextResponse.json({ 
        success: true, 
        message: "Exam submitted successfully",
        resultId: existingResult._id,
        score 
    });

  } catch (error) {
    return NextResponse.json({ error: "Submission Failed" }, { status: 500 });
  }
}
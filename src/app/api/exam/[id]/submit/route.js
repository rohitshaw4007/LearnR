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

    // FIX 1: Double Submission Check - Agar pehle submit kiya hai toh dobara save na kare
    const existingResult = await Result.findOne({ testId: id, studentId: userId });
    if (existingResult) {
        return NextResponse.json({ error: "Exam already submitted" }, { status: 400 });
    }

    // 1. Fetch Original Test
    const test = await Test.findById(id);
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    // --- Time Validation Logic ---
    const startTime = new Date(test.scheduledAt).getTime();
    const endTime = startTime + (12 * 60 * 60 * 1000); 
    const currentTime = Date.now();
    const bufferTime = 5 * 60 * 1000; 

    if (currentTime > (endTime + bufferTime)) {
        return NextResponse.json({ 
            error: "Exam time is over! Submission not accepted." 
        }, { status: 400 });
    }

    // 2. Calculate Score (STRICT LOGIC FIX)
    let score = 0;
    let correctCount = 0;
    let wrongCount = 0;

    test.questions.forEach((q, index) => {
        const userAns = answers[index];
        const correctAns = q.correctOption;
        const questionMarks = parseFloat(q.marks) || 1; // Strict Number parsing

        if (userAns !== undefined && userAns !== null && parseInt(userAns) !== -1) {
            const userAnsInt = parseInt(userAns);
            const correctAnsInt = parseInt(correctAns);

            if (!isNaN(correctAnsInt)) {
                if (userAnsInt === correctAnsInt) {
                    score += questionMarks; 
                    correctCount++;
                } else {
                    score -= 0.25; // Negative marking
                    wrongCount++;
                }
            }
        }
    });

    if (score < 0) score = 0;

    // 3. Save Result
    const newResult = await Result.create({
        testId: id,
        studentId: userId,
        courseId: test.courseId, // Included courseId for fix-results safety
        score,
        totalMarks: test.totalMarks,
        answers, 
        correctCount,
        wrongCount,
        timeTaken: timeTaken || 0,
    });

    // --- 4. SEND SUCCESS MAIL ---
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
    } catch (mailError) {
        // Fail silently so exam submission isn't affected
    }

    return NextResponse.json({ 
        success: true, 
        message: "Exam submitted successfully",
        resultId: newResult._id,
        score 
    });

  } catch (error) {
    return NextResponse.json({ error: "Submission Failed" }, { status: 500 });
  }
}
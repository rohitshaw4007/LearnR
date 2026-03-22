import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";
import Result from "@/models/Result";
import User from "@/models/User"; 
import { getDataFromToken } from "@/lib/getDataFromToken";
import nodemailer from "nodemailer"; 

// 🚨 STRICT NO-CACHE DIRECTIVES 🚨
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

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

    // --- TIME VALIDATION (ValidityHours se) ---
    const startTime = new Date(test.scheduledAt).getTime();
    const validityHours = test.validityHours || 24; 
    const validityMs = validityHours * 60 * 60 * 1000;
    
    const endTime = startTime + validityMs; 
    const currentTime = Date.now();
    const bufferTime = 5 * 60 * 1000; 

    console.log(`[SUBMIT EXAM] Validity: ${validityHours} hrs, Expiry: ${new Date(endTime).toLocaleString()}`);

    if (currentTime > (endTime + bufferTime)) {
        return NextResponse.json({ 
            error: "The validity window for this exam is over. Submission not accepted." 
        }, { status: 400 });
    }

    // Calculate Score
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

    // Send Email
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
                html: `<p>Your Score: <strong>${score} / ${test.totalMarks}</strong></p>`,
            });
        }
    } catch (mailError) {}

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
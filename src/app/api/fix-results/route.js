import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Result from "@/models/Result";
import Course from "@/models/Course";
import User from "@/models/User";
import Test from "@/models/Test";
import { getDataFromToken } from "@/lib/getDataFromToken";

export async function GET(req) {
  try {
    await connectDB();

    // 1. Get Logged in User
    const userId = await getDataFromToken(req);
    if (!userId) return NextResponse.json({ msg: "Please login first!" });

    // 2. FIX: Find a Test FIRST (Instead of random Course)
    // Aisa Test dhundo jo exist karta ho, taaki hum uska Course ID le sakein
    const test = await Test.findOne({});
    
    if (!test) {
        return NextResponse.json({ msg: "No Tests found in DB. Please create a Test in Admin Panel first." });
    }

    // Ab us Test ka Course nikalo
    const course = await Course.findById(test.courseId);
    
    if (!course) {
        return NextResponse.json({ msg: "Test found but linked Course is missing." });
    }

    // 3. FIX ORPHAN RESULTS
    // Agar koi purana Result bina Course ID ke hai, toh usse is Course se link kar do
    const updateResult = await Result.updateMany(
        { courseId: { $exists: false } }, 
        { $set: { courseId: course._id } }
    );

    let message = `Found Course: "${course.title}". Linked ${updateResult.modifiedCount} orphan results.`;

    // 4. CREATE FRESH RESULT (Agar abhi bhi 0 hai)
    // Check karein ki is specific Course aur Student ke liye result hai ya nahi
    const existingResult = await Result.findOne({ 
        courseId: course._id, 
        studentId: userId 
    });
    
    if (!existingResult) {
        await Result.create({
            studentId: userId,
            testId: test._id,
            courseId: course._id,
            score: 85,
            totalMarks: 100,
            correctCount: 17,
            wrongCount: 3,
            status: "completed",
            answers: [1, 2, 0, 3],
            createdAt: new Date()
        });
        message += " ✅ Success! Created 1 FRESH Dummy Result for you.";
    } else {
        message += " ✅ You already have a result in this course.";
    }

    return NextResponse.json({ 
        success: true, 
        message: message,
        course: course.title,
        test: test.title,
        yourResult: "Generated/Checked"
    });

  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
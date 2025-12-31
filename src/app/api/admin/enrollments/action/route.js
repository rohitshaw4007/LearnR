import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import Course from "@/models/Course";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { userId, courseId } = body;

    // 1. Validation: Check if IDs are present
    if (!userId || !courseId) {
      return NextResponse.json(
        { message: "User ID and Course ID are required" },
        { status: 400 }
      );
    }

    // 2. Check for Duplicate Enrollment (To prevent double entry)
    // FIX: Field is 'user' in schema, not 'student'
    const existingEnrollment = await Enrollment.findOne({
      user: userId,
      course: courseId,
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { message: "User is already enrolled in this course" },
        { status: 400 }
      );
    }

    // 3. Create New Enrollment Record
    const now = new Date();
    
    // Logic: First due date should be 1 month from now (Since admin added manually)
    const nextDue = new Date(now);
    nextDue.setMonth(nextDue.getMonth() + 1);

    const newEnrollment = await Enrollment.create({
      user: userId, // FIXED: Matches Schema
      course: courseId,
      enrolledAt: now,
      status: "approved", // Matches Enum
      
      amount: 0, // Required by Schema
      transactionId: "MANUAL_ADMIN_ENTRY", // Required
      
      subscriptionStart: now,
      nextPaymentDue: nextDue, // ADDED: Critical for fee logic
      isBlocked: false,

      paymentHistory: [{
          transactionId: "MANUAL_ADMIN_ENTRY",
          amount: 0,
          date: now,
          month: "Joining (Manual)",
          status: "success",
          method: "Manual Enrollment"
      }]
    });

    // 4. Update User Model
    await User.findByIdAndUpdate(userId, {
      $addToSet: { courses: courseId },
    });

    // 5. Update Course Model
    await Course.findByIdAndUpdate(courseId, {
      $addToSet: { students: userId },
    });

    return NextResponse.json(
      {
        message: "Enrollment successful",
        enrollment: newEnrollment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Manual Enrollment Error:", error);
    return NextResponse.json(
      { message: "Failed to enroll user due to server error" },
      { status: 500 }
    );
  }
}
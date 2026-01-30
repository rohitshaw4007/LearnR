import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Course from "@/models/Course";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import { addMonths } from "date-fns"; 

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;

    const enrollments = await Enrollment.find({ course: id, status: "approved" })
      .populate("user", "name email phone createdAt")
      .sort({ createdAt: -1 });

    const students = enrollments.map(enrollment => ({
      ...enrollment.user._doc,
      enrolledAt: enrollment.enrolledAt || enrollment.createdAt, 
      enrollmentId: enrollment._id
    }));

    return NextResponse.json(students);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id: courseId } = await params;
    const { email, joinDate, initialPaidAmount } = await req.json();

    if (!email) return NextResponse.json({ error: "Email is required" }, { status: 400 });

    const user = await User.findOne({ email });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const existing = await Enrollment.findOne({ user: user._id, course: courseId });
    if (existing) return NextResponse.json({ error: "Already enrolled" }, { status: 400 });

    const course = await Course.findById(courseId);
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    // --- DATE LOGIC ---
    const now = new Date();
    const startDate = joinDate ? new Date(joinDate) : now;

    // --- NEXT PAYMENT DUE LOGIC (FIXED: ALWAYS 1st OF MONTH) ---
    let nextDue = new Date(startDate);
    nextDue.setDate(1); // Force date to 1st
    
    // अगर ज्वाइनिंग डेट पुरानी है, तो उसे 'आज' के हिसाब से आगे बढ़ाओ
    // लेकिन तारीख हमेशा 1 ही रहेगी
    if (!isNaN(startDate.getTime())) {
        // पहले महीने की 1 तारीख से शुरू करो
        // लूप तब तक चलाओ जब तक Due Date भविष्य में न आ जाए
        while (nextDue <= now) {
            nextDue = addMonths(nextDue, 1);
            nextDue.setDate(1); // Ensure it stays on 1st
        }
    } else {
        // Fallback: अगले महीने की 1 तारीख
        nextDue = new Date(now);
        nextDue.setDate(1);
        nextDue = addMonths(nextDue, 1);
    }

    // --- AMOUNT LOGIC ---
    let finalAmount = 0;
    if (initialPaidAmount !== undefined) {
        finalAmount = Number(initialPaidAmount);
    } else {
        const monthsDiff = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
        const multiplier = monthsDiff >= 0 ? monthsDiff + 1 : 1;
        finalAmount = course.price * multiplier;
    }

    // Create Enrollment
    const enrollment = await Enrollment.create({
      user: user._id,
      course: courseId,
      
      enrolledAt: startDate,        
      subscriptionStart: startDate, 
      lastPaymentDate: startDate,   
      
      status: "approved", 
      amount: course.price, 
      transactionId: "MANUAL_ADMIN_ENTRY",
      
      nextPaymentDue: nextDue, // ✅ Fixed to 1st of Month
      isBlocked: false,
      
      paymentHistory: [{
        transactionId: "MANUAL_ADMIN_ENTRY",
        amount: finalAmount, 
        date: startDate,
        month: "Joining (Manual/Offline) - Accumulated",
        status: "success",
        method: "Manual Enrollment"
      }]
    });

    // Force Update Dates
    await Enrollment.findByIdAndUpdate(
        enrollment._id,
        { 
            $set: { 
                createdAt: startDate, 
                updatedAt: startDate 
            } 
        },
        { timestamps: false }
    );

    await Course.findByIdAndUpdate(courseId, { $inc: { students: 1 } });
    await User.findByIdAndUpdate(user._id, { $addToSet: { courses: courseId } });

    return NextResponse.json({ message: "Enrolled successfully", student: user });

  } catch (error) {
    console.error("Enrollment Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id: courseId } = await params;
    const { studentId } = await req.json();

    await Enrollment.findOneAndDelete({ user: studentId, course: courseId });
    await User.findByIdAndUpdate(studentId, { $pull: { courses: courseId } });
    await Course.findByIdAndUpdate(courseId, { $inc: { students: -1 } });

    return NextResponse.json({ message: "Removed successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to remove" }, { status: 500 });
  }
}
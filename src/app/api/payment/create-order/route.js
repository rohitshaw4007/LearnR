import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import connectDB from "@/lib/db";
import Course from "@/models/Course";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

// Initialize Razorpay with error checking
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error("RAZORPAY KEYS MISSING IN ENV");
}

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(req) {
  try {
    await connectDB();

    // 1. Auth Check
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET missing");
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET);
    
    const { courseId, months = 1 } = await req.json();

    if (!courseId) {
        return NextResponse.json({ error: "Course ID is required" }, { status: 400 });
    }

    // 2. Fetch Real Price
    const course = await Course.findById(courseId);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // 3. Calculate Amount
    const monthsToPay = Math.max(1, Number(months));
    const payableAmount = course.price * monthsToPay;

    // 4. Create Order
    const options = {
      amount: Math.round(payableAmount * 100), // To Paise
      currency: "INR",
      receipt: `receipt_${Date.now()}_${decoded.id.slice(-4)}`,
      notes: {
        userId: decoded.id,
        courseId: courseId,
        monthsPaid: monthsToPay, 
        type: "course_subscription"
      }
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({ order }, { status: 200 });

  } catch (error) {
    console.error("Payment Order Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
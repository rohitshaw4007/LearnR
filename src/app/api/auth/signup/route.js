import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import Otp from "@/models/Otp";
import bcrypt from "bcryptjs";

export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { name, fatherName, phone, email, otp, school, classLevel, password } = body;

    // --- 1. Strong Input Validation ---
    if (!email || !email.includes("@")) {
        return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }
    if (!password || password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters long" }, { status: 400 });
    }
    if (!otp) {
        return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    // --- 2. OTP Verification ---
    const validOtp = await Otp.findOne({ email, otp: otp });
    if (!validOtp) {
      return NextResponse.json({ error: "Invalid or Expired OTP" }, { status: 400 });
    }

    // --- 3. Duplicate User Check ---
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: "User already exists with this email" }, { status: 400 });
    }

    // --- 4. Hash Password & Create User ---
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      fatherName,
      phone,
      email,
      school,
      classLevel,
      password: hashedPassword,
    });

    // 5. Cleanup OTP
    await Otp.deleteMany({ email });

    return NextResponse.json({ success: true, message: "Account Created Successfully!" });
  } catch (error) {
    console.error("Signup Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
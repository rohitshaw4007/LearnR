import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    // 1. Check User
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 2. Check Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid Credentials" }, { status: 401 });
    }

    // 3. Security: Check ENV
    if (!process.env.JWT_SECRET) {
        throw new Error("JWT_SECRET is missing in server environment");
    }

    // 4. Generate Token
    const token = jwt.sign(
        { id: user._id, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: "7d" }
    );

    const response = NextResponse.json({ success: true, message: "Login Successful", user });
    
    // 5. Set Secure Cookie
    response.cookies.set("token", token, { 
        httpOnly: true, 
        path: "/",
        maxAge: 7 * 24 * 60 * 60 // 7 Days
    });

    return response;
  } catch (error) {
    console.error("Login Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
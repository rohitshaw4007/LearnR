import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import connectDB from "@/lib/db";
import User from "@/models/User";

export async function GET() {
  try {
    // FIX: cookies() को await करें
    const cookieStore = await cookies();
    const token = cookieStore.get("token");

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Token Verify करें
    const decoded = jwt.verify(token.value, process.env.JWT_SECRET || "secret123");
    
    // DB से User लाएं (सिर्फ Name और Email)
    await connectDB();
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    // अगर token invalid है या कोई और error है
    console.error("Auth Error:", error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
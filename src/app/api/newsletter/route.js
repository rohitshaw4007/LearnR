import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }

    // Yahan aap future me Database (MongoDB) me save kar sakte hain
    // Filhal hum success return karenge
    
    return NextResponse.json({ message: "Subscribed successfully!" }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
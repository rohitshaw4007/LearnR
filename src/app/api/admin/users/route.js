import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// Force dynamic ensures we always fetch fresh data on the server
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Database Connection check
    await connectDB();
    console.log("DB Connected in API");

    // 2. Fetch Users
    const users = await User.find({})
      .select("name email role courses createdAt") 
      .sort({ createdAt: -1 })
      .lean(); 

    console.log(`Found ${users ? users.length : 0} users in DB`);

    if (!users) {
        return NextResponse.json([]);
    }

    return NextResponse.json(users);
  } catch (error) {
    console.error("Users API Error:", error);
    // Error return karein taki frontend ko pata chale ki issue hai, but empty array is safest for UI
    return NextResponse.json([]); 
  }
}
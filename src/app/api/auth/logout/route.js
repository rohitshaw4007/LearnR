import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  
  // Cookie delete karne ke liye expire date past ki set karte hain
  response.cookies.set("token", "", { httpOnly: true, expires: new Date(0) });
  
  return response;
}
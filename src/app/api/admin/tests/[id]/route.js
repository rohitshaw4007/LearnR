import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";

// GET: Fetch Test
export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    const test = await Test.findById(id);
    if (!test) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    return NextResponse.json(test);
  } catch (error) {
    return NextResponse.json({ error: "Failed to load test" }, { status: 500 });
  }
}

// PUT: Update Test Details (Title, Questions, etc.)
export async function PUT(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const updatedTest = await Test.findByIdAndUpdate(
        id, 
        { 
          title: body.title,
          description: body.description,
          duration: body.duration,
          totalMarks: body.totalMarks,
          questions: body.questions, 
          updatedAt: Date.now() 
        },
        { new: true }
    );

    return NextResponse.json(updatedTest);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to save changes" }, { status: 500 });
  }
}

// PATCH: Update Status (Live/Completed etc.) -- NEW ADDITION
export async function PATCH(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const { status } = await req.json();

    const updatedTest = await Test.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!updatedTest) return NextResponse.json({ error: "Test not found" }, { status: 404 });

    return NextResponse.json(updatedTest);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update status" }, { status: 500 });
  }
}

// DELETE: Remove Test
export async function DELETE(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    await Test.findByIdAndDelete(id);

    return NextResponse.json({ message: "Test deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete test" }, { status: 500 });
  }
}
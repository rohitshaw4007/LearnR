import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Material from "@/models/Material";

// DELETE: Material delete karne ke liye
export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params; // Next.js 15+ syntax fix
    
    const deletedMaterial = await Material.findByIdAndDelete(id);
    if (!deletedMaterial) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Material edit/update karne ke liye
export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const updatedMaterial = await Material.findByIdAndUpdate(
      id,
      {
        syllabusId: body.syllabusId,
        title: body.title,
        type: body.type,
        fileUrl: body.fileUrl,
      },
      { new: true }
    );

    if (!updatedMaterial) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMaterial);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
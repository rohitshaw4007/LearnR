import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Test from "@/models/Test";

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    
    const query = { courseId: id };
    if (type) query.type = type;

    let tests = await Test.find(query).sort({ scheduledAt: -1 });

    const now = new Date();
    let updatesMade = false;

    const updatedTestsPromise = tests.map(async (test) => {
        const startTime = new Date(test.scheduledAt);
        const validityHours = test.validityHours || 24;
        const validityMs = validityHours * 60 * 60 * 1000;
        const endTime = new Date(startTime.getTime() + validityMs);
        
        let needsSave = false;

        // 🛠️ BUG FIX: Admin UI me bhi isManualStart ka check zaroori hai
        if (test.status === 'scheduled' && now >= startTime && now < endTime) {
            if (!test.isManualStart) { 
                test.status = 'live';
                needsSave = true;
            }
        }

        if ((test.status === 'live' || test.status === 'scheduled') && now >= endTime) {
            test.status = 'completed';
            needsSave = true;
        }

        if (needsSave) {
            await test.save();
            updatesMade = true;
        }
        return test;
    });

    tests = await Promise.all(updatedTestsPromise);
    return NextResponse.json(tests);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    // 🛠️ BUG FIX: Frontend ISO string bhejna use karega seedha
    let finalScheduledAt;
    if (body.scheduledAt) {
        finalScheduledAt = new Date(body.scheduledAt);
    } else {
        // Fallback agar koi purana request aaye
        finalScheduledAt = new Date(`${body.scheduledDate}T${body.scheduledTime}`);
    }

    const newTest = await Test.create({
      ...body,
      courseId: id,
      scheduledAt: finalScheduledAt,
      questions: [],
      status: 'scheduled'
    });

    return NextResponse.json(newTest, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
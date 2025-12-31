import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import { getDataFromToken } from "@/lib/getDataFromToken"; 

// Debug Logger
const log = (msg) => console.log(`\x1b[35m[MY_FEES_API]\x1b[0m ${msg}`);

export const dynamic = "force-dynamic";

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const userId = await getDataFromToken(req);

    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const enrollment = await Enrollment.findOne({ course: id, user: userId })
      .populate("course", "title price")
      .populate("user", "name email")
      .lean();

    if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

    // --- STATUS & HISTORY LOGIC ---
    const now = new Date();
    
    // 1. Process History
    let history = enrollment.paymentHistory ? [...enrollment.paymentHistory] : [];
    history.sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalPaidTillNow = history.reduce((acc, curr) => acc + (curr.amount || 0), 0);
    const lastPayment = history.length > 0 ? history[0] : null;

    // 2. INJECT JOINING FEE (If missing)
    const joinDate = new Date(enrollment.subscriptionStart || enrollment.createdAt);
    const hasJoiningEntry = history.some(h => 
        (h.month && h.month.includes("Joining")) || 
        (h.transactionId && h.transactionId.startsWith("JOINING"))
    );

    if (!hasJoiningEntry) {
        // Fallback for old data
        history.push({
            transactionId: "JOINING-" + enrollment._id.toString().slice(-6).toUpperCase(),
            amount: enrollment.amount || enrollment.course.price || 0,
            date: joinDate,
            month: "Joining Fee",
            method: "Online / First Payment",
            status: "success"
        });
        history.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // 3. Determine Next Due Date & Status
    let nextDue = enrollment.nextPaymentDue;

    if (!nextDue) {
        // Fallback Logic Fix: Set to 1st of next month from joining
        const d = new Date(joinDate);
        d.setMonth(d.getMonth() + 1);
        d.setDate(1); // Force 1st of month
        nextDue = d;
        log(`NextDue missing, defaulting to: ${nextDue.toDateString()}`);
    } else {
        nextDue = new Date(nextDue);
    }

    // Status Check
    const isSubscriptionActive = nextDue > now;
    
    let status = "Pending";
    if (enrollment.isBlocked) status = "Blocked";
    else if (isSubscriptionActive) status = "Paid";
    else status = "Overdue";

    log(`User: ${enrollment.user.name} | Status: ${status} | Next Due: ${nextDue.toDateString()}`);

    return NextResponse.json({
        user: enrollment.user, 
        enrollmentId: enrollment._id,
        courseTitle: enrollment.course.title,
        monthlyFee: enrollment.course.price || 0,
        status,
        nextDue,
        totalPaid: totalPaidTillNow,
        history: history, 
        joinedAt: joinDate,
        lastPaymentMonth: lastPayment?.month || "N/A",
        unblockRequestStatus: enrollment.unblockRequest?.status || "none" 
    });

  } catch (error) {
    console.error("[MY_FEES_API_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
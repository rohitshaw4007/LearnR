import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User";
import Course from "@/models/Course";
import nodemailer from "nodemailer";
import { getDataFromToken } from "@/lib/getDataFromToken";

// --- DEBUG HELPER ---
const log = (msg, data = "") => console.log(`\x1b[36m[FEE_DEBUG]\x1b[0m ${msg}`, data);

const getTargetMonths = (startFromDate, monthsCount) => {
    if (!startFromDate) return "N/A";
    const startDate = new Date(startFromDate);
    const endDate = new Date(startDate.getTime());
    endDate.setMonth(endDate.getMonth() + monthsCount - 1);
    
    const startStr = startDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (monthsCount === 1) return startStr;
    const endStr = endDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    return `${startStr} to ${endStr}`;
};

export async function POST(req) {
  try {
    log("Starting Payment Verification...");
    await connectDB();
    
    // 1. Auth Check
    const userId = await getDataFromToken(req);
    log("User ID from Token:", userId);
    
    if (!userId) {
        log("Auth Failed: No User ID");
        return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      courseId, 
      amount 
    } = await req.json();

    log("Payload Received:", { razorpay_payment_id, courseId, amount });

    // 2. Signature Verification
    if (!process.env.RAZORPAY_KEY_SECRET) throw new Error("Razorpay Secret Missing");

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      log("Signature Mismatch!");
      return NextResponse.json({ error: "Invalid Signature" }, { status: 400 });
    }

    // 3. Fetch Data
    let enrollment = await Enrollment.findOne({ user: userId, course: courseId });
    const course = await Course.findById(courseId);
    const userDetails = await User.findById(userId);

    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });

    const monthlyFee = course.price > 0 ? course.price : 1; 
    const monthsPaid = Math.round(amount / monthlyFee) || 1; 
    
    log(`Months Paid: ${monthsPaid} (Amount: ${amount}, Fee: ${monthlyFee})`);

    let billingCycleName = "";
    
    // --- SCENARIO A: EXISTING USER (RENEWAL) ---
    if (enrollment) {
      log("Existing Enrollment Found. Processing Renewal...");
      
      // Calculate Base Date: strictly nextPaymentDue
      let baseDate = enrollment.nextPaymentDue ? new Date(enrollment.nextPaymentDue) : new Date();
      
      // Cycle Name
      billingCycleName = getTargetMonths(baseDate, monthsPaid);
      
      // New Due Date Logic: Add months to the existing due date
      const newDueDate = new Date(baseDate);
      newDueDate.setMonth(newDueDate.getMonth() + monthsPaid);
      
      log(`Renewal - Old Due: ${baseDate.toDateString()} -> New Due: ${newDueDate.toDateString()}`);

      enrollment.nextPaymentDue = newDueDate;
      enrollment.lastPaymentDate = new Date();
      enrollment.isBlocked = false; 
      enrollment.status = "approved";

      enrollment.paymentHistory.push({
        transactionId: razorpay_payment_id,
        amount: amount,
        date: new Date(),
        month: billingCycleName, 
        status: "success",
        method: "Online (Razorpay)"
      });

      await enrollment.save();
    
    } else {
      // --- SCENARIO B: NEW USER (JOINING) ---
      log("New Enrollment. Calculating Joining Logic...");

      const now = new Date();
      
      // LOGIC: Joining Month is covered. Next Fee starts from 1st of NEXT Month.
      // Example: Joined 15 Dec. Pays for Dec. Next Due = 1 Jan.
      
      // 1. Calculate Next Due Date (Always 1st of Next Month)
      // If user pays for 1 month (Joining), next due is Next Month 1st.
      // If user pays for 2 months (Joining + Advance), next due is Next + 1 Month 1st.
      
      let nextDue = new Date(now.getFullYear(), now.getMonth() + 1, 1); // Default: 1st of next month
      
      // Handle if they paid extra months during joining
      if (monthsPaid > 1) {
          nextDue.setMonth(nextDue.getMonth() + (monthsPaid - 1));
      }

      // Cycle Name
      const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
      billingCycleName = monthsPaid === 1 
          ? `Joining - ${currentMonthName}` 
          : `Joining (${currentMonthName}) + ${monthsPaid - 1} Month(s) Advance`;

      log(`Joining - Enrolled: ${now.toDateString()} -> Next Due: ${nextDue.toDateString()}`);

      await Enrollment.create({
        user: userId,
        course: courseId,
        amount: amount,
        status: "approved",
        transactionId: razorpay_payment_id,
        subscriptionStart: now,
        nextPaymentDue: nextDue, // Saves the 1st of next month
        isBlocked: false,
        paymentHistory: [{
            transactionId: razorpay_payment_id,
            amount: amount,
            date: now,
            month: billingCycleName, 
            status: "success"
        }]
      });
    }

    // --- Send Email ---
    try {
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        });

        if (userDetails?.email) {
            await transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: userDetails.email, 
                subject: "Payment Successful - LearnR",
                html: `
                    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
                        <h2 style="color: #2563eb;">Payment Confirmation</h2>
                        <p>Hello ${userDetails.name},</p>
                        <p>Payment of <strong>₹${amount}</strong> received.</p>
                        <p><strong>Cycle:</strong> ${billingCycleName}</p>
                        <p><strong>Next Due Date:</strong> ${enrollment ? enrollment.nextPaymentDue.toDateString() : "Check Dashboard"}</p>
                    </div>
                `
            });
        }
    } catch (e) { console.error("Mail Error", e); }

    log("Verification Complete. Success.");
    return NextResponse.json({ success: true, message: "Payment verified" });

  } catch (error) {
    console.error("[FEE_VERIFY_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
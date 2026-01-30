import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Enrollment from "@/models/Enrollment";
import User from "@/models/User"; 
import Course from "@/models/Course"; 
import nodemailer from "nodemailer"; 
import { addMonths } from "date-fns"; 

export const dynamic = "force-dynamic";

const getTargetMonths = (startFromDate, monthsCount) => {
    if (!startFromDate) return "N/A";
    const startDate = new Date(startFromDate);
    const endDate = addMonths(startDate, monthsCount - 1); 
    
    const startStr = startDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    if (monthsCount === 1) return startStr;
    const endStr = endDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    return `${startStr} to ${endStr}`;
};

export async function GET(req, { params }) {
  try {
    const { id } = await params; 
    await connectDB();
    
    const course = await Course.findById(id).select("price title");
    const courseFee = course?.price || 0; 

    const { searchParams } = new URL(req.url);
    const filterMonthStr = searchParams.get("month"); 

    let targetMonth, targetYear;
    if (filterMonthStr) {
        const [year, month] = filterMonthStr.split("-");
        targetYear = parseInt(year);
        targetMonth = parseInt(month) - 1; 
    } else {
        const now = new Date();
        targetYear = now.getFullYear();
        targetMonth = now.getMonth();
    }

    const enrollments = await Enrollment.find({ course: id })
      .populate("user", "name email phone")
      .lean();

    let totalRevenue = 0;
    let pendingCount = 0;
    let paidCount = 0;
    let blockedCount = 0;
    const graphDataMap = {}; 

    const studentList = enrollments.map((enroll) => {
      let history = enroll.paymentHistory ? [...enroll.paymentHistory] : [];
      let paidAmountInTargetMonth = 0;
      let hasPaidThisMonth = false;

      history.forEach((payment) => {
          const payDate = new Date(payment.date);
          const amount = payment.amount || 0;

          const monthKey = payDate.toLocaleString('default', { month: 'short', year: 'numeric' });
          if (!graphDataMap[monthKey]) graphDataMap[monthKey] = 0;
          graphDataMap[monthKey] += amount;

          if (payDate.getMonth() === targetMonth && payDate.getFullYear() === targetYear) {
              paidAmountInTargetMonth += amount;
              hasPaidThisMonth = true;
          }
      });

      const joinDate = new Date(enroll.subscriptionStart || enroll.createdAt);
      
      history.sort((a, b) => new Date(b.date) - new Date(a.date));

      let nextDue = enroll.nextPaymentDue;
      if (!nextDue) {
          const autoDate = new Date(joinDate);
          // ✅ FIX: Default Next Due is always 1st of next month
          autoDate.setDate(1); 
          nextDue = addMonths(autoDate, 1);
      }

      const now = new Date();
      const isSubscriptionActive = new Date(nextDue) > now;
      const isBlocked = enroll.isBlocked || false;

      if (hasPaidThisMonth) totalRevenue += paidAmountInTargetMonth;
      
      if (isBlocked) blockedCount++;
      else if (isSubscriptionActive) paidCount++;
      else pendingCount++;

      let status = "Pending";
      if (isBlocked) status = "Blocked";
      else if (isSubscriptionActive) status = "Paid";
      else status = "Overdue";

      return {
        _id: enroll._id,
        user: enroll.user || { name: "Unknown", email: "-" },
        status: status,
        nextDue: nextDue,
        joinedAt: joinDate,
        totalPaidMonth: paidAmountInTargetMonth,
        paymentHistory: history,
        unblockRequest: enroll.unblockRequest || { status: 'none' }
      };
    });

    const graphData = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const key = d.toLocaleString('default', { month: 'short', year: 'numeric' });
        graphData.push({
            name: key,
            revenue: graphDataMap[key] || 0
        });
    }

    return NextResponse.json({
      stats: { totalRevenue, pendingCount, paidCount, blockedCount },
      students: studentList,
      graphData,
      courseFee 
    });

  } catch (error) {
    console.error("[FEE_API_ERROR]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
    try {
        await connectDB();
        const { enrollmentId, amount, months, mode } = await req.json();
        const monthsToAdd = parseInt(months) || 1; 

        const enrollment = await Enrollment.findById(enrollmentId).populate("user").populate("course");
        if (!enrollment) return NextResponse.json({ error: "Enrollment not found" }, { status: 404 });

        let baseDate = enrollment.nextPaymentDue ? new Date(enrollment.nextPaymentDue) : new Date();
        
        // ✅ Ensure Calculation starts from 1st
        baseDate.setDate(1);

        const billingCycleName = getTargetMonths(baseDate, monthsToAdd);

        // ✅ Add months and KEEP it on 1st
        const newDueDate = addMonths(baseDate, monthsToAdd);
        newDueDate.setDate(1);

        enrollment.nextPaymentDue = newDueDate;
        enrollment.lastPaymentDate = new Date();
        enrollment.isBlocked = false; 
        enrollment.status = "approved";

        enrollment.paymentHistory.push({
            transactionId: `MANUAL-${Date.now()}`,
            amount: Number(amount),
            date: new Date(),
            month: billingCycleName, 
            status: "success",
            method: mode || "Cash/Manual"
        });

        await enrollment.save();

        try {
            const transporter = nodemailer.createTransport({
                service: "gmail",
                auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
            });
            if(enrollment.user?.email) {
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: enrollment.user.email,
                    subject: "Payment Receipt - LearnR",
                    html: `
                        <div style="font-family: sans-serif; padding: 20px;">
                            <h2 style="color: #16a34a;">Payment Received</h2>
                            <p>Hello ${enrollment.user.name},</p>
                            <p>We received <strong>₹${amount}</strong> manually.</p>
                            <p><strong>Cycle:</strong> ${billingCycleName}</p>
                            <p>Thank you!</p>
                        </div>
                    `
                });
            }
        } catch (e) {}

        return NextResponse.json({ success: true, message: "Payment recorded successfully!" });

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await connectDB();
        const { enrollmentId, action } = await req.json(); 
        const enrollment = await Enrollment.findById(enrollmentId).populate("user");
        
        if (action === "approve") {
            enrollment.isBlocked = false;
            enrollment.unblockRequest = { status: "approved" };
            await enrollment.save();
            
            try {
                const transporter = nodemailer.createTransport({
                    service: "gmail",
                    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
                });
                await transporter.sendMail({
                    from: process.env.EMAIL_USER,
                    to: enrollment.user.email,
                    subject: "Account Unblocked",
                    html: `<p>Your account has been unblocked.</p>`
                });
            } catch (e) {}

            return NextResponse.json({ success: true, message: "Unblocked" });
        } else if (action === "reject") {
            enrollment.unblockRequest = { status: "rejected" };
            await enrollment.save();
            return NextResponse.json({ success: true, message: "Rejected" });
        }
        return NextResponse.json({ error: "Invalid" }, { status: 400 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
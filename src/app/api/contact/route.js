import { NextResponse } from "next/server";
import connectDB from "@/lib/db";
import Contact from "@/models/Contact";
import nodemailer from "nodemailer";

export async function POST(req) {
  try {
    // 1. Connect to Database
    await connectDB();
    
    // 2. Get Data from Form
    const { name, email, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    // 3. Save to MongoDB
    await Contact.create({ name, email, message });

    // 4. Send Email Notification to You (Admin)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Aapka Gmail address (env file se aayega)
        pass: process.env.EMAIL_PASS, // Aapka App Password (env file se aayega)
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // Email aapko hi aayega
      replyTo: email, // Reply karne par user ka email select hoga
      subject: `New Enquiry from LearnR: ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #EAB308;">New Contact Form Submission</h2>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Message:</strong></p>
          <p style="background: #f9f9f9; padding: 15px; border-left: 4px solid #EAB308;">${message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 12px; color: #888;">This message was sent from your website LearnR.</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true, message: "Message sent successfully!" }, { status: 200 });

  } catch (error) {
    console.error("Contact API Error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
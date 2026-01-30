import mongoose from "mongoose";

const EnrollmentSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    
    // ✅ IMP: यह फील्ड पुरानी तारीख सेव करने के लिए जरूरी है
    enrolledAt: { type: Date, default: Date.now },

    amount: { type: Number, required: true }, 
    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "pending" 
    },
    transactionId: { type: String, required: true },
    
    // --- MONTHLY FEE LOGIC ---
    subscriptionStart: { type: Date, default: Date.now }, 
    nextPaymentDue: { type: Date }, 
    isBlocked: { type: Boolean, default: false }, 
    lastPaymentDate: { type: Date, default: Date.now },
    
    // --- UNBLOCK REQUEST LOGIC ---
    unblockRequest: {
      status: { 
        type: String, 
        enum: ["none", "pending", "approved", "rejected"], 
        default: "none" 
      },
      requestedAt: { type: Date }
    },

    paymentHistory: [
      {
        transactionId: String,
        amount: Number,
        date: { type: Date, default: Date.now },
        month: String, 
        status: String,
        method: { type: String, default: "Online" } 
      }
    ],

    lastEmailSentAt: { type: Date }
  },
  { timestamps: true }
);

export default mongoose.models.Enrollment || mongoose.model("Enrollment", EnrollmentSchema);
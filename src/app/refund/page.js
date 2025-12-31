import React from "react";

export const metadata = {
  title: "Refund Policy | LearnR",
  description: "Cancellation and Refund Policy for LearnR.",
};

export default function RefundPage() {
  return (
    <main className="min-h-screen bg-black text-gray-300 py-20 px-6 md:px-12 lg:px-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">
          Refund & <span className="text-yellow-500">Cancellation</span>
        </h1>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">1. Cancellation Policy</h2>
          <p>
            You can cancel your enrollment in a course within 24 hours of purchase if you have not accessed more than 10% of the course content. To cancel, please email us at support@learnr.com with your order details.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">2. Refund Policy</h2>
          <p>
            We strive to provide the best learning experience. However, if you are not satisfied with a course, you may be eligible for a refund under the following conditions:
          </p>
          <ul className="list-disc pl-5 space-y-2">
             <li>The refund request is made within <strong>7 days</strong> of purchase.</li>
             <li>You have not completed more than 20% of the course.</li>
          </ul>
          <p className="mt-4">
            If approved, the refund will be processed to your original payment method.
          </p>
        </section>

        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-white">3. Processing Timeline</h2>
          <p>
            Once a refund is initiated, it typically takes <strong>5-7 business days</strong> for the amount to reflect in your bank account, depending on your bank's processing time.
          </p>
        </section>
      </div>
    </main>
  );
}
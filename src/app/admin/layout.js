"use client";
import Sidebar from "@/components/admin/Sidebar";

export default function AdminLayout({ children }) {
  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar / Bottom Nav */}
      <Sidebar />

      {/* Main Content Area 
          - Mobile: ml-0 (Full Width), pb-24 (Space for Bottom Nav)
          - Desktop: md:ml-64 (Sidebar Width), md:pb-8 (Normal Padding)
      */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 overflow-y-auto h-screen custom-scrollbar pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
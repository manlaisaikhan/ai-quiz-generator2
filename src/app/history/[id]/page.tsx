"use client";
import { Header } from "@/app/_features/header";
import { HistorySection } from "../_features/historySection";

function HistoryPage() {
  return (
    <div className="bg-white w-full h-screen flex flex-col">
      <Header />
      <HistorySection />
    </div>
  );
}

export default HistoryPage;

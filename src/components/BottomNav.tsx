"use client";

import Header from "@/components/Header";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">

      <Header />

      <div className="flex flex-col items-center justify-center p-6 mt-20">

        <h1 className="text-4xl font-bold text-gray-900 mb-10">
          Cargo App
        </h1>

        <div className="flex flex-col gap-4 w-full max-w-sm">

          <button className="bg-blue-600 text-white py-4 rounded-2xl text-xl font-semibold">
            Я грузовладелец
          </button>

          <button className="bg-white border border-gray-300 py-4 rounded-2xl text-xl font-semibold">
            Я перевозчик
          </button>

        </div>

      </div>

      <BottomNav />

    </main>
  );
}
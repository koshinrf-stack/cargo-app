"use client";

import { useRouter } from "next/navigation";

export default function Home() {

  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">

      <h1 className="text-4xl font-bold mb-10">
        Cargo App
      </h1>

      <div className="flex flex-col gap-4 w-full max-w-sm">

        <button
          onClick={() => router.push("/owner")}
          className="bg-blue-600 text-white py-4 rounded-2xl text-xl"
        >
          Я грузовладелец
        </button>

        <button
          onClick={() => router.push("/carrier")}
          className="bg-white border border-gray-300 py-4 rounded-2xl text-xl"
        >
          Я перевозчик
        </button>

      </div>

    </main>
  );
}
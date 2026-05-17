"use client";

import { useRouter } from "next/navigation";

export default function OwnerPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-100 p-6">

      <h1 className="text-3xl font-bold mb-8">
        Кабинет грузовладельца
      </h1>

      <button
        onClick={() => router.push("/owner/create")}
        className="
          bg-blue-600
          text-white
          px-6
          py-4
          rounded-2xl
          text-lg
          font-semibold
        "
      >
        Добавить груз
      </button>

    </main>
  );
}
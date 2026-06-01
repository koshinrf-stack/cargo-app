"use client";

import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";

export default function OwnerPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-100 p-6 relative">
      <BackButton />
      <h1 className="text-3xl font-bold mb-8">
        Кабинет грузовладельца
      </h1>

      <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
        <div className="text-gray-500 text-sm mb-2">Организация</div>
        <div className="text-2xl font-bold mb-5">Суперпользователь</div>
        <div className="flex justify-between">
          <span>Рейтинг</span>
          <b>5 / 5</b>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => router.push("/owner/create")}
          className="bg-blue-600 text-white p-5 rounded-2xl w-full text-lg font-semibold"
        >
          Добавить груз
        </button>

        <button
          onClick={() => router.push("/owner/cargo")}
          className="bg-white border p-5 rounded-2xl w-full text-lg"
        >
          Мои грузы
        </button>

        <button
          onClick={() => router.push("/owner/carriers")}
          className="bg-white border p-5 rounded-2xl w-full text-lg"
        >
          Перевозчики
        </button>

        <button
          onClick={() => router.push("/owner/history")}
          className="bg-white border p-5 rounded-2xl w-full text-lg"
        >
          История заказов
        </button>
      </div>
    </main>
  );
}
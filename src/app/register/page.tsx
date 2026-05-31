"use client";

import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  async function selectRole(role: "owner" | "carrier") {
    // Обновляем роль админу
    await supabase
      .from("users")
      .update({ role })
      .eq("telegram_id", 0);

    router.push(role === "owner" ? "/owner" : "/carrier");
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 flex flex-col justify-center">
      <h1 className="text-3xl font-bold mb-10 text-center">
        Выберите роль
      </h1>

      <div className="flex flex-col gap-4">
        <button
          onClick={() => selectRole("owner")}
          className="bg-blue-600 text-white p-5 rounded-2xl"
        >
          Я грузовладелец
        </button>

        <button
          onClick={() => selectRole("carrier")}
          className="bg-white border p-5 rounded-2xl"
        >
          Я перевозчик
        </button>
      </div>
    </main>
  );
}
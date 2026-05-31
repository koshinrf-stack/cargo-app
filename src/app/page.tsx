"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const [status, setStatus] = useState("Загрузка...");

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    setStatus("Проверяем базу данных...");

    // Напрямую ищем админа
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", 0)
      .maybeSingle();

    if (error) {
      setStatus("Ошибка: " + error.message);
      return;
    }

    if (data) {
      setStatus("Админ найден, переходим...");
      router.push("/register");
      return;
    }

    setStatus("Пользователь не найден, переходим на регистрацию");
    router.push("/register");
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold">{status}</div>
      </div>
    </main>
  );
}
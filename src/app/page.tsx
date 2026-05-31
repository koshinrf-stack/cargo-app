"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTelegram } from "@/providers/TelegramProvider";
import { supabase } from "@/lib/supabase";

export default function Home() {
  const router = useRouter();
  const { user, ready } = useTelegram();

  useEffect(() => {
    if (!ready) return;

    checkUser();
  }, [user, ready]);

  async function checkUser() {
    // Используем реальный telegram_id или 0 для браузера
    const telegramId = user?.id || 0;

    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (!data) {
      // Пользователь не найден — отправляем на регистрацию
      router.push("/register");
      return;
    }

    if (data.is_admin) {
      router.push("/register");
      return;
    }

    router.push(data.role === "owner" ? "/owner" : "/carrier");
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-2xl font-bold">Загрузка...</div>
    </main>
  );
}
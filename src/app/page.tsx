"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTelegram } from "@/providers/TelegramProvider";
import { checkUser } from "@/services/checkUser";

const DEV_TELEGRAM_ID = 0;

export default function Home() {
  const router = useRouter();
  const { user, ready } = useTelegram();

  useEffect(() => {
    if (!ready) return;

    const telegramId = user?.id || DEV_TELEGRAM_ID;
    loadUser(telegramId);
  }, [user, ready]);

  async function loadUser(telegramId: number) {
    const result = await checkUser(telegramId);

    if (result.error) {
      console.error(result.error);
      return;
    }

    if (!result.data) {
      router.push("/register");
      return;
    }

    if (result.data.is_admin) {
      router.push("/register");
      return;
    }

    if (result.data.role === "owner") {
      router.push("/owner");
      return;
    }

    if (result.data.role === "carrier") {
      router.push("/carrier");
      return;
    }

    router.push("/register");
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-2xl font-bold">Загрузка...</div>
    </main>
  );
}
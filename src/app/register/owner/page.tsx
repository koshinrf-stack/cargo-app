"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTelegram } from "@/providers/TelegramProvider";
import BackButton from "@/components/BackButton";

export default function RegisterOwner() {
  const router = useRouter();
  const { user } = useTelegram();

  const [company, setCompany] = useState("");
  const [inn, setInn] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  async function finishRegistration() {
    const telegramId = user?.id || 0;

    if (!company || !phone) {
      alert("Заполните название организации и телефон");
      return;
    }

    setLoading(true);

    // Проверяем, существует ли уже пользователь
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (existing) {
      // Уже зарегистрирован
      router.push("/owner");
      setLoading(false);
      return;
    }

    // Создаём нового пользователя
    const { error } = await supabase.from("users").insert({
      telegram_id: telegramId,
      role: "owner",
      company_name: company,
      inn: inn || null,
      phone: phone,
      city: city || null,
      rating: 5,
      is_admin: false,
    });

    if (error) {
      console.error(error);
      alert("Ошибка: " + error.message);
    } else {
      alert("Регистрация завершена!");
      router.push("/owner");
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 relative">
      <BackButton />

      <h1 className="text-3xl font-bold mb-8">Регистрация грузовладельца</h1>

      <div className="flex flex-col gap-4">
        <input
          placeholder="Название фирмы *"
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          className="p-4 rounded-xl"
        />

        <input
          placeholder="ИНН"
          value={inn}
          onChange={(e) => setInn(e.target.value)}
          className="p-4 rounded-xl"
        />

        <input
          placeholder="Телефон *"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="p-4 rounded-xl"
        />

        <input
          placeholder="Город"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="p-4 rounded-xl"
        />

        <button
          onClick={finishRegistration}
          disabled={loading}
          className="bg-blue-600 text-white p-4 rounded-xl disabled:opacity-60"
        >
          {loading ? "Сохраняем..." : "Завершить регистрацию"}
        </button>
      </div>
    </main>
  );
}
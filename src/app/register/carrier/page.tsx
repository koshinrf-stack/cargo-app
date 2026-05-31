"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTelegram } from "@/providers/TelegramProvider";

export default function RegisterCarrier() {
  const router = useRouter();
  const { user } = useTelegram();

  const [company, setCompany] = useState("");
  const [inn, setInn] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);

  async function finishRegistration() {
    if (!user?.id) {
      alert("Telegram user not found");
      return;
    }

    if (!company || !phone) {
      alert("Заполните название организации и телефон");
      return;
    }

    setLoading(true);

    // Проверяем, существует ли уже пользователь
    const { data: existingUser, error: selectError } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", user.id)
      .single();

    if (selectError && selectError.code !== "PGRST116") {
      console.error(selectError);
      alert(selectError.message);
      setLoading(false);
      return;
    }

    if (existingUser) {
      router.push("/carrier");
      setLoading(false);
      return;
    }

    // Создаём нового перевозчика
    const { error } = await supabase.from("users").insert({
      telegram_id: user.id,
      role: "carrier",
      company_name: company,
      inn: inn || null,
      phone: phone,
      city: city || null,
      rating: 5,
    });

    if (error) {
      console.error(error);
      alert(error.message);
      setLoading(false);
      return;
    }

    alert("Регистрация завершена!");
    router.push("/carrier");
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-8">Регистрация перевозчика</h1>

      <div className="flex flex-col gap-4">
        <input
          placeholder="Название организации *"
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
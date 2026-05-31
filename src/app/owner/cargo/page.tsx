"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTelegram } from "@/providers/TelegramProvider";

type Shipment = {
  id: string;
  cargo_type: string;
  from_city: string;
  to_city: string;
  weight_kg: number;
  pallets_count: number | null;
  price: number;
  status: string;
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  searching_carrier: "🔍 Поиск перевозчика",
  in_progress: "🚚 Выполняется",
  completed: "✅ Выполнен",
  cancelled: "❌ Отменён",
};

const STATUS_COLORS: Record<string, string> = {
  searching_carrier: "bg-yellow-100 text-yellow-800",
  in_progress: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function OwnerCargoPage() {
  const router = useRouter();
  const { user } = useTelegram();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadShipments();
  }, [user]);

  async function loadShipments() {
    setLoading(true);

    // Сначала получаем UUID пользователя из таблицы users
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", user!.id)
      .single();

    if (!profile) {
      setLoading(false);
      return;
    }

    // Получаем все заказы этого пользователя
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("owner_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setShipments(data || []);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl font-bold">Загрузка...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 pb-24">
      <h1 className="text-3xl font-bold mb-8">Мои грузы</h1>

      {shipments.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
          У вас пока нет заказов
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {shipments.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-semibold">
                  {item.from_city} → {item.to_city}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[item.status] || "bg-gray-100 text-gray-600"}`}
                >
                  {STATUS_LABELS[item.status] || item.status}
                </span>
              </div>

              <div className="text-sm text-gray-500 space-y-1">
                <div>
                  Тип:{" "}
                  {item.cargo_type === "truck"
                    ? "Полная фура"
                    : `Паллеты (${item.pallets_count} шт.)`}
                </div>
                <div>Вес: {item.weight_kg} кг</div>
                <div>Стоимость: {item.price.toLocaleString()} ₽</div>
                <div>
                  Дата:{" "}
                  {new Date(item.created_at).toLocaleDateString("ru-RU")}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Кнопка Назад */}
      <div className="fixed bottom-6 left-6 right-6">
        <button
          onClick={() => router.push("/owner")}
          className="w-full bg-gray-200 text-gray-800 p-4 rounded-2xl text-lg font-medium"
        >
          ← Назад
        </button>
      </div>
    </main>
  );
}
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
  completed_at: string | null;
};

export default function CarrierHistoryPage() {
  const router = useRouter();
  const { user } = useTelegram();

  const [orders, setOrders] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalEarned, setTotalEarned] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    loadHistory();
  }, [user]);

  async function loadHistory() {
    setLoading(true);

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", user!.id)
      .single();

    if (!profile) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("carrier_id", profile.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setOrders(data || []);
      setTotalCompleted(data ? data.length : 0);
      setTotalEarned(
        data ? data.reduce((sum, o) => sum + Number(o.price), 0) : 0
      );
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
      <h1 className="text-3xl font-bold mb-8">История заказов</h1>

      {/* Статистика */}
      <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
        <div className="flex justify-between mb-3">
          <span className="text-gray-500">Всего выполнено</span>
          <span className="font-bold text-lg">{totalCompleted}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Заработано всего</span>
          <span className="font-bold text-lg text-green-600">
            {totalEarned.toLocaleString()} ₽
          </span>
        </div>
      </div>

      {/* Список заказов */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
          История пуста
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((item) => (
            <div
              key={item.id}
              className="bg-white p-5 rounded-2xl shadow-sm"
            >
              <div className="text-lg font-semibold mb-2">
                {item.from_city} → {item.to_city}
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                <div>
                  Тип:{" "}
                  {item.cargo_type === "truck"
                    ? "Полная фура"
                    : `Паллеты (${item.pallets_count} шт.)`}
                </div>
                <div>Вес: {item.weight_kg} кг</div>
                <div className="text-blue-600 font-bold text-base mt-2">
                  {item.price.toLocaleString()} ₽
                </div>
                {item.completed_at && (
                  <div className="text-gray-400">
                    Завершён:{" "}
                    {new Date(item.completed_at).toLocaleDateString("ru-RU")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Кнопка Назад */}
      <div className="fixed bottom-6 left-6 right-6">
        <button
          onClick={() => router.push("/carrier")}
          className="w-full bg-gray-200 text-gray-800 p-4 rounded-2xl text-lg font-medium"
        >
          ← Назад
        </button>
      </div>
    </main>
  );
}
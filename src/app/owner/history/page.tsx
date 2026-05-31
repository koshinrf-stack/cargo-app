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
  created_at: string;
};

export default function OwnerHistoryPage() {
  const router = useRouter();
  const { user } = useTelegram();

  const [orders, setOrders] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

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

    // Заказы за последний год
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("owner_id", profile.id)
      .eq("status", "completed")
      .gte("completed_at", oneYearAgo.toISOString())
      .order("completed_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setOrders(data || []);
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
              <div className="flex items-center justify-between mb-2">
                <span className="text-lg font-semibold">
                  {item.from_city} → {item.to_city}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ✅ Выполнен
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
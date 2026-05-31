"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTelegram } from "@/providers/TelegramProvider";

type Carrier = {
  id: string;
  company_name: string | null;
  city: string | null;
  rating: number | null;
  completed_count: number;
  last_order_date: string | null;
};

export default function CarriersPage() {
  const router = useRouter();
  const { user } = useTelegram();

  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadMyCarriers();
  }, [user]);

  async function loadMyCarriers() {
    setLoading(true);

    // Получаем профиль грузовладельца
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", user!.id)
      .single();

    if (!profile) {
      setLoading(false);
      return;
    }

    // Находим завершённые заказы, где владелец = текущий пользователь
    const { data: completedShipments, error } = await supabase
      .from("shipments")
      .select("carrier_id, completed_at")
      .eq("owner_id", profile.id)
      .eq("status", "completed")
      .not("carrier_id", "is", null);

    if (error || !completedShipments || completedShipments.length === 0) {
      setCarriers([]);
      setLoading(false);
      return;
    }

    // Собираем уникальные ID перевозчиков и считаем статистику
    const carrierMap = new Map<string, { count: number; lastDate: string }>();

    completedShipments.forEach((s) => {
      const existing = carrierMap.get(s.carrier_id);
      if (existing) {
        existing.count++;
        if (s.completed_at && s.completed_at > existing.lastDate) {
          existing.lastDate = s.completed_at;
        }
      } else {
        carrierMap.set(s.carrier_id, {
          count: 1,
          lastDate: s.completed_at || "",
        });
      }
    });

    const carrierIds = Array.from(carrierMap.keys());

    // Получаем данные перевозчиков
    const { data: carriersData, error: carriersError } = await supabase
      .from("users")
      .select("id, company_name, city, rating")
      .in("id", carrierIds);

    if (carriersError) {
      console.error(carriersError);
      setLoading(false);
      return;
    }

    // Объединяем данные
    const result: Carrier[] = (carriersData || []).map((c) => {
      const stats = carrierMap.get(c.id);
      return {
        id: c.id,
        company_name: c.company_name,
        city: c.city,
        rating: c.rating,
        completed_count: stats?.count || 0,
        last_order_date: stats?.lastDate || null,
      };
    });

    // Сортируем по дате последнего заказа (сначала новые)
    result.sort((a, b) => {
      if (!a.last_order_date) return 1;
      if (!b.last_order_date) return -1;
      return b.last_order_date.localeCompare(a.last_order_date);
    });

    setCarriers(result);
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
      <h1 className="text-3xl font-bold mb-8">Мои перевозчики</h1>

      {carriers.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
          У вас пока нет выполненных заказов
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {carriers.map((carrier) => (
            <div
              key={carrier.id}
              className="bg-white p-5 rounded-2xl shadow-sm"
            >
              <div className="text-lg font-semibold mb-2">
                {carrier.company_name || "Без названия"}
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                {carrier.city && <div>Город: {carrier.city}</div>}
                <div>
                  Рейтинг:{" "}
                  <b>{carrier.rating ? `${carrier.rating} / 5` : "Нет оценок"}</b>
                </div>
                <div>Совместных заказов: <b>{carrier.completed_count}</b></div>
                {carrier.last_order_date && (
                  <div>
                    Последний заказ:{" "}
                    {new Date(carrier.last_order_date).toLocaleDateString("ru-RU")}
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
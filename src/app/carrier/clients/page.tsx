"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTelegram } from "@/providers/TelegramProvider";

type Client = {
  id: string;
  company_name: string | null;
  city: string | null;
  rating: number | null;
  completed_count: number;
  last_order_date: string | null;
};

export default function ClientsPage() {
  const router = useRouter();
  const { user } = useTelegram();

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadMyClients();
  }, [user]);

  async function loadMyClients() {
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

    // Завершённые заказы, где перевозчик = текущий пользователь
    const { data: completedShipments, error } = await supabase
      .from("shipments")
      .select("owner_id, completed_at")
      .eq("carrier_id", profile.id)
      .eq("status", "completed");

    if (error || !completedShipments || completedShipments.length === 0) {
      setClients([]);
      setLoading(false);
      return;
    }

    const clientMap = new Map<string, { count: number; lastDate: string }>();

    completedShipments.forEach((s) => {
      const existing = clientMap.get(s.owner_id);
      if (existing) {
        existing.count++;
        if (s.completed_at && s.completed_at > existing.lastDate) {
          existing.lastDate = s.completed_at;
        }
      } else {
        clientMap.set(s.owner_id, {
          count: 1,
          lastDate: s.completed_at || "",
        });
      }
    });

    const clientIds = Array.from(clientMap.keys());

    const { data: clientsData, error: clientsError } = await supabase
      .from("users")
      .select("id, company_name, city, rating")
      .in("id", clientIds);

    if (clientsError) {
      console.error(clientsError);
      setLoading(false);
      return;
    }

    const result: Client[] = (clientsData || []).map((c) => {
      const stats = clientMap.get(c.id);
      return {
        id: c.id,
        company_name: c.company_name,
        city: c.city,
        rating: c.rating,
        completed_count: stats?.count || 0,
        last_order_date: stats?.lastDate || null,
      };
    });

    result.sort((a, b) => {
      if (!a.last_order_date) return 1;
      if (!b.last_order_date) return -1;
      return b.last_order_date.localeCompare(a.last_order_date);
    });

    setClients(result);
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
      <h1 className="text-3xl font-bold mb-8">Мои клиенты</h1>

      {clients.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
          У вас пока нет выполненных заказов
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white p-5 rounded-2xl shadow-sm"
            >
              <div className="text-lg font-semibold mb-2">
                {client.company_name || "Без названия"}
              </div>
              <div className="text-sm text-gray-500 space-y-1">
                {client.city && <div>Город: {client.city}</div>}
                <div>
                  Рейтинг:{" "}
                  <b>{client.rating ? `${client.rating} / 5` : "Нет оценок"}</b>
                </div>
                <div>Совместных заказов: <b>{client.completed_count}</b></div>
                {client.last_order_date && (
                  <div>
                    Последний заказ:{" "}
                    {new Date(client.last_order_date).toLocaleDateString("ru-RU")}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
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
  description: string | null;
  status: string;
  owner_id: string;
  created_at: string;
};

const CANCEL_REASONS = [
  { value: "broken", label: "🚛 Сломался" },
  { value: "accidental", label: "🤷 Взял случайно" },
  { value: "owner_changed", label: "❌ Грузовладелец озвучил другие условия" },
];

export default function CarrierActiveOrders() {
  const router = useRouter();
  const { user } = useTelegram();

  const [orders, setOrders] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);

  // Для модальных окон
  const [cancelOrder, setCancelOrder] = useState<Shipment | null>(null);
  const [completeOrder, setCompleteOrder] = useState<Shipment | null>(null);
  const [rating, setRating] = useState(0);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    loadOrders();
  }, [user]);

  async function loadOrders() {
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
      .eq("status", "in_progress")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
    } else {
      setOrders(data || []);
    }

    setLoading(false);
  }

  async function handleComplete() {
    if (!completeOrder) return;
    if (rating === 0) {
      alert("Поставьте оценку грузовладельцу");
      return;
    }

    setActionLoading(true);

    // Получаем профиль перевозчика
    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", user!.id)
      .single();

    if (!profile) {
      alert("Ошибка: профиль не найден");
      setActionLoading(false);
      return;
    }

    // Сохраняем оценку в таблицу ratings
    const { error: ratingError } = await supabase.from("ratings").insert({
      shipment_id: completeOrder.id,
      from_user_id: profile.id,
      to_user_id: completeOrder.owner_id,
      rating: rating,
    });

    if (ratingError) {
      console.error(ratingError);
      alert("Ошибка сохранения оценки: " + ratingError.message);
      setActionLoading(false);
      return;
    }

    // Обновляем заказ
    const { error } = await supabase
      .from("shipments")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", completeOrder.id);

    if (error) {
      console.error(error);
      alert("Ошибка: " + error.message);
    } else {
      alert("Заказ завершён! Оценка будет учтена в рейтинге через 48 часов.");
      setOrders(orders.filter((o) => o.id !== completeOrder.id));
    }

    setCompleteOrder(null);
    setRating(0);
    setActionLoading(false);
  }

  async function handleCancel() {
    if (!cancelOrder) return;
    if (!cancelReason) {
      alert("Выберите причину отмены");
      return;
    }

    setActionLoading(true);

    // Если причина "owner_changed" — понижаем рейтинг владельца
    if (cancelReason === "owner_changed") {
      const { data: owner } = await supabase
        .from("users")
        .select("id, rating")
        .eq("id", cancelOrder.owner_id)
        .single();

      if (owner) {
        const currentRating = owner.rating || 5;
        const newRating = Math.max(1, currentRating - 1);

        await supabase
          .from("users")
          .update({ rating: newRating })
          .eq("id", owner.id);
      }
    }

    // Возвращаем заказ в базу (меняем статус, убираем carrier_id)
    const { error } = await supabase
      .from("shipments")
      .update({
        status: "searching_carrier",
        carrier_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", cancelOrder.id);

    if (error) {
      console.error(error);
      alert("Ошибка: " + error.message);
    } else {
      alert("Заказ отменён и возвращён в базу.");
      setOrders(orders.filter((o) => o.id !== cancelOrder.id));
    }

    setCancelOrder(null);
    setCancelReason("");
    setActionLoading(false);
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
      <h1 className="text-3xl font-bold mb-8">Мои перевозки</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
          У вас нет активных заказов
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((item) => (
            <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm">
              <div className="text-lg font-semibold mb-3">
                {item.from_city} → {item.to_city}
              </div>
              <div className="text-sm text-gray-500 space-y-1 mb-4">
                <div>
                  Тип:{" "}
                  {item.cargo_type === "truck"
                    ? "Полная фура"
                    : `Паллеты (${item.pallets_count} шт.)`}
                </div>
                <div>Вес: {item.weight_kg} кг</div>
                {item.description && <div>Описание: {item.description}</div>}
                <div className="text-blue-600 font-bold text-base mt-2">
                  {item.price.toLocaleString()} ₽
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setCompleteOrder(item)}
                  className="flex-1 bg-green-600 text-white p-3 rounded-xl"
                >
                  ✅ Завершить
                </button>
                <button
                  onClick={() => setCancelOrder(item)}
                  className="flex-1 bg-red-100 text-red-700 p-3 rounded-xl"
                >
                  ❌ Отменить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно: Завершение заказа + Оценка */}
      {completeOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Оцените грузовладельца</h2>
            <p className="text-gray-500 text-sm mb-4">
              {completeOrder.from_city} → {completeOrder.to_city}
            </p>

            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-4xl ${star <= rating ? "text-yellow-400" : "text-gray-300"}`}
                >
                  ★
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCompleteOrder(null);
                  setRating(0);
                }}
                className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-xl"
              >
                Отмена
              </button>
              <button
                onClick={handleComplete}
                disabled={actionLoading}
                className="flex-1 bg-green-600 text-white p-3 rounded-xl disabled:opacity-60"
              >
                {actionLoading ? "..." : "Завершить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно: Отмена заказа */}
      {cancelOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h2 className="text-xl font-bold mb-4">Причина отмены</h2>
            <p className="text-gray-500 text-sm mb-4">
              {cancelOrder.from_city} → {cancelOrder.to_city}
            </p>

            <div className="flex flex-col gap-2 mb-6">
              {CANCEL_REASONS.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setCancelReason(reason.value)}
                  className={`p-3 rounded-xl text-left ${
                    cancelReason === reason.value
                      ? "bg-red-100 border-2 border-red-500"
                      : "bg-gray-100 border-2 border-transparent"
                  }`}
                >
                  {reason.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setCancelOrder(null);
                  setCancelReason("");
                }}
                className="flex-1 bg-gray-200 text-gray-800 p-3 rounded-xl"
              >
                Назад
              </button>
              <button
                onClick={handleCancel}
                disabled={actionLoading || !cancelReason}
                className="flex-1 bg-red-600 text-white p-3 rounded-xl disabled:opacity-60"
              >
                {actionLoading ? "..." : "Отменить заказ"}
              </button>
            </div>
          </div>
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
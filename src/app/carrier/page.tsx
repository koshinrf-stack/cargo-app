"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTelegram } from "@/providers/TelegramProvider";
import BackButton from "@/components/BackButton";

type Shipment = {
  id: string;
  cargo_type: string;
  from_city: string;
  to_city: string;
  weight_kg: number;
  pallets_count: number | null;
  price: number;
  description: string | null;
  payment_type: string;
  payment_term: string;
  created_at: string;
  from_lat: number | null;
  from_lng: number | null;
  distance_km?: number;
};

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  cash: "Наличка",
  beznal: "Безнал",
  beznal_nds: "Безнал с НДС",
};

const PAYMENT_TERM_LABELS: Record<string, string> = {
  "100_prepay": "100% предоплата",
  "50_50": "50% по загрузке + 50% после",
  "100_after": "100% после выгрузки",
};

function getDistanceFromLatLng(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export default function CarrierOrders() {
  const router = useRouter();
  const { user } = useTelegram();

  const [orders, setOrders] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Shipment | null>(null);
  const [taking, setTaking] = useState(false);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [nearbyMode, setNearbyMode] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    loadOrders(false);
  }, []);

  async function loadOrders(withNearby: boolean) {
    setLoading(true);

    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("status", "searching_carrier")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    let ordersData = data || [];

    if (withNearby && userCoords) {
      ordersData = ordersData
        .map((order) => {
          if (order.from_lat && order.from_lng) {
            const dist = getDistanceFromLatLng(
              userCoords.lat,
              userCoords.lng,
              order.from_lat,
              order.from_lng
            );
            return { ...order, distance_km: dist };
          }
          return order;
        })
        .filter((order) => {
          if (order.distance_km === undefined) return false;
          return order.distance_km <= 100;
        })
        .sort((a, b) => {
          const distA = a.distance_km ?? 9999;
          const distB = b.distance_km ?? 9999;
          return distA - distB;
        });
    }

    setOrders(ordersData);
    setLoading(false);
  }

  function getTelegramLocation() {
    setGettingLocation(true);

    const tg = (window as any).Telegram?.WebApp;

    // Telegram Location API
    if (tg?.LocationManager?.getLocation) {
      tg.LocationManager.getLocation((data: any) => {
        if (data?.latitude && data?.longitude) {
          setUserCoords({
            lat: data.latitude,
            lng: data.longitude,
          });
          setNearbyMode(true);
          loadOrdersWithCoords(data.latitude, data.longitude);
        } else {
          alert("Не удалось получить местоположение");
          setGettingLocation(false);
        }
      });
    } else {
      alert(
        "Геолокация недоступна. Убедитесь, что вы открыли приложение из Telegram."
      );
      setGettingLocation(false);
    }
  }

  async function loadOrdersWithCoords(lat: number, lng: number) {
    setLoading(true);

    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("status", "searching_carrier")
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setLoading(false);
      setGettingLocation(false);
      return;
    }

    let ordersData = (data || [])
      .map((order) => {
        if (order.from_lat && order.from_lng) {
          const dist = getDistanceFromLatLng(
            lat,
            lng,
            order.from_lat,
            order.from_lng
          );
          return { ...order, distance_km: dist };
        }
        return order;
      })
      .filter((order) => {
        if (order.distance_km === undefined) return false;
        return order.distance_km <= 100;
      })
      .sort((a, b) => {
        const distA = a.distance_km ?? 9999;
        const distB = b.distance_km ?? 9999;
        return distA - distB;
      });

    setOrders(ordersData);
    setLoading(false);
    setGettingLocation(false);
  }

  function toggleNearbyMode() {
    if (nearbyMode) {
      setNearbyMode(false);
      setUserCoords(null);
      loadOrders(false);
    } else {
      getTelegramLocation();
    }
  }

  async function takeOrder(order: Shipment) {
    if (!user?.id) {
      alert("Пользователь не найден");
      return;
    }

    setTaking(true);

    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", user.id)
      .single();

    if (profileError || !profile) {
      alert("Ошибка: профиль перевозчика не найден");
      setTaking(false);
      return;
    }

    const { error } = await supabase
      .from("shipments")
      .update({
        carrier_id: profile.id,
        status: "in_progress",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("status", "searching_carrier");

    if (error) {
      console.error(error);
      alert("Ошибка: " + error.message);
      setTaking(false);
      return;
    }

    alert("Заказ принят! Перейдите в «Активные заказы».");
    setOrders(orders.filter((o) => o.id !== order.id));
    setSelectedOrder(null);
    setTaking(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-2xl font-bold">Загрузка...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 pb-24 relative">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">
          {nearbyMode ? "Заказы рядом" : "База заказов"}
        </h1>
      </div>

      {/* Кнопка геолокации */}
      <button
        onClick={toggleNearbyMode}
        disabled={gettingLocation}
        className={`w-full p-4 rounded-xl mb-6 text-lg font-medium disabled:opacity-60 ${
          nearbyMode
            ? "bg-green-600 text-white"
            : "bg-white border-2 border-green-500 text-green-600"
        }`}
      >
        {gettingLocation
          ? "Определяем местоположение..."
          : nearbyMode
          ? "✅ Заказы рядом (до 100 км)"
          : "📍 Показать заказы рядом"}
      </button>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center text-gray-500">
          {nearbyMode
            ? "Нет заказов в радиусе 100 км"
            : "Нет доступных заказов"}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedOrder(item)}
              className="bg-white p-5 rounded-2xl shadow-sm cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-lg font-semibold">
                  {item.from_city} → {item.to_city}
                </div>
                {item.distance_km !== undefined && (
                  <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded-full">
                    {item.distance_km} км
                  </span>
                )}
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Детали заказа</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Откуда</span>
                <span className="font-semibold">{selectedOrder.from_city}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Куда</span>
                <span className="font-semibold">{selectedOrder.to_city}</span>
              </div>
              {selectedOrder.distance_km !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Расстояние до вас</span>
                  <span className="font-semibold text-blue-600">
                    {selectedOrder.distance_km} км
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Тип груза</span>
                <span className="font-semibold">
                  {selectedOrder.cargo_type === "truck"
                    ? "Полная фура"
                    : `Паллеты (${selectedOrder.pallets_count} шт.)`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Вес</span>
                <span className="font-semibold">{selectedOrder.weight_kg} кг</span>
              </div>
              {selectedOrder.description && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Описание</span>
                  <span className="font-semibold">{selectedOrder.description}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Оплата</span>
                <span className="font-semibold">
                  {PAYMENT_TYPE_LABELS[selectedOrder.payment_type]} /{" "}
                  {PAYMENT_TERM_LABELS[selectedOrder.payment_term]}
                </span>
              </div>
              <div className="flex justify-between text-lg pt-2 border-t">
                <span className="text-gray-500">Стоимость</span>
                <span className="font-bold text-green-600">
                  {selectedOrder.price.toLocaleString()} ₽
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 bg-gray-200 text-gray-800 p-4 rounded-xl"
              >
                Закрыть
              </button>
              <button
                onClick={() => takeOrder(selectedOrder)}
                disabled={taking}
                className="flex-1 bg-blue-600 text-white p-4 rounded-xl disabled:opacity-60"
              >
                {taking ? "..." : "Взять заказ"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BackButton />
    </main>
  );
}
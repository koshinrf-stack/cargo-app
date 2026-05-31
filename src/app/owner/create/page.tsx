"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useTelegram } from "@/providers/TelegramProvider";

const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY || "";

type CitySuggestion = {
  name: string;
  lat: number;
  lng: number;
};

const COST_PER_KM = 85;
const FULL_TRUCK_TONS = 22;
const FULL_TRUCK_PALLETS = 33;
const MIN_PRICE = 4000;

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function CreateCargoPage() {
  const router = useRouter();
  const { user } = useTelegram();

  // Шаг 1: Откуда
  const [fromQuery, setFromQuery] = useState("");
  const [fromSuggestions, setFromSuggestions] = useState<CitySuggestion[]>([]);
  const [fromSelected, setFromSelected] = useState<CitySuggestion | null>(null);
  const [showFromSuggestions, setShowFromSuggestions] = useState(false);

  // Шаг 2: Куда
  const [toQuery, setToQuery] = useState("");
  const [toSuggestions, setToSuggestions] = useState<CitySuggestion[]>([]);
  const [toSelected, setToSelected] = useState<CitySuggestion | null>(null);
  const [showToSuggestions, setShowToSuggestions] = useState(false);

  // Шаг 3: Тип груза
  const [cargoType, setCargoType] = useState("pallet");

  // Шаг 4: Какой груз
  const [weight, setWeight] = useState("");
  const [pallets, setPallets] = useState("");
  const [description, setDescription] = useState("");

  // Шаг 5: Оплата
  const [paymentType, setPaymentType] = useState("cash");
  const [paymentTerm, setPaymentTerm] = useState("100_prepay");

  // Расчёт
  const [distance, setDistance] = useState<number | null>(null);
  const [price, setPrice] = useState<number | null>(null);
  const [finalPrice, setFinalPrice] = useState<number | null>(null);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [saving, setSaving] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  // Закрытие подсказок при клике вне
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) {
        setShowFromSuggestions(false);
      }
      if (toRef.current && !toRef.current.contains(e.target as Node)) {
        setShowToSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Поиск городов через Geoapify Autocomplete
  async function searchCities(query: string): Promise<CitySuggestion[]> {
    if (!GEOAPIFY_KEY || query.length < 2) return [];
    try {
      const url = `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(
        query
      )}&type=city&format=json&apiKey=${GEOAPIFY_KEY}&limit=5&lang=ru`;
      const response = await fetch(url);
      const data = await response.json();
      if (data.results) {
        return data.results.map((r: any) => ({
          name: r.formatted || r.name || query,
          lat: r.lat,
          lng: r.lon,
        }));
      }
      return [];
    } catch (error) {
      console.error(error);
      return [];
    }
  }

  // Обработчики ввода
  async function handleFromInput(value: string) {
    setFromQuery(value);
    setFromSelected(null);
    setShowResult(false);
    if (value.length >= 2) {
      const results = await searchCities(value);
      setFromSuggestions(results);
      setShowFromSuggestions(results.length > 0);
    } else {
      setFromSuggestions([]);
      setShowFromSuggestions(false);
    }
  }

  async function handleToInput(value: string) {
    setToQuery(value);
    setToSelected(null);
    setShowResult(false);
    if (value.length >= 2) {
      const results = await searchCities(value);
      setToSuggestions(results);
      setShowToSuggestions(results.length > 0);
    } else {
      setToSuggestions([]);
      setShowToSuggestions(false);
    }
  }

  function selectFrom(city: CitySuggestion) {
    setFromQuery(city.name);
    setFromSelected(city);
    setShowFromSuggestions(false);
    setShowResult(false);
  }

  function selectTo(city: CitySuggestion) {
    setToQuery(city.name);
    setToSelected(city);
    setShowToSuggestions(false);
    setShowResult(false);
  }

  // Расчёт стоимости
  function calculatePrice() {
    if (!fromSelected || !toSelected) {
      alert("Выберите города из выпадающего списка");
      return;
    }
    if (!weight || Number(weight) <= 0) {
      alert("Введите вес груза");
      return;
    }
    if (cargoType === "pallet" && (!pallets || Number(pallets) <= 0)) {
      alert("Введите количество паллет");
      return;
    }

    const km = getDistance(fromSelected.lat, fromSelected.lng, toSelected.lat, toSelected.lng);
    const roundedKm = Math.round(km);
    setDistance(roundedKm);

    let basePrice = 0;
    const kg = Number(weight);
    const tons = kg / 1000;

    if (cargoType === "truck") {
      basePrice = roundedKm * COST_PER_KM;
    }
    if (cargoType === "pallet") {
      const palletCount = Number(pallets);
      const palletRatio = palletCount / FULL_TRUCK_PALLETS;
      const weightRatio = tons / FULL_TRUCK_TONS;
      const ratio = Math.max(palletRatio, weightRatio);
      basePrice = ratio * roundedKm * COST_PER_KM;
    }

    if (basePrice < MIN_PRICE) basePrice = MIN_PRICE;
    basePrice = Math.round(basePrice);
    setPrice(basePrice);

    let totalDiscount = 0;
    if (paymentType === "cash") totalDiscount += 5;
    if (paymentTerm === "100_prepay") totalDiscount += 5;
    if (paymentTerm === "100_after") totalDiscount -= 5;

    setDiscountPercent(totalDiscount);
    const final = Math.round(basePrice * (1 - totalDiscount / 100));
    setFinalPrice(final);
    setShowResult(true);
  }

  async function saveCargo() {
    if (!fromSelected || !toSelected || finalPrice === null || !user?.id) {
      alert("Заполните все поля и рассчитайте стоимость");
      return;
    }

    setSaving(true);

    const { data: profile } = await supabase
      .from("users")
      .select("id")
      .eq("telegram_id", user.id)
      .single();

    if (!profile) {
      alert("Ошибка: профиль не найден");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("shipments").insert({
      owner_id: profile.id,
      cargo_type: cargoType,
      pallets_count: cargoType === "pallet" ? Number(pallets) : null,
      weight_kg: Number(weight),
      from_city: fromQuery,
      to_city: toQuery,
      from_lat: fromSelected.lat,
      from_lng: fromSelected.lng,
      description: description || null,
      price: finalPrice,
      base_price: price,
      discount_percent: discountPercent,
      payment_type: paymentType,
      payment_term: paymentTerm,
      status: "searching_carrier",
    });

    if (error) {
      console.error(error);
      alert("Ошибка: " + error.message);
    } else {
      alert("Груз добавлен!");
      // Очистка формы
      setFromQuery("");
      setFromSelected(null);
      setToQuery("");
      setToSelected(null);
      setWeight("");
      setPallets("");
      setDescription("");
      setDistance(null);
      setPrice(null);
      setFinalPrice(null);
      setDiscountPercent(0);
      setShowResult(false);
    }
    setSaving(false);
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6 pb-32">
      {/* Кнопка Назад */}
      <button
        onClick={() => router.push("/owner")}
        className="text-blue-600 text-sm mb-4 flex items-center gap-1"
      >
        ← Назад
      </button>

      <h1 className="text-3xl font-bold mb-8">Добавление груза</h1>

      <div className="flex flex-col gap-4">
        {/* 1. Откуда */}
        <div ref={fromRef} className="relative">
          <label className="text-sm text-gray-500 mb-1 block">Откуда</label>
          <input
            placeholder="Введите город отправления"
            value={fromQuery}
            onChange={(e) => handleFromInput(e.target.value)}
            onFocus={() => fromSuggestions.length > 0 && setShowFromSuggestions(true)}
            className="p-4 rounded-xl w-full border"
          />
          {showFromSuggestions && fromSuggestions.length > 0 && (
            <div className="absolute z-10 bg-white border rounded-xl mt-1 w-full max-h-48 overflow-y-auto shadow-lg">
              {fromSuggestions.map((city, i) => (
                <button
                  key={i}
                  onClick={() => selectFrom(city)}
                  className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0"
                >
                  {city.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Куда */}
        <div ref={toRef} className="relative">
          <label className="text-sm text-gray-500 mb-1 block">Куда</label>
          <input
            placeholder="Введите город назначения"
            value={toQuery}
            onChange={(e) => handleToInput(e.target.value)}
            onFocus={() => toSuggestions.length > 0 && setShowToSuggestions(true)}
            className="p-4 rounded-xl w-full border"
          />
          {showToSuggestions && toSuggestions.length > 0 && (
            <div className="absolute z-10 bg-white border rounded-xl mt-1 w-full max-h-48 overflow-y-auto shadow-lg">
              {toSuggestions.map((city, i) => (
                <button
                  key={i}
                  onClick={() => selectTo(city)}
                  className="w-full text-left p-3 hover:bg-blue-50 border-b last:border-b-0"
                >
                  {city.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 3. Тип груза */}
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Тип груза</label>
          <select
            value={cargoType}
            onChange={(e) => {
              setCargoType(e.target.value);
              setShowResult(false);
            }}
            className="p-4 rounded-xl w-full"
          >
            <option value="pallet">Паллеты</option>
            <option value="truck">Полная фура (22т / 33 паллета)</option>
          </select>
        </div>

        {/* 4. Какой груз */}
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Вес (кг)</label>
          <input
            placeholder="Вес груза в кг"
            type="number"
            value={weight}
            onChange={(e) => {
              setWeight(e.target.value);
              setShowResult(false);
            }}
            className="p-4 rounded-xl w-full"
          />
        </div>

        {cargoType === "pallet" && (
          <div>
            <label className="text-sm text-gray-500 mb-1 block">Количество паллет</label>
            <input
              placeholder="Количество паллет"
              type="number"
              value={pallets}
              onChange={(e) => {
                setPallets(e.target.value);
                setShowResult(false);
              }}
              className="p-4 rounded-xl w-full"
            />
          </div>
        )}

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Описание груза</label>
          <input
            placeholder="Краткое описание груза"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-4 rounded-xl w-full"
          />
        </div>

        {/* 5. Оплата */}
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Способ оплаты</label>
          <select
            value={paymentType}
            onChange={(e) => {
              setPaymentType(e.target.value);
              setShowResult(false);
            }}
            className="p-4 rounded-xl w-full"
          >
            <option value="cash">Наличка (скидка 5%)</option>
            <option value="beznal">Безнал</option>
            <option value="beznal_nds">Безнал с НДС</option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-500 mb-1 block">Условия оплаты</label>
          <select
            value={paymentTerm}
            onChange={(e) => {
              setPaymentTerm(e.target.value);
              setShowResult(false);
            }}
            className="p-4 rounded-xl w-full"
          >
            <option value="100_prepay">100% предоплата (скидка 5%)</option>
            <option value="50_50">50% по загрузке + 50% в течение 3 дней</option>
            <option value="100_after">100% в течение 3 дней после выгрузки (+5%)</option>
          </select>
        </div>

        {/* Кнопка расчёта */}
        <button
          onClick={calculatePrice}
          className="bg-blue-600 text-white p-4 rounded-xl text-lg font-semibold"
        >
          Рассчитать стоимость
        </button>

        {/* Результат расчёта */}
        {showResult && distance !== null && price !== null && finalPrice !== null && (
          <div className="bg-white p-6 rounded-xl shadow-sm">
            <div className="text-center space-y-2">
              <div className="text-gray-500 text-sm">
                Расстояние: <span className="font-bold text-gray-900">{distance} км</span>
              </div>
              <div className="text-gray-500 text-sm">
                Базовая стоимость: <span className="font-bold text-gray-900">{price.toLocaleString()} ₽</span>
              </div>
              {discountPercent !== 0 && (
                <div className={`text-sm ${discountPercent > 0 ? "text-green-600" : "text-red-600"}`}>
                  {discountPercent > 0 ? "Скидка" : "Наценка"}: {Math.abs(discountPercent)}%
                </div>
              )}
              <div className="text-lg pt-2 border-t">
                Итого: <span className="font-bold text-green-600 text-2xl">{finalPrice.toLocaleString()} ₽</span>
              </div>
            </div>
            <button
              onClick={saveCargo}
              disabled={saving}
              className="bg-green-600 text-white p-4 rounded-xl w-full mt-4 text-lg font-semibold disabled:opacity-60"
            >
              {saving ? "Сохраняем..." : "Добавить груз к перевозке"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
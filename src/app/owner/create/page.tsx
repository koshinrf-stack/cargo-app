"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function CreateCargoPage() {
  const [cargoType, setCargoType] = useState("pallet");

  const [distance, setDistance] = useState("");
  const [weight, setWeight] = useState("");
  const [pallets, setPallets] = useState("");

  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");

  const [price, setPrice] = useState<number | null>(null);

  function calculatePrice() {
    const km = Number(distance);
    const kg = Number(weight);
    const palletCount = Number(pallets);

    let result = 0;

    if (cargoType === "pallet") {
      const palletWeight =
        palletCount > 0
          ? kg / palletCount
          : 0;

      if (palletWeight <= 600) {
        result =
          palletCount *
          2.58 *
          km;
      } else {
        const percent =
          kg / 22000;

        result =
          percent *
          85 *
          km;
      }
    }

    if (cargoType === "truck") {
      result = km * 85;
    }

    setPrice(
      Math.round(result)
    );
  }

  async function saveCargo() {
    const { error } =
      await supabase
        .from("shipments")
        .insert({
          cargo_type:
            cargoType,

          pallets_count:
            cargoType === "pallet"
              ? Number(pallets)
              : null,

          weight_kg:
            Number(weight),

          from_city:
            fromCity,

          to_city:
            toCity,

          price:
            price || 0,

          payment_type:
            "cash",

          payment_term:
            "immediate",

          status:
            "searching_carrier",
        });

    if (error) {
      console.error(error);

      alert(
        "Ошибка сохранения"
      );

      return;
    }

    alert(
      "Груз добавлен"
    );

    setDistance("");
    setWeight("");
    setPallets("");

    setFromCity("");
    setToCity("");

    setPrice(null);
  }

  return (
    <main className="
      min-h-screen
      bg-gray-100
      p-6
    ">

      <h1 className="
        text-3xl
        font-bold
        mb-8
      ">
        Добавление груза
      </h1>

      <div className="
        flex
        flex-col
        gap-4
      ">

        <select
          value={cargoType}
          onChange={(e) =>
            setCargoType(
              e.target.value
            )
          }
          className="
            p-4
            rounded-xl
          "
        >

          <option value="pallet">
            Паллеты
          </option>

          <option value="truck">
            Полная фура
          </option>

        </select>

        <input
          placeholder="
          Расстояние км
          "

          value={distance}

          onChange={(e) =>
            setDistance(
              e.target.value
            )
          }

          className="
            p-4
            rounded-xl
          "
        />

        <input
          placeholder="
          Вес кг
          "

          value={weight}

          onChange={(e) =>
            setWeight(
              e.target.value
            )
          }

          className="
            p-4
            rounded-xl
          "
        />

        {cargoType ===
          "pallet" && (

          <input
            placeholder="
            Количество паллет
            "

            value={pallets}

            onChange={(e) =>
              setPallets(
                e.target.value
              )
            }

            className="
              p-4
              rounded-xl
            "
          />

        )}

        <input
          placeholder="
          Откуда
          "

          value={fromCity}

          onChange={(e) =>
            setFromCity(
              e.target.value
            )
          }

          className="
            p-4
            rounded-xl
          "
        />

        <input
          placeholder="
          Куда
          "

          value={toCity}

          onChange={(e) =>
            setToCity(
              e.target.value
            )
          }

          className="
            p-4
            rounded-xl
          "
        />

        <button
          onClick={
            calculatePrice
          }

          className="
            bg-blue-600
            text-white
            p-4
            rounded-xl
          "
        >
          Рассчитать
        </button>

        <button
          onClick={
            saveCargo
          }

          className="
            bg-green-600
            text-white
            p-4
            rounded-xl
          "
        >
          Добавить груз
        </button>

        {price !== null && (

          <div className="
            bg-white
            p-6
            rounded-xl
            text-xl
            font-bold
          ">

            Стоимость:
            {" "}
            {price}
            ₽

          </div>

        )}

      </div>

    </main>
  );
}
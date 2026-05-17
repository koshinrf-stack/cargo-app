"use client";

import { useState } from "react";

export default function CreateCargoPage() {

  const [cargoType, setCargoType] = useState("pallet");

  const [distance, setDistance] = useState("");
  const [weight, setWeight] = useState("");
  const [pallets, setPallets] = useState("");

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

    if (
      cargoType === "truck"
    ) {

      result =
        km * 85;

    }

    setPrice(
      Math.round(result)
    );

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
          onChange={(e)=>
          setCargoType(
          e.target.value
          )}

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

          onChange={(e)=>
          setDistance(
          e.target.value
          )}

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

          onChange={(e)=>
          setWeight(
          e.target.value
          )}

          className="
          p-4
          rounded-xl
          "
        />

        {
          cargoType==="pallet"
          &&

          <input
            placeholder="
            Количество паллет
            "

            value={pallets}

            onChange={(e)=>
            setPallets(
            e.target.value
            )}

            className="
            p-4
            rounded-xl
            "
          />

        }

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

        {
          price!==null &&

          <div className="
          bg-white
          p-6
          rounded-xl
          text-xl
          font-bold
          ">

            Стоимость:
            {price}
            ₽

          </div>

        }

      </div>

    </main>

  );

}
"use client";

import { useState } from "react";

export default function CreateCargoPage() {

  const [cargoType, setCargoType] =
    useState("pallet");

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
          className="
          p-4
          rounded-xl
          "
          value={cargoType}

          onChange={(e)=>
            setCargoType(
              e.target.value
            )
          }
        >

          <option value="pallet">
            Паллеты
          </option>

          <option value="truck">
            Полная фура
          </option>

          <option value="20">
            Контейнер 20 футов
          </option>

          <option value="40">
            Контейнер 40 футов
          </option>

        </select>

        <input
          placeholder="Вес груза кг"
          className="
          p-4
          rounded-xl
          "
        />

        <input
          placeholder="Откуда"
          className="
          p-4
          rounded-xl
          "
        />

        <input
          placeholder="Куда"
          className="
          p-4
          rounded-xl
          "
        />

        <button
          className="
          bg-blue-600
          text-white
          p-4
          rounded-xl
          "
        >
          Рассчитать
        </button>

      </div>

    </main>

  );

}
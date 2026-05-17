"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { supabase } from "@/lib/supabase";
import { useTelegram } from "@/providers/TelegramProvider";

export default function RegisterOwner() {

  const router = useRouter();

  const { user } =
    useTelegram();

  const [
    company,
    setCompany
  ] = useState("");

  const [
    inn,
    setInn
  ] = useState("");

  const [
    phone,
    setPhone
  ] = useState("");

  const [
    city,
    setCity
  ] = useState("");

  async function finishRegistration() {

    if (!user?.id) {

      alert(
        "Telegram user not found"
      );

      return;

    }

    const { error } =
      await supabase

        .from("users")

        .insert({

          telegram_id:
            user.id,

          role:
            "owner",

          company_name:
            company,

          inn:
            inn,

          phone:
            phone,

          city:
            city,

        });

    if (error) {

      console.error(
        error
      );

      alert(
        JSON.stringify(
          error.message
        )
      );

      return;

    }

    alert(
      "Регистрация завершена"
    );

    router.push(
      "/owner"
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

        Регистрация грузовладельца

      </h1>

      <div className="
        flex
        flex-col
        gap-4
      ">

        <input
          placeholder="
          Название фирмы
          "

          value={company}

          onChange={(e)=>
            setCompany(
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
          ИНН
          "

          value={inn}

          onChange={(e)=>
            setInn(
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
          Телефон
          "

          value={phone}

          onChange={(e)=>
            setPhone(
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
          Город
          "

          value={city}

          onChange={(e)=>
            setCity(
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
            finishRegistration
          }

          className="
          bg-blue-600
          text-white
          p-4
          rounded-xl
          "

        >

          Завершить регистрацию

        </button>

      </div>

    </main>

  );

}
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useTelegram } from "@/providers/TelegramProvider";
import { getProfile } from "@/services/getProfile";

export default function OwnerPage() {

  const router = useRouter();

  const { user } =
    useTelegram();

  const [
    profile,
    setProfile
  ] = useState<any>(
    null
  );

  useEffect(() => {

    if (!user?.id)
      return;

    loadProfile();

  }, [user]);

  async function loadProfile() {

    const result =
      await getProfile(
        user!.id
      );

    if (
      result.error
    ) {

      console.error(
        result.error
      );

      return;

    }

    setProfile(
      result.data
    );

  }

  if (!profile) {

    return (

      <main className="
      min-h-screen
      bg-gray-100
      flex
      items-center
      justify-center
      ">

        <div className="
        text-2xl
        font-bold
        ">

          Загрузка...

        </div>

      </main>

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

        Кабинет грузовладельца

      </h1>

      <div className="
      bg-white
      rounded-2xl
      p-6
      mb-6
      shadow-sm
      ">

        <div className="
        text-gray-500
        text-sm
        mb-2
        ">

          Организация

        </div>

        <div className="
        text-2xl
        font-bold
        mb-5
        ">

          {
            profile.company_name
          }

        </div>

        <div className="
        flex
        items-center
        justify-between
        ">

          <span>

            Рейтинг

          </span>

          <b>

            {
              profile.rating
            }

            {" "}

            / 5

          </b>

        </div>

      </div>

      <div className="
      flex
      flex-col
      gap-4
      ">

        <button

        onClick={()=>

        router.push(
        "/owner/create"
        )

        }

        className="
        bg-blue-600
        text-white
        p-5
        rounded-2xl
        w-full
        text-lg
        font-semibold
        "

        >

          Добавить груз

        </button>

        <button

        onClick={()=>

        router.push(
        "/owner/cargo"
        )

        }

        className="
        bg-white
        border
        p-5
        rounded-2xl
        w-full
        text-lg
        "

        >

          Мои грузы

        </button>

        <button

        onClick={()=>

        router.push(
        "/owner/carriers"
        )

        }

        className="
        bg-white
        border
        p-5
        rounded-2xl
        w-full
        text-lg
        "

        >

          Перевозчики

        </button>

      <button
  onClick={() => router.push("/owner/history")}
  className="bg-white border p-5 rounded-2xl w-full text-lg"
>
  История заказов
</button>

      </div>

    </main>

  );

}
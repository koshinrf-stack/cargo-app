"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useTelegram } from "@/providers/TelegramProvider";
import { checkUser } from "@/services/checkUser";

export default function Home() {
  const router = useRouter();

  const { user } =
    useTelegram();

  useEffect(() => {

    if (!user?.id)
      return;

    loadUser();

  }, [user]);

  async function loadUser() {

    const result =
      await checkUser(
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

    if (
      !result.data
    ) {

      router.push(
        "/register"
      );

      return;

    }

    if (
      result.data.role ===
      "owner"
    ) {

      router.push(
        "/owner"
      );

      return;

    }

    if (
      result.data.role ===
      "carrier"
    ) {

      router.push(
        "/carrier"
      );

      return;

    }

    router.push(
      "/register"
    );

  }

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
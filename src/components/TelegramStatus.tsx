"use client";

import { useTelegram } from "@/providers/TelegramProvider";

export default function TelegramStatus() {
  const { isTelegram, user } = useTelegram();

  return (
    <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-4">
      <div className="text-sm text-gray-500">Telegram</div>
      <div className="mt-1 text-base font-semibold text-gray-900">
        {isTelegram
          ? user
            ? `User ID: ${user.id}`
            : "Ожидание данных Telegram..."
          : "Открой приложение внутри Telegram"}
      </div>
      {user?.username && (
        <div className="mt-1 text-sm text-gray-500">@{user.username}</div>
      )}
    </div>
  );
}
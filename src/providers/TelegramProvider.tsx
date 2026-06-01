"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { telegramAuth } from "@/services/telegramAuth";

type TelegramUser = {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
};

type TelegramContextValue = {
  isTelegram: boolean;
  ready: boolean;
  user: TelegramUser | null;
};

const TelegramContext = createContext<TelegramContextValue>({
  isTelegram: false,
  ready: false,
  user: null,
});

export function useTelegram() {
  return useContext(TelegramContext);
}

export default function TelegramProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isTelegram, setIsTelegram] = useState(false);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const tg = window?.Telegram?.WebApp;

    if (!tg) {
      setReady(true);
      return;
    }

    try {
      tg.ready();
      setIsTelegram(true);
      setReady(true);

      const telegramUser = tg.initDataUnsafe?.user;

      if (telegramUser) {
        setUser({
          id: telegramUser.id,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          username: telegramUser.username,
          language_code: telegramUser.language_code,
        });

        telegramAuth(telegramUser).catch((err: unknown) => {
          if (err instanceof Error) {
            console.error("Ошибка аутентификации:", err.message);
          } else {
            console.error("Неизвестная ошибка аутентификации");
          }
        });
      }
    } catch (error) {
      console.error("Ошибка инициализации Telegram:", error);
      setReady(true);
    }
  }, []);

  const value = useMemo(
    () => ({ isTelegram, ready, user }),
    [isTelegram, ready, user]
  );

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}
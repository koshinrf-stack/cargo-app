"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type TelegramUser = {
  id: number;
  first_name?: string;
  username?: string;
};

type TelegramContextValue = {
  user: TelegramUser | null;
  isTelegram: boolean;
};

const TelegramContext = createContext<TelegramContextValue>({
  user: null,
  isTelegram: false,
});

export function useTelegram() {
  return useContext(TelegramContext);
}

export default function TelegramProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isTelegram, setIsTelegram] = useState(false);

  useEffect(() => {
    setMounted(true);

    const tg = (window as any).Telegram?.WebApp;

    if (tg) {
      tg.ready();

      setIsTelegram(true);

      const telegramUser = tg.initDataUnsafe?.user;

      if (telegramUser) {
        setUser({
          id: telegramUser.id,
          first_name: telegramUser.first_name,
          username: telegramUser.username,
        });
      }
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isTelegram,
    }),
    [user, isTelegram]
  );

  if (!mounted) {
    return null;
  }

  return (
    <TelegramContext.Provider value={value}>
      {children}
    </TelegramContext.Provider>
  );
}
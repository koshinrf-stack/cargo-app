import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

import TelegramProvider from "../providers/TelegramProvider";

export const metadata: Metadata = {
  title: "Cargo App",
  description: "Cargo transportation app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
      </head>
      <body>
        <TelegramProvider>{children}</TelegramProvider>
      </body>
    </html>
  );
}
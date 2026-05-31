import type { Metadata } from "next";
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
        <script
          src="https://telegram.org/js/telegram-web-app.js"
          async
        />
      </head>
      <body>
        <TelegramProvider>{children}</TelegramProvider>
      </body>
    </html>
  );
}
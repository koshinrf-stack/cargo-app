"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="absolute bottom-4 left-4 text-sm bg-gray-200 text-gray-800 px-3 py-2 rounded-xl"
      style={{ fontSize: '0.8rem' }}
    >
      ← Назад
    </button>
  );
}
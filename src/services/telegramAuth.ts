export async function telegramAuth(telegramUser: {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}) {
  try {
    const response = await fetch("/api/auth/telegram", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user: telegramUser }),
    });

    if (!response.ok) {
      throw new Error("Ошибка авторизации");
    }

    return await response.json();
  } catch (error) {
    console.error("Ошибка отправки данных пользователя:", error);
    throw error;
  }
}
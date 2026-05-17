export async function telegramAuth(user: any) {

  const response = await fetch(
    "/api/telegram/auth",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        user,
      }),
    }
  );

  return response.json();
}
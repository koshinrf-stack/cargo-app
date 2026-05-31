import { supabase } from "@/lib/supabase";

export async function getProfile(
  telegramId: number
) {

  const {
    data,
    error
  } = await supabase

    .from(
      "users"
    )

    .select("*")

    .eq(
      "telegram_id",
      telegramId
    )

    .maybeSingle();

  return {
    data,
    error,
  };

}
import { supabase } from "@/lib/supabase";

export async function checkUser(telegramId: number) {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  return { data, error };
}
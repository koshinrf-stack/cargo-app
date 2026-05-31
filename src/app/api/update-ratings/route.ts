import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    if (!supabaseServiceKey) {
      return NextResponse.json(
        { error: "Service key not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Находим необработанные оценки старше 48 часов
    const twoDaysAgo = new Date();
    twoDaysAgo.setHours(twoDaysAgo.getHours() - 48);

    const { data: pendingRatings, error: selectError } = await supabase
      .from("ratings")
      .select("*")
      .eq("applied", false)
      .lte("created_at", twoDaysAgo.toISOString());

    if (selectError) {
      console.error("Select error:", selectError);
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (!pendingRatings || pendingRatings.length === 0) {
      return NextResponse.json({ message: "No pending ratings" });
    }

    // Группируем оценки по пользователям
    const userRatings: Record<string, number[]> = {};
    const ratingIds: string[] = [];

    pendingRatings.forEach((r) => {
      if (!userRatings[r.to_user_id]) {
        userRatings[r.to_user_id] = [];
      }
      userRatings[r.to_user_id].push(r.rating);
      ratingIds.push(r.id);
    });

    // Обновляем рейтинг каждого пользователя
    for (const [userId, ratings] of Object.entries(userRatings)) {
      const avgRating =
        ratings.reduce((sum, r) => sum + r, 0) / ratings.length;

      const { data: user } = await supabase
        .from("users")
        .select("rating")
        .eq("id", userId)
        .single();

      const oldRating = user?.rating || 0;
      const oldCount = Math.max(1, ratings.length);
      const newRating =
        (oldRating * oldCount + avgRating * ratings.length) /
        (oldCount + ratings.length);

      await supabase
        .from("users")
        .update({ rating: Math.round(newRating * 10) / 10 })
        .eq("id", userId);
    }

    // Помечаем оценки как применённые
    await supabase
      .from("ratings")
      .update({ applied: true })
      .in("id", ratingIds);

    return NextResponse.json({
      success: true,
      processed: ratingIds.length,
    });
  } catch (error) {
    console.error("Update ratings error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
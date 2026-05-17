import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const user = body.user;

    if (!user?.id) {
      return NextResponse.json(
        { error: "No telegram user" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      telegramId: user.id,
      username: user.username,
      firstName: user.first_name,
    });

  } catch (error) {
    return NextResponse.json(
      { error: "Auth failed" },
      { status: 500 }
    );
  }
}
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const user = await prisma.user.findFirst();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Merge existing preferences with new ones
    const existingPrefs = JSON.parse(user.preferences || "{}");
    const updatedPrefs = { ...existingPrefs, ...body };

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { preferences: JSON.stringify(updatedPrefs) },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

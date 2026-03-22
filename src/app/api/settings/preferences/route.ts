import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const user = await prisma.user.findFirst();

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const allowedKeys = new Set(["notifications", "emailDigest", "darkMode", "currency"]);
    const existingPrefs = JSON.parse(user.preferences || "{}");
    const updatedPrefs = { ...existingPrefs };

    // Supports both payload styles:
    // 1) { key: "notifications", value: true }
    // 2) { notifications: true }
    if (typeof body?.key === "string") {
      if (!allowedKeys.has(body.key)) {
        return NextResponse.json({ error: "Invalid preference key" }, { status: 400 });
      }
      updatedPrefs[body.key] = body.value;
    } else {
      for (const [k, v] of Object.entries(body || {})) {
        if (allowedKeys.has(k)) {
          updatedPrefs[k] = v;
        }
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: { preferences: JSON.stringify(updatedPrefs) },
    });

    return NextResponse.json({
      ...updatedUser,
      preferences: updatedPrefs,
    });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

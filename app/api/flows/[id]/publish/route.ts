import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const THEME_KEYS = ["primaryColor", "backgroundColor", "textColor"] as const;
const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// Returns an error message if theme is invalid, or null if it's absent/valid.
function validateTheme(theme: unknown): string | null {
  if (theme === undefined || theme === null) return null;
  if (typeof theme !== "object" || Array.isArray(theme)) {
    return "theme must be an object of hex-color strings";
  }
  for (const [key, value] of Object.entries(theme)) {
    if (!THEME_KEYS.includes(key as (typeof THEME_KEYS)[number])) {
      return `unknown theme field: ${key}`;
    }
    if (typeof value !== "string" || !HEX_COLOR.test(value)) {
      return `theme.${key} must be a hex color like #1a1a1a`;
    }
  }
  return null;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify flow exists and belongs to user
    const flow = await prisma.flow.findFirst({
      where: { id, orgId: session.user.orgId },
    });

    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    // Get the request body
    const { config, theme } = await request.json();

    if (!config || !Array.isArray(config)) {
      return NextResponse.json(
        { error: "config must be an array of steps" },
        { status: 400 }
      );
    }

    // theme is optional; when present it must be an object of hex-color strings
    const themeError = validateTheme(theme);
    if (themeError) {
      return NextResponse.json({ error: themeError }, { status: 400 });
    }

    // Get the next version number
    const latestVersion = await prisma.flowVersion.findFirst({
      where: { flowId: id },
      orderBy: { versionNum: "desc" },
    });

    const nextVersionNum = (latestVersion?.versionNum || 0) + 1;

    // Create new flow version (append-only)
    const version = await prisma.flowVersion.create({
      data: {
        flowId: id,
        versionNum: nextVersionNum,
        config: config,
        theme: theme ?? undefined, // null/absent → column stays NULL (SDK defaults)
        publishedAt: new Date(),
      },
      select: {
        id: true,
        versionNum: true,
        config: true,
        theme: true,
        publishedAt: true,
      },
    });

    // Update flow status to 'live'
    await prisma.flow.update({
      where: { id },
      data: { status: "live" },
    });

    return NextResponse.json(version, { status: 201 });
  } catch (error) {
    console.error("POST /api/flows/[id]/publish error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

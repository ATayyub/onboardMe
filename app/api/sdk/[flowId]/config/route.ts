import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCorsHeaders } from "@/lib/cors";

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  // For preflight we don't know the org yet — allow all (browser will validate on actual request)
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      ...(origin ? { "Vary": "Origin" } : {}),
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  const { flowId } = await params;
  const requestOrigin = request.headers.get("origin");

  try {
    const flow = await prisma.flow.findUnique({
      where: { id: flowId },
      select: {
        id: true,
        name: true,
        status: true,
        organisation: { select: { allowedDomains: true } },
      },
    });

    const corsHeaders = buildCorsHeaders(
      flow?.organisation?.allowedDomains ?? "[]",
      requestOrigin
    );

    if (!flow || flow.status !== "live") {
      return NextResponse.json(
        { error: "Flow not found or not live" },
        { status: 404, headers: corsHeaders }
      );
    }

    const latestVersion = await prisma.flowVersion.findFirst({
      where: { flowId },
      orderBy: { versionNum: "desc" },
      select: { id: true, versionNum: true, config: true, theme: true, publishedAt: true },
    });

    if (!latestVersion) {
      return NextResponse.json(
        { error: "No published version found" },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        id: flow.id,
        name: flow.name,
        version: latestVersion.versionNum,
        config: latestVersion.config,
        theme: latestVersion.theme ?? null,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error("GET /api/sdk/[flowId]/config error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

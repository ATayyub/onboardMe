import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildCorsHeaders } from "@/lib/cors";

// Max events accepted per flow per 60-second window
const RATE_LIMIT_MAX = 200;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      ...(origin ? { "Vary": "Origin" } : {}),
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  const { flowId } = await params;
  const requestOrigin = request.headers.get("origin");

  try {
    const { eventType, stepIndex, url, userId } = await request.json();

    if (!eventType) {
      return NextResponse.json(
        { error: "eventType is required" },
        { status: 400 }
      );
    }

    const flow = await prisma.flow.findUnique({
      where: { id: flowId },
      select: {
        id: true,
        organisation: { select: { allowedDomains: true } },
      },
    });

    const corsHeaders = buildCorsHeaders(
      flow?.organisation?.allowedDomains ?? "[]",
      requestOrigin,
      "POST, OPTIONS"
    );

    if (!flow) {
      return NextResponse.json(
        { error: "Flow not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    // Rate limit: count events for this flow in the last 60 seconds
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    const recentCount = await prisma.analyticsEvent.count({
      where: { flowId, createdAt: { gte: windowStart } },
    });

    if (recentCount >= RATE_LIMIT_MAX) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429, headers: corsHeaders }
      );
    }

    const event = await prisma.analyticsEvent.create({
      data: {
        flowId,
        eventType,
        stepIndex: stepIndex ?? null,
        url: url ?? null,
        userId: userId ?? null,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json(event, { status: 201, headers: corsHeaders });
  } catch (error) {
    console.error("POST /api/sdk/[flowId]/events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  const { flowId } = await params;

  try {
    const { eventType, stepIndex, url, userId } = await request.json();

    if (!eventType) {
      return NextResponse.json(
        { error: "eventType is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Verify flow exists
    const flow = await prisma.flow.findUnique({
      where: { id: flowId },
      select: { id: true },
    });

    if (!flow) {
      return NextResponse.json(
        { error: "Flow not found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Record the event
    const event = await prisma.analyticsEvent.create({
      data: {
        flowId,
        eventType,
        stepIndex: stepIndex || null,
        url: url || null,
        userId: userId || null,
      },
      select: { id: true, createdAt: true },
    });

    return NextResponse.json(event, { status: 201, headers: CORS_HEADERS });
  } catch (error) {
    console.error("POST /api/sdk/[flowId]/events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

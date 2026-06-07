import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: CORS_HEADERS });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flowId: string }> }
) {
  const { flowId } = await params;

  try {
    // Get the flow
    const flow = await prisma.flow.findUnique({
      where: { id: flowId },
      select: { id: true, name: true, status: true },
    });

    if (!flow || flow.status !== "live") {
      return NextResponse.json(
        { error: "Flow not found or not live" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    // Get the latest published version
    const latestVersion = await prisma.flowVersion.findFirst({
      where: { flowId },
      orderBy: { versionNum: "desc" },
      select: { id: true, versionNum: true, config: true, publishedAt: true },
    });

    if (!latestVersion) {
      return NextResponse.json(
        { error: "No published version found" },
        { status: 404, headers: CORS_HEADERS }
      );
    }

    return NextResponse.json(
      {
        id: flow.id,
        name: flow.name,
        version: latestVersion.versionNum,
        config: latestVersion.config,
      },
      { status: 200, headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("GET /api/sdk/[flowId]/config error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

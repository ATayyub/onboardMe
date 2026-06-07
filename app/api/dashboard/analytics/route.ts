import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const flowId = searchParams.get("flowId");

    if (!flowId) {
      return NextResponse.json({ error: "flowId is required" }, { status: 400 });
    }

    // Verify flow belongs to user
    const flow = await prisma.flow.findFirst({
      where: { id: flowId, orgId: session.user.orgId },
    });

    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    // Get analytics events for this flow
    const events = await prisma.analyticsEvent.findMany({
      where: { flowId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: { id: true, eventType: true, stepIndex: true, userId: true, url: true, createdAt: true },
    });

    // Calculate summary stats
    const summary = {
      totalEvents: events.length,
      flowStarted: events.filter((e) => e.eventType === "flow_started").length,
      stepViewed: events.filter((e) => e.eventType === "step_viewed").length,
      flowCompleted: events.filter((e) => e.eventType === "flow_completed").length,
      uniqueUsers: new Set(events.map((e) => e.userId).filter(Boolean)).size,
    };

    return NextResponse.json({ summary, events }, { status: 200 });
  } catch (error) {
    console.error("GET /api/dashboard/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

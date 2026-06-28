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
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const skip = (page - 1) * limit;

    if (!flowId) {
      return NextResponse.json({ error: "flowId is required" }, { status: 400 });
    }

    // Verify flow belongs to this org
    const flow = await prisma.flow.findFirst({
      where: { id: flowId, orgId: session.user.orgId },
    });

    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    // Paginated events + total count
    const [events, total] = await Promise.all([
      prisma.analyticsEvent.findMany({
        where: { flowId },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        select: {
          id: true,
          eventType: true,
          stepIndex: true,
          userId: true,
          url: true,
          createdAt: true,
        },
      }),
      prisma.analyticsEvent.count({ where: { flowId } }),
    ]);

    // Summary stats — always count all events, not just the current page
    const [started, stepped, completed, uniqueUsers] = await Promise.all([
      prisma.analyticsEvent.count({ where: { flowId, eventType: "flow_started" } }),
      prisma.analyticsEvent.count({ where: { flowId, eventType: "step_viewed" } }),
      prisma.analyticsEvent.count({ where: { flowId, eventType: "flow_completed" } }),
      prisma.analyticsEvent.findMany({
        where: { flowId, userId: { not: null } },
        select: { userId: true },
        distinct: ["userId"],
      }),
    ]);

    // Funnel: get step views by index + latest flow config for labels
    const [stepViewsByIndex, latestVersion] = await Promise.all([
      prisma.analyticsEvent.groupBy({
        by: ["stepIndex"],
        where: { flowId, eventType: "step_viewed", stepIndex: { not: null } },
        _count: { _all: true },
        orderBy: { stepIndex: "asc" },
      }),
      prisma.flowVersion.findFirst({
        where: { flowId },
        orderBy: { versionNum: "desc" },
        select: { config: true },
      }),
    ]);

    interface StepConfig { id: string; title: string; description: string }
    const stepConfig: StepConfig[] = Array.isArray(latestVersion?.config)
      ? (latestVersion.config as unknown as StepConfig[])
      : [];

    // Build funnel steps for indices 1..N (step 0 = flow_started, already shown)
    const funnelSteps = stepViewsByIndex
      .filter((s) => s.stepIndex !== null && s.stepIndex > 0)
      .map((s) => {
        const idx = s.stepIndex as number;
        const label = stepConfig[idx]?.title
          ? `Step ${idx + 1}: ${stepConfig[idx].title}`
          : `Step ${idx + 1}`;
        return {
          stepIndex: idx,
          label,
          count: s._count._all,
          rate: started > 0 ? s._count._all / started : 0,
        };
      });

    const funnel = started > 0
      ? {
          started,
          steps: funnelSteps,
          completed,
          completionRate: started > 0 ? completed / started : 0,
        }
      : null;

    return NextResponse.json(
      {
        summary: {
          totalEvents: total,
          flowStarted: started,
          stepViewed: stepped,
          flowCompleted: completed,
          uniqueUsers: uniqueUsers.length,
        },
        events,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        funnel,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/dashboard/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
  const userEmail = session.user.email?.toLowerCase().trim();
  if (!adminEmail || !userEmail || userEmail !== adminEmail) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    // Get all orgs with flow counts
    const orgs = await prisma.organisation.findMany({
      include: {
        _count: {
          select: { flows: true },
        },
        flows: {
          select: { id: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Enrich with event counts per org
    const enrichedOrgs = await Promise.all(
      orgs.map(async (org) => {
        const liveFlowCount = org.flows.filter((f) => f.status === "live").length;
        const flowIds = org.flows.map((f) => f.id);

        const eventCount = await prisma.analyticsEvent.count({
          where: {
            flowId: {
              in: flowIds,
            },
          },
        });

        return {
          id: org.id,
          email: org.email,
          name: org.name,
          createdAt: org.createdAt,
          flowCount: org._count.flows,
          liveFlowCount,
          totalEvents: eventCount,
        };
      })
    );

    // Calculate aggregates
    const totalOrgs = orgs.length;
    const totalFlows = orgs.reduce((sum, org) => sum + org._count.flows, 0);
    const totalEvents = enrichedOrgs.reduce((sum, org) => sum + org.totalEvents, 0);

    return NextResponse.json(
      {
        totalOrgs,
        totalFlows,
        totalEvents,
        orgs: enrichedOrgs,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/admin/orgs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

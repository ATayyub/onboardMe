import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const { config } = await request.json();
    
    if (!config || !Array.isArray(config)) {
      return NextResponse.json(
        { error: "config must be an array of steps" },
        { status: 400 }
      );
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
        publishedAt: new Date(),
      },
      select: {
        id: true,
        versionNum: true,
        config: true,
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

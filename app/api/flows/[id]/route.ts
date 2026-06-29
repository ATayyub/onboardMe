import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const flow = await prisma.flow.findFirst({
      where: { id, orgId: session.user.orgId },
      select: { id: true, name: true, status: true, createdAt: true },
    });

    if (!flow) {
      return NextResponse.json({ error: "Flow not found" }, { status: 404 });
    }

    // Load the latest published version's steps + theme so the editor can show them
    const latestVersion = await prisma.flowVersion.findFirst({
      where: { flowId: id },
      orderBy: { versionNum: "desc" },
      select: { config: true, theme: true },
    });

    return NextResponse.json(
      { ...flow, config: latestVersion?.config ?? [], theme: latestVersion?.theme ?? null },
      { status: 200 }
    );
  } catch (error) {
    console.error("GET /api/flows/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Verify ownership
    const owned = await prisma.flow.findFirst({
      where: { id, orgId: session.user.orgId },
    });
    if (!owned) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, status } = await request.json();
    
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (status !== undefined) updates.status = status;

    const flow = await prisma.flow.update({
      where: { id },
      data: updates,
      select: { id: true, name: true, status: true, createdAt: true },
    });

    return NextResponse.json(flow, { status: 200 });
  } catch (error) {
    console.error("PUT /api/flows/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

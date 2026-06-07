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
    const flows = await prisma.flow.findMany({
      where: { orgId: session.user.orgId },
      select: { id: true, name: true, status: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(flows, { status: 200 });
  } catch (error) {
    console.error("GET /api/flows error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name } = await request.json();
    
    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "name is required and must be a string" },
        { status: 400 }
      );
    }

    const flow = await prisma.flow.create({
      data: {
        orgId: session.user.orgId,
        name,
        status: "draft",
      },
      select: { id: true, name: true, status: true, createdAt: true },
    });

    return NextResponse.json(flow, { status: 201 });
  } catch (error) {
    console.error("POST /api/flows error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

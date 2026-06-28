import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_ORIGIN = /^https?:\/\/[a-zA-Z0-9][a-zA-Z0-9\-.]*(\:\d+)?$/;

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const org = await prisma.organisation.findUnique({
    where: { id: session.user.orgId },
    select: { allowedDomains: true },
  });

  let domains: string[] = [];
  try {
    domains = JSON.parse(org?.allowedDomains || "[]");
  } catch {
    domains = [];
  }

  return NextResponse.json({ domains });
}

export async function PUT(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { domains } = body;

  if (!Array.isArray(domains)) {
    return NextResponse.json({ error: "domains must be an array" }, { status: 400 });
  }

  if (domains.length > 20) {
    return NextResponse.json({ error: "Maximum 20 allowed domains" }, { status: 400 });
  }

  const invalid = domains.filter((d) => typeof d !== "string" || !VALID_ORIGIN.test(d));
  if (invalid.length > 0) {
    return NextResponse.json(
      { error: `Invalid origin format: ${invalid[0]}. Use https://yourdomain.com` },
      { status: 400 }
    );
  }

  await prisma.organisation.update({
    where: { id: session.user.orgId },
    data: { allowedDomains: JSON.stringify(domains) },
  });

  return NextResponse.json({ ok: true });
}

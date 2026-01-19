import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const event = await verifyWebhook(req);
    if (event.type === "user.created") {
      const user = event.data;
      await prisma.user.create({
        data: {
          clerkId: user.id,
          email: user.email_addresses?.[0]?.email_address ?? "",
          name: user.first_name ?? "",
        },
      });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ err }, { status: 500 });
  }
}

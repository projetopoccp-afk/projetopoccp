import { NextResponse } from "next/server";
import { processDropDraw } from "../../../../lib/drops/processDropDraw";

type DrawDropBody = {
  dropId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as DrawDropBody;
    const dropId = String(body.dropId || "").trim();

    const result = await processDropDraw(dropId);

    return NextResponse.json(result.ok ? result : { error: result.error }, {
      status: result.status,
    });
  } catch (error) {
    console.error("Drop draw unexpected error:", error);

    return NextResponse.json({ error: "unexpected_error" }, { status: 500 });
  }
}

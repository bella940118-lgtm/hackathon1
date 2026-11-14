import { NextResponse } from "next/server";
import { mockReceipt } from "@/lib/receipt/mock";

/** Returns demo data so receipt flows can be developed without credentials. */
export function GET() {
  return NextResponse.json(mockReceipt);
}

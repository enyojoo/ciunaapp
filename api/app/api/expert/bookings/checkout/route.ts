import { NextResponse } from "next/server"
export async function POST() {
  return NextResponse.json(
    { error: "Use the marketplace preview and checkout contract.", errorCode: "CHECKOUT_CONTRACT_CHANGED" },
    { status: 410 },
  )
}

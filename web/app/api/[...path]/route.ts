import { joinApiPath } from "@ciuna/shared"
import { type NextRequest, NextResponse } from "next/server"

async function redirectToApi(request: NextRequest, path: string[] | undefined) {
  const suffix = (path || []).join("/")
  const dest = new URL(joinApiPath(suffix ? `/api/${suffix}` : "/api"))
  dest.search = request.nextUrl.search
  return NextResponse.redirect(dest, 308)
}

type Ctx = { params: Promise<{ path?: string[] }> }

export async function GET(request: NextRequest, ctx: Ctx) {
  return redirectToApi(request, (await ctx.params).path)
}
export async function POST(request: NextRequest, ctx: Ctx) {
  return redirectToApi(request, (await ctx.params).path)
}
export async function PUT(request: NextRequest, ctx: Ctx) {
  return redirectToApi(request, (await ctx.params).path)
}
export async function PATCH(request: NextRequest, ctx: Ctx) {
  return redirectToApi(request, (await ctx.params).path)
}
export async function DELETE(request: NextRequest, ctx: Ctx) {
  return redirectToApi(request, (await ctx.params).path)
}
export async function OPTIONS(request: NextRequest, ctx: Ctx) {
  return redirectToApi(request, (await ctx.params).path)
}

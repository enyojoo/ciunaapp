import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase"
import { LoginAttemptService } from "@/lib/login-attempts"
import { getSecuritySettings } from "@/lib/security-settings"
import { getClientIp, getClientUserAgent } from "@/lib/request-client-meta"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const emailTrimmed = typeof email === "string" ? email.trim() : ""
    if (!emailTrimmed) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const ipAddress = getClientIp(request)
    const userAgent = getClientUserAgent(request)

    const lockStatus = await LoginAttemptService.isAccountLocked(emailTrimmed)
    if (lockStatus.locked) {
      return NextResponse.json(
        {
          error: `Account is temporarily locked. Please try again in ${lockStatus.remainingTime} minutes.`,
        },
        { status: 423 },
      )
    }

    const security = await getSecuritySettings()
    if (password.length < security.passwordMinLength) {
      return NextResponse.json({ error: "Password does not meet security requirements." }, { status: 400 })
    }

    console.log("Admin login attempt for:", emailTrimmed)

    // First authenticate with regular client to get the user
    const { createClient } = await import('@supabase/supabase-js')
    const authClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify password with regular auth client
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: emailTrimmed,
      password,
    })

    if (authError) {
      console.log("Password verification failed:", authError)
      await LoginAttemptService.recordAttempt(emailTrimmed, false, ipAddress, userAgent)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    if (!authData.user) {
      await LoginAttemptService.recordAttempt(emailTrimmed, false, ipAddress, userAgent)
      return NextResponse.json({ error: "Authentication failed" }, { status: 401 })
    }

    console.log("User authenticated:", { id: authData.user.id, email: authData.user.email })

    // Now check if this user is an admin using service role
    const serverClient = createServerClient()
    const { data: adminUser, error: adminError } = await serverClient
      .from("admin_users")
      .select("*")
      .eq("id", authData.user.id)  // Check by user ID, not email
      .single()

    console.log("Admin user check:", { 
      userId: authData.user.id,
      email: emailTrimmed, 
      adminError, 
      adminUser: adminUser ? {
        id: adminUser.id,
        email: adminUser.email,
        role: adminUser.role,
        status: adminUser.status
      } : null
    })

    if (adminError || !adminUser) {
      console.log("Admin user not found for user ID:", authData.user.id, adminError)
      await authClient.auth.signOut()
      return NextResponse.json({ error: "Access denied. Admin privileges required." }, { status: 403 })
    }

    // Check if admin user is active (if status field exists)
    if (adminUser.status && adminUser.status !== "active") {
      console.log("Admin user is not active:", adminUser.status)
      await authClient.auth.signOut()
      return NextResponse.json({ error: "Admin account is not active." }, { status: 403 })
    }

    // Update user metadata to mark as admin
    const { error: updateError } = await authClient.auth.updateUser({
      data: {
        isAdmin: true,
        role: adminUser.role,
        name: adminUser.name
      }
    })

    if (updateError) {
      console.error("Failed to update user metadata:", updateError)
      // Continue anyway, the session is still valid
    }

    console.log("Admin login successful for:", emailTrimmed)
    console.log("Session data:", {
      access_token: authData.session?.access_token ? "Present" : "Missing",
      refresh_token: authData.session?.refresh_token ? "Present" : "Missing",
      expires_at: authData.session?.expires_at
    })

    await LoginAttemptService.recordAttempt(emailTrimmed, true, ipAddress, userAgent)
    await LoginAttemptService.clearFailedAttempts(emailTrimmed)

    // Return the session data with admin flag
    return NextResponse.json({
      success: true,
      user: {
        id: adminUser.id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
      },
      session: authData.session,
      isAdmin: true
    })
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

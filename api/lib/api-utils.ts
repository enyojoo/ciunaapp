/**
 * API utility functions
 * Re-exports common utilities for API routes
 */

import { type NextRequest } from "next/server"
import { withErrorHandling as authWithErrorHandling } from "./auth-utils"

/**
 * Wrap API handler with error handling
 * Re-exported from auth-utils for convenience
 */
export function withErrorHandling(handler: (request: NextRequest, context?: any) => Promise<Response>) {
  return authWithErrorHandling(handler)
}


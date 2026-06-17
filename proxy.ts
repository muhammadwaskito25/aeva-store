import { type NextRequest } from "next/server"
import { updateSession } from "@/lib/supabase/middleware"

export async function proxy(request: NextRequest) {
    return updateSession(request)
}

export const config = {
    matcher: [
        "/admin/:path*",
        "/account/:path*",
        "/checkout/:path*",
        "/checkout",
        "/login",
        "/signup",
        "/forgot-password",
    ],
}
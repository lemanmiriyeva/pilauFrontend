'use server'
import {cookies} from "next/headers";
import {handleError} from "@/app/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {PENDING_2FA_COOKIE} from "@/components/constants";

export async function POST() {
    const pending = cookies().get(PENDING_2FA_COOKIE)
    if (!pending?.value) {
        return Response.json({detail: "Sessiya bitib, yenidən daxil olun."}, {status: 401})
    }
    try {
        const res = await fetch(DJANGO_API_ENDPOINTS.AUTHENTICATION.TOTP_SETUP_BEGIN, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
            body: JSON.stringify({temp_token: pending.value}),
        })
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

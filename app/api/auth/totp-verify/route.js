'use server'
import {cookies} from "next/headers";
import {handleError} from "@/app/utils";
import {setTokenCookies} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {PENDING_2FA_COOKIE} from "@/components/constants";

export async function POST(req) {
    const cookieStore = await cookies()
    const pending = cookieStore.get(PENDING_2FA_COOKIE)

    if (!pending?.value) {
        return Response.json({detail: "Sessiya bitib, yenidən daxil olun."}, {status: 401})
    }

    const {code} = await req.json()

    try {
        const res = await fetch(DJANGO_API_ENDPOINTS.AUTHENTICATION.TOTP_VERIFY, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
            body: JSON.stringify({temp_token: pending.value, code}),
        })
        const data = await res.json()

        if (res.status === 200 && data.access && data.refresh) {
            await setTokenCookies(data.access, data.refresh)

            cookieStore.delete(PENDING_2FA_COOKIE)

            return Response.json({user: data.user}, {status: 200})
        }
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}
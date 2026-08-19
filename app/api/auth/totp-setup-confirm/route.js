'use server'
import {cookies} from "next/headers";
import {handleError} from "@/app/utils";
import {setTokenCookies} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {PENDING_2FA_COOKIE} from "@/components/constants";

export async function POST(req) {
    const pending = cookies().get(PENDING_2FA_COOKIE)
    if (!pending?.value) {
        return Response.json({detail: "Sessiya bitib, yenidən daxil olun."}, {status: 401})
    }
    const {code} = await req.json()
    try {
        const res = await fetch(DJANGO_API_ENDPOINTS.AUTHENTICATION.TOTP_SETUP_CONFIRM, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
            body: JSON.stringify({temp_token: pending.value, code}),
        })
        const data = await res.json()

        if (res.status === 200 && data.step === 'password_change_required' && data.temp_token) {
            // 2FA tesdiqlendi, amma bu ilk giriş idi - istifadəçi indi öz yeni şifrəsini təyin etməlidir.
            // Novbeti addim ucun temp_token-i eyni cookie-de (yeni purpose ile) saxlayirig.
            cookies().set(PENDING_2FA_COOKIE, data.temp_token, {
                // secure: process.env.NODE_ENV === 'production',
                secure:false,
                httpOnly: true,
                sameSite: 'lax',
                path: '/',
                maxAge: 300,
            })
            return Response.json({step: data.step, backup_codes: data.backup_codes}, {status: 200})
        }

        if (res.status === 200 && data.access && data.refresh) {
            await setTokenCookies(data.access, data.refresh)
            cookies().delete(PENDING_2FA_COOKIE)
            return Response.json({step: 'done', backup_codes: data.backup_codes, user: data.user}, {status: 200})
        }
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

'use server'
import {cookies} from "next/headers";
import {handleError} from "@/app/utils";
import {setTokenCookies} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {PENDING_2FA_COOKIE} from "@/components/constants";

// İlk giriş: istifadəçi 2FA-nı təsdiqlədikdən SONRA (bax /2fa-qurulmasi, totp-setup-confirm)
// öz yeni şifrəsini təyin edir. Backend bu addımdan sonra birbaşa tam giriş (access/refresh) verir -
// 2FA artıq bu sessiyada təsdiqləndiyi üçün yenidən soruşulmur.
export async function POST(req) {
    const pending = cookies().get(PENDING_2FA_COOKIE)
    if (!pending?.value) {
        return Response.json({detail: "Sessiya bitib, yenidən daxil olun."}, {status: 401})
    }
    const {new_password} = await req.json();
    try {
        const res = await fetch(DJANGO_API_ENDPOINTS.AUTHENTICATION.FIRST_LOGIN_PASSWORD_SET, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
            body: JSON.stringify({temp_token: pending.value, new_password}),
        })
        const data = await res.json()

        if (res.status === 200 && data.access && data.refresh) {
            await setTokenCookies(data.access, data.refresh)
            cookies().delete(PENDING_2FA_COOKIE)
            return Response.json({step: 'done', user: data.user}, {status: 200})
        }
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

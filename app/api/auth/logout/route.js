'use server'
import {cookies} from "next/headers";
import {handleError} from "@/app/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {clearTokenCookies} from "@/app/api/utils";

export async function POST() {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        if (access?.value && refresh?.value) {
            await fetch(DJANGO_API_ENDPOINTS.AUTHENTICATION.LOGOUT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + access.value,
                },
                body: JSON.stringify({refresh: refresh.value}),
            })
        }
    } catch (e) {
        console.log('logout error', handleError(e))
    } finally {
        clearTokenCookies()
    }
    return Response.json({detail: 'Çıxış edildi.'}, {status: 200})
}

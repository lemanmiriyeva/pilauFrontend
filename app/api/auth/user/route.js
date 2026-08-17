'use server'
import {cookies} from "next/headers";
import {get_request, patch_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET() {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const res = await get_request(DJANGO_API_ENDPOINTS.AUTHENTICATION.USER, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

// Şəxsi kabinet - öz məlumatlarını yadda saxla (Image 4).
export async function PATCH(request) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const body = await request.json()
        const res = await patch_request(DJANGO_API_ENDPOINTS.AUTHENTICATION.USER, body, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}
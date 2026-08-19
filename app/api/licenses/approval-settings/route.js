'use server'
import {cookies} from "next/headers";
import {get_request, patch_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(req) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const search = new URL(req.url).search
        const res = await get_request(DJANGO_API_ENDPOINTS.LICENSES.APPROVAL_SETTINGS + search, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

export async function PATCH(req) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const body = await req.json()
        const res = await patch_request(DJANGO_API_ENDPOINTS.LICENSES.APPROVAL_SETTINGS, body, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}
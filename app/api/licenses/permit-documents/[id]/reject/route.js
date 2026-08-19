'use server'
import {cookies} from "next/headers";
import {post_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function POST(req, {params}) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const body = await req.json().catch(() => ({}))
        const res = await post_request(DJANGO_API_ENDPOINTS.LICENSES.PERMIT_REJECT(params.id), body, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}
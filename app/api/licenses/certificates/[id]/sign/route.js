'use server'
import {cookies} from "next/headers";
import {post_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function POST(req, {params}) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    const body = await req.json()
    try {
        const res = await post_request(DJANGO_API_ENDPOINTS.LICENSES.CERTIFICATE_SIGN(params.id), body, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}
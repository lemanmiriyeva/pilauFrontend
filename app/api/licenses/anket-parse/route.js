'use server'
import {cookies} from "next/headers";
import {post_multipart_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function POST(req) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const formData = await req.formData()
        const res = await post_multipart_request(DJANGO_API_ENDPOINTS.LICENSES.ANKET_PARSE, formData, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}
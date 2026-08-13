'use server'
import {cookies} from "next/headers";
import {post_request, post_multipart_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function POST(req) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const contentType = req.headers.get("content-type") || ""
        let res
        if (contentType.includes("multipart/form-data")) {
            // 'Fayl yüklə' rejimi - FormData olduğu kimi backend-ə ötürülür
            const formData = await req.formData()
            res = await post_multipart_request(DJANGO_API_ENDPOINTS.LICENSES.PERMIT_CREATE, formData, access, refresh)
        } else {
            // 'Elektron müraciət forması' rejimi - JSON
            const body = await req.json()
            res = await post_request(DJANGO_API_ENDPOINTS.LICENSES.PERMIT_CREATE, body, access, refresh)
        }
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}
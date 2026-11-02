'use server'
import {cookies} from "next/headers";
import {get_request, post_multipart_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(req, {params}) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const {search} = new URL(req.url)
        const res = await get_request(DJANGO_API_ENDPOINTS.ORGANIZATIONS.ACTIVITY_DOCUMENTS(params.id) + search, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

export async function POST(req, {params}) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const formData = await req.formData()
        const res = await post_multipart_request(DJANGO_API_ENDPOINTS.ORGANIZATIONS.ACTIVITY_DOCUMENTS(params.id), formData, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

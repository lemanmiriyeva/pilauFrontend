'use server'
import {cookies} from "next/headers";
import {get_request, post_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(req) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const search = new URL(req.url).search
        const res = await get_request(DJANGO_API_ENDPOINTS.WORKFLOW.STAGE1_PERMISSIONS + search, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

export async function POST(req) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const body = await req.json()
        const res = await post_request(DJANGO_API_ENDPOINTS.WORKFLOW.STAGE1_PERMISSIONS, body, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}
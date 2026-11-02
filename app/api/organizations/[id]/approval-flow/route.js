'use server'
import {cookies} from "next/headers";
import {get_request, put_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(req, {params}) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const res = await get_request(DJANGO_API_ENDPOINTS.ORGANIZATIONS.APPROVAL_FLOW(params.id), access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

export async function PUT(req, {params}) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const body = await req.json()
        const res = await put_request(DJANGO_API_ENDPOINTS.ORGANIZATIONS.APPROVAL_FLOW(params.id), body, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

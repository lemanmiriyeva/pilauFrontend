'use server'
import {cookies} from "next/headers";
import {post_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function POST(req) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const res = await post_request(DJANGO_API_ENDPOINTS.WORKFLOW.NOTIFICATIONS_READ_ALL, {}, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}
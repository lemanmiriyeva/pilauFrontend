'use server'
import {cookies} from "next/headers";
import {get_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(req) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const {search} = new URL(req.url)
        const url = DJANGO_API_ENDPOINTS.ORGANIZATIONS.TABLE + search
        const res = await get_request(url, access, refresh)
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}
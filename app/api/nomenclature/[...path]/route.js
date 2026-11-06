'use server'
import {cookies} from "next/headers";
import {get_request, post_request, patch_request, delete_request} from "@/app/api/utils";
import {API_URL} from "@/app/urls";
import {handleError} from "@/app/utils";

// /api/nomenclature/<yol> -> Django /api/organizations/<yol> (yalnız nomenklatura yolları)
function target(req, params) {
    const path = (params.path || []).join('/')
    if (!/^nomenclature(s|-catalog)(\/|$)/.test(path)) return null
    return API_URL + `/api/organizations/${path}/` + new URL(req.url).search
}

async function proxy(req, params, method) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    const url = target(req, params)
    if (!url) return Response.json({detail: "Yol tapılmadı."}, {status: 404})
    try {
        let res
        if (method === 'GET') res = await get_request(url, access, refresh)
        else if (method === 'DELETE') res = await delete_request(url, access, refresh)
        else {
            const body = await req.json()
            res = method === 'POST' ? await post_request(url, body, access, refresh) : await patch_request(url, body, access, refresh)
        }
        if (res.status === 204) return new Response(null, {status: 204})
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

export async function GET(req, {params}) { return proxy(req, params, 'GET') }
export async function POST(req, {params}) { return proxy(req, params, 'POST') }
export async function PATCH(req, {params}) { return proxy(req, params, 'PATCH') }
export async function DELETE(req, {params}) { return proxy(req, params, 'DELETE') }

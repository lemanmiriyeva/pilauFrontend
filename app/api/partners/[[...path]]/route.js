'use server'
import {cookies} from "next/headers";
import {get_request, post_request, patch_request, delete_request} from "@/app/api/utils";
import {API_URL} from "@/app/urls";
import {handleError} from "@/app/utils";

/*
 * /api/partners                    -> Django /api/organizations/partners/
 * /api/partners/<id>               -> Django /api/organizations/partners/<id>/
 * /api/partners/org/<orgId>        -> Django /api/organizations/<orgId>/partners/
 * /api/partners/org/<orgId>/<pid>  -> Django /api/organizations/<orgId>/partners/<pid>/
 */
function target(req, params) {
    const parts = params.path || []
    if (!parts.every((p) => /^\d+$/.test(p) || p === 'org')) return null
    let path
    if (parts[0] === 'org') {
        if (!parts[1]) return null
        path = `${parts[1]}/partners/${parts.slice(2).join('/')}`.replace(/\/$/, '')
    } else {
        path = ['partners', ...parts].join('/')
    }
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
        return Response.json(await res.json(), {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

export async function GET(req, {params}) { return proxy(req, params, 'GET') }
export async function POST(req, {params}) { return proxy(req, params, 'POST') }
export async function PATCH(req, {params}) { return proxy(req, params, 'PATCH') }
export async function DELETE(req, {params}) { return proxy(req, params, 'DELETE') }

'use server'
import {cookies} from "next/headers";
import {get_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET(req, {params}) {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const search = new URL(req.url).search
        const res = await get_request(DJANGO_API_ENDPOINTS.LICENSES.CERTIFICATE_PDF(params.id) + search, access, refresh)

        if (!res.ok) {
            const data = await res.json().catch(() => ({detail: 'Sənəd yüklənmədi.'}))
            return Response.json(data, {status: res.status})
        }

        const buffer = await res.arrayBuffer()
        return new Response(buffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': res.headers.get('Content-Disposition') || 'inline',
            },
        })
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}
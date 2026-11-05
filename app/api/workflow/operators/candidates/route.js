'use server'
import {cookies} from "next/headers";
import {get_request} from "@/app/api/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

export async function GET() {
    const access = cookies().get("access")
    const refresh = cookies().get("refresh")
    try {
        const res = await get_request(DJANGO_API_ENDPOINTS.WORKFLOW.OPERATOR_CANDIDATES, access, refresh)
        const text = await res.text()
        let data
        try {
            data = JSON.parse(text)
        } catch {
            data = {detail: `Backend ${res.status} qaytardı (JSON deyil). Serverin xəta jurnalına baxın.`}
        }
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}
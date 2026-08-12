'use server'
import {handleError} from "@/app/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";

export async function POST(req) {
    const {username} = await req.json()
    try {
        const res = await fetch(DJANGO_API_ENDPOINTS.AUTHENTICATION.PASSWORD_FORGOT, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
            body: JSON.stringify({username}),
        })
        const data = await res.json()
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

'use server'
import {cookies} from "next/headers";
import {handleError} from "@/app/utils";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {PENDING_2FA_COOKIE} from "@/components/constants";

export async function POST(req) {
    const {username, password} = await req.json();
    try {
        const res = await fetch(DJANGO_API_ENDPOINTS.AUTHENTICATION.LOGIN, {
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
            body: JSON.stringify({username, password}),
        })
        const data = await res.json()

        if (res.status === 200 && data.temp_token) {
            cookies().set(PENDING_2FA_COOKIE, data.temp_token, {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 300,
            })
            return Response.json({step: data.step}, {status: 200})
        }
        return Response.json(data, {status: res.status})
    } catch (e) {
        return Response.json({detail: handleError(e)}, {status: 500})
    }
}

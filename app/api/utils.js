'use server'
import {cookies, headers as nextHeaders} from "next/headers";
import {DJANGO_API_ENDPOINTS} from "@/app/urls";
import {handleError, isEmpty} from "@/app/utils";
import {ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE} from "@/components/constants";

const METHODS = {GET: "GET", POST: "POST", PUT: "PUT", PATCH: "PATCH", DELETE: "DELETE"}

function getClientIp() {
    const h = nextHeaders();
    const forwardedFor = h.get('x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0].trim();
    return h.get('x-real-ip') || '';
}

async function parseJwt(token) {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
}

async function setTokenCookies(access, refresh) {
    const access_payload = await parseJwt(access)
    const refresh_payload = await parseJwt(refresh)
    const now = Math.floor(Date.now() / 1000);

    cookies().set(ACCESS_TOKEN_COOKIE, access, {
        secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'strict',
        maxAge: access_payload.exp - now,
    })
    cookies().set(REFRESH_TOKEN_COOKIE, refresh, {
        secure: process.env.NODE_ENV === 'production', httpOnly: true, sameSite: 'strict',
        maxAge: refresh_payload.exp - now,
    })
}

function clearTokenCookies() {
    cookies().delete(ACCESS_TOKEN_COOKIE)
    cookies().delete(REFRESH_TOKEN_COOKIE)
}

const __refresh = async (refresh_token) => {
    const res = await fetch(DJANGO_API_ENDPOINTS.AUTHENTICATION.REFRESH, {
        method: METHODS.POST,
        headers: {'Content-Type': 'application/json', 'Accept': 'application/json'},
        body: JSON.stringify({refresh: refresh_token}),
    })
    if (!res.ok) throw new Error('refresh_not_valid')
    const {access, refresh} = await res.json()
    await setTokenCookies(access, refresh)
    return {access, refresh}
}

async function __base_request(url, method, data, access_token, refresh_token) {
    const _headers = new Headers({'Content-Type': 'application/json', 'Accept': 'application/json'})
    if (access_token?.value) _headers.set('Authorization', 'Bearer ' + access_token.value)

    const clientIp = getClientIp();
    if (clientIp) _headers.set('X-Forwarded-For', clientIp);

    const config = {headers: _headers, method, body: JSON.stringify(data)}
    if (method === METHODS.GET || isEmpty(data)) delete config.body

    const res = await fetch(url, config)

    if (res.status === 401 && refresh_token?.value) {
        try {
            const {access} = await __refresh(refresh_token.value)
            _headers.set('Authorization', 'Bearer ' + access)
            return await fetch(url, {...config, headers: _headers})
        } catch (e) {
            clearTokenCookies()
            return res
        }
    }
    return res
}

export async function get_request(url, access_token, refresh_token) {
    return __base_request(url, METHODS.GET, null, access_token, refresh_token)
}

export async function post_request(url, data, access_token, refresh_token) {
    return __base_request(url, METHODS.POST, data, access_token, refresh_token)
}

export async function put_request(url, data, access_token, refresh_token) {
    return __base_request(url, METHODS.PUT, data, access_token, refresh_token)
}

export async function patch_request(url, data, access_token, refresh_token) {
    return __base_request(url, METHODS.PATCH, data, access_token, refresh_token)
}

export async function delete_request(url, access_token, refresh_token) {
    return __base_request(url, METHODS.DELETE, null, access_token, refresh_token)
}

/**
 * multipart/form-data (fayl yükləmə) sorğuları üçün - __base_request-dən fərqli olaraq
 * Content-Type təyin ETMİR (fetch FormData üçün bunu boundary ilə özü qoyur) və body-ni
 * JSON.stringify etmir, FormData-nı olduğu kimi ötürür.
 */
async function __base_multipart_request(url, formData, access_token, refresh_token) {
    const _headers = new Headers({'Accept': 'application/json'})
    if (access_token?.value) _headers.set('Authorization', 'Bearer ' + access_token.value)

    const clientIp = getClientIp();
    if (clientIp) _headers.set('X-Forwarded-For', clientIp);

    const config = {headers: _headers, method: METHODS.POST, body: formData}
    const res = await fetch(url, config)

    if (res.status === 401 && refresh_token?.value) {
        try {
            const {access} = await __refresh(refresh_token.value)
            _headers.set('Authorization', 'Bearer ' + access)
            return await fetch(url, {...config, headers: _headers})
        } catch (e) {
            clearTokenCookies()
            return res
        }
    }
    return res
}

export async function post_multipart_request(url, formData, access_token, refresh_token) {
    return __base_multipart_request(url, formData, access_token, refresh_token)
}

export {setTokenCookies, clearTokenCookies}
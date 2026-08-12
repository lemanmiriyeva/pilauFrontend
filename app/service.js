import axios from 'axios'
import {APP_ROUTES} from "@/components/constants";
import {require_login} from "@/app/utils";

export const service_api = axios.create({
    baseURL: '/api/',
    timeout: 30000,
    withCredentials: true,
});

service_api.interceptors.response.use(function (res) {
    return res;
}, function (error) {
    const isAuthRequest = error?.config?.url?.includes('auth/login')
        || error?.config?.url?.includes('auth/totp');

    if (error.status === 401 && !isAuthRequest) {
        if (require_login(window?.location.pathname)) {
            window.location.href = APP_ROUTES.SIGNIN
        }
    }
    if (error.status === 403 && !isAuthRequest) {
        window.location.href = APP_ROUTES.HOME
    }
    return Promise.reject(error);
})

import {APP_ROUTES} from "@/components/constants";

function isString(e) {
    return typeof e === 'string';
}

export const handleError = e => {
    switch (typeof e) {
        case 'string':
            return e;
        case 'object':
            if (e?.response?.data) {
                if (isString(e.response.data)) {
                    return e.response.data
                } else if (e.response.data.detail)
                    return e.response.data.detail
                else if (e.response.data.non_field_errors)
                    return e.response.data.non_field_errors[0]
                else {
                    return Object.keys(e?.response?.data)?.map(key => e?.response?.data[key])?.join(' | ')
                }
            } else if (e?.detail) {
                return e.detail
            } else if (e?.message) {
                return e.message
            } else if (e?.statusText) {
                return e.statusText
            } else {
                return 'Xəta baş verdi.'
            }
        default:
            return 'Xəta baş verdi.'
    }
}

export function isEmpty(value) {
    return value === undefined || value === null
        || (typeof value === "number" && isNaN(value))
        || (typeof value === 'object' && Object.keys(value).length === 0)
        || (typeof value === 'string' && value.trim().length === 0)
}

const require_login_exception_list = [
    APP_ROUTES.PASSWORD_RESET,
    APP_ROUTES.SIGNIN,
    APP_ROUTES.TWO_FA_SETUP,
    APP_ROUTES.TWO_FA_VERIFY,
]

export function require_login(pathname) {
    return require_login_exception_list.filter(path => {
        const pattern = new RegExp(`^${path}(/[^/]+)?$`);
        return pattern.test(pathname)
    }).length === 0
}

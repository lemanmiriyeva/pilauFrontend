export const API_URL = process.env.NEXT_PUBLIC_API_URL

export const DJANGO_API_ENDPOINTS = {
    AUTHENTICATION: {
        LOGIN: API_URL + "/api/auth/login/",
        LOGOUT: API_URL + "/api/auth/logout/",
        REFRESH: API_URL + "/api/auth/token/refresh/",
        USER: API_URL + "/api/auth/me/",

        TOTP_SETUP_BEGIN: API_URL + "/api/auth/totp/setup/begin/",
        TOTP_SETUP_CONFIRM: API_URL + "/api/auth/totp/setup/confirm/",
        TOTP_VERIFY: API_URL + "/api/auth/totp/verify/",
        TOTP_REQUEST_ADMIN_HELP: API_URL + "/api/auth/totp/request-admin-help/",

        PASSWORD_FORGOT: API_URL + "/api/auth/password/forgot/",
        PASSWORD_FORGOT_CONFIRM: API_URL + "/api/auth/password/forgot/confirm/",
        PASSWORD_CHANGE: API_URL + "/api/auth/password/change/",

        ADMIN_CREATE_USER: API_URL + "/api/auth/admin/users/create/",
        ADMIN_UNLOCK_USER: API_URL + "/api/auth/admin/users/unlock/",
        ADMIN_RESET_TOTP: API_URL + "/api/auth/admin/users/reset-totp/",
    },
    ORGANIZATIONS: {
        TREE: API_URL + "/api/organizations/tree/",
        LIST: API_URL + "/api/organizations/",
        DETAIL: API_URL + "/api/organizations/",
    },
    PERMISSIONS: {
        MODULES: API_URL + "/api/permissions/modules/",
        MY_MODULES: API_URL + "/api/permissions/my-modules/",
        USER_PERMISSIONS: API_URL + "/api/permissions/user-permissions/",
        GRANT: API_URL + "/api/permissions/grant/",
    },
}

export const NEXT_API_ENDPOINTS = {
    AUTHENTICATION: {
        LOGIN: "auth/login/",
        LOGOUT: "auth/logout/",
        USER: "auth/user/",

        TOTP_SETUP_BEGIN: "auth/totp-setup-begin/",
        TOTP_SETUP_CONFIRM: "auth/totp-setup-confirm/",
        TOTP_VERIFY: "auth/totp-verify/",
        TOTP_REQUEST_ADMIN_HELP: "auth/totp-request-admin-help/",

        PASSWORD_FORGOT: "auth/password-forgot/",
        PASSWORD_FORGOT_CONFIRM: "auth/password-forgot-confirm/",
    },
    ORGANIZATIONS: {
        TREE: "organizations/tree/",
        LIST: "organizations/",
        DETAIL: "organizations/",
    },
    PERMISSIONS: {
        MODULES: "permissions/modules/",
        MY_MODULES: "permissions/my-modules/",
        USER_PERMISSIONS: "permissions/user-permissions/",
        GRANT: "permissions/grant/",
    },
}
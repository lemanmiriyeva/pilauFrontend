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
        FIRST_LOGIN_PASSWORD_SET: API_URL + "/api/auth/password/first-login-set/",

        ADMIN_USERS_LIST: API_URL + "/api/auth/admin/users/",
        ADMIN_CREATE_USER: API_URL + "/api/auth/admin/users/create/",
        ADMIN_USER_DETAIL: (id) => API_URL + `/api/auth/admin/users/${id}/`,
        ADMIN_UNLOCK_USER: API_URL + "/api/auth/admin/users/unlock/",
        ADMIN_RESET_TOTP: API_URL + "/api/auth/admin/users/reset-totp/",
    },
    ORGANIZATIONS: {
        TREE: API_URL + "/api/organizations/tree/",
        SUMMARY: API_URL + "/api/organizations/summary/",
        TABLE: API_URL + "/api/organizations/table/",
        LIST: API_URL + "/api/organizations/",
        DETAIL: (id) => API_URL + `/api/organizations/${id}/`,
    },
    PERMISSIONS: {
        MODULES: API_URL + "/api/permissions/modules/",
        MY_MODULES: API_URL + "/api/permissions/my-modules/",
        USER_PERMISSIONS: API_URL + "/api/permissions/user-permissions/",
        GRANT: API_URL + "/api/permissions/grant/",
    },
    LICENSES: {
        APPLICANT_INFO: API_URL + "/api/licenses/applicant-info/",
        PERMIT_SCHEMA: API_URL + "/api/licenses/permit-documents/schema/",
        PERMIT_LIST: API_URL + "/api/licenses/permit-documents/",
        PERMIT_DETAIL: (id) => API_URL + `/api/licenses/permit-documents/${id}/`,
        PERMIT_CREATE: API_URL + "/api/licenses/permit-documents/",
        PERMIT_APPROVE: (id) => API_URL + `/api/licenses/permit-documents/${id}/approve/`,
        PERMIT_REJECT: (id) => API_URL + `/api/licenses/permit-documents/${id}/reject/`,
        APPROVAL_SETTINGS: API_URL + "/api/licenses/approval-settings/",
        CERTIFICATE_LIST: API_URL + "/api/licenses/certificates/",
        CERTIFICATE_DETAIL: (id) => API_URL + `/api/licenses/certificates/${id}/`,
        CERTIFICATE_COMPLETE: (id) => API_URL + `/api/licenses/certificates/${id}/complete/`,
    },
    WORKFLOW: {
        STAGE1_PERMISSIONS: API_URL + "/api/workflow/stage1-permissions/",
        STAGE2_PERMISSIONS: API_URL + "/api/workflow/stage2-permissions/",
        APPROVERS: API_URL + "/api/workflow/approvers/",
        WORKFLOW_CONFIG: API_URL + "/api/workflow/workflow-config/",
        NOTIFICATIONS: API_URL + "/api/workflow/notifications/",
        NOTIFICATIONS_READ_ALL: API_URL + "/api/workflow/notifications/read-all/",
        NOTIFICATIONS_READ: (id) => API_URL + `/api/workflow/notifications/${id}/read/`,
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
        FIRST_LOGIN_PASSWORD_SET: "auth/first-login-set/",

        ADMIN_USERS_LIST: "auth/admin/users/",
        ADMIN_CREATE_USER: "auth/admin/users-create/",
        ADMIN_USER_DETAIL: (id) => `auth/admin/users/${id}/`,
    },
    ORGANIZATIONS: {
        TREE: "organizations/tree/",
        SUMMARY: "organizations/summary/",
        TABLE: "organizations/table/",
        LIST: "organizations/",
        DETAIL: (id) => `organizations/${id}/`,
    },
    PERMISSIONS: {
        MODULES: "permissions/modules/",
        MY_MODULES: "permissions/my-modules/",
        USER_PERMISSIONS: "permissions/user-permissions/",
        GRANT: "permissions/grant/",
    },
    LICENSES: {
        APPLICANT_INFO: "licenses/applicant-info/",
        PERMIT_SCHEMA: "licenses/permit-documents-schema/",
        PERMIT_LIST: "licenses/permit-documents/",
        PERMIT_DETAIL: (id) => `licenses/permit-documents/${id}/`,
        PERMIT_CREATE: "licenses/permit-documents-create/",
        PERMIT_APPROVE: (id) => `licenses/permit-documents/${id}/approve/`,
        PERMIT_REJECT: (id) => `licenses/permit-documents/${id}/reject/`,
        APPROVAL_SETTINGS: "licenses/approval-settings/",
        CERTIFICATE_LIST: "licenses/certificates/",
        CERTIFICATE_DETAIL: (id) => `licenses/certificates/${id}/`,
        CERTIFICATE_COMPLETE: (id) => `licenses/certificates/${id}/complete/`,
    },
    WORKFLOW: {
        STAGE1_PERMISSIONS: "workflow/stage1-permissions/",
        STAGE2_PERMISSIONS: "workflow/stage2-permissions/",
        APPROVERS: "workflow/approvers/",
        WORKFLOW_CONFIG: "workflow/workflow-config/",
        NOTIFICATIONS: "workflow/notifications/",
        NOTIFICATIONS_READ_ALL: "workflow/notifications/read-all/",
        NOTIFICATIONS_READ: (id) => `workflow/notifications/${id}/read/`,
    },
}
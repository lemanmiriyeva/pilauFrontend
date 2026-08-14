/*-- CONSTANTS --*/

/* Cookie */
export const ACCESS_TOKEN_COOKIE = "access"
export const REFRESH_TOKEN_COOKIE = "refresh"
export const PENDING_2FA_COOKIE = "pending_2fa"

/* Messages */
export const LOGIN_SUCCESSFUL = "LOGIN_SUCCESSFUL"

export const APP_ROUTES = {
    HOME: "/",
    SIGNIN: "/daxilol",
    SIGNOUT: "/chixish",
    PASSWORD_RESET: "/shifre-teyini",
    TWO_FA_SETUP: "/2fa-qurulmasi",
    TWO_FA_VERIFY: "/2fa-tesdiq",
    PROFILE: "/sexsi-kabinet",
    MODULES: "/modullar",
    ICAZELER: "/icazeler",
    TESKILATLAR: "/modullar/teskilatlar",
    INZIBATCI: "/inzibatci-paneli",
    INZIBATCI_ISTIFADECILER: "/inzibatci-paneli/istifadeciler",
    INZIBATCI_ICAZELER: "/inzibatci-paneli/icazeler",
    IDXAL_IXRAC: "/modullar/lisenziya-senedler/idxal-ixrac",
    IDXAL_IXRAC_YENI: "/modullar/lisenziya-senedler/idxal-ixrac/yeni",
    TESKILATLAR_YENI: "/modullar/teskilatlar/yeni",
}

export const LOGIN_STEPS = {
    CREDENTIALS: "credentials",
    TOTP_SETUP: "totp_setup_required",
    TOTP_VERIFY: "totp_required",
}
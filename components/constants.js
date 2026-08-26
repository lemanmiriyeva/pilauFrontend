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
    FIRST_PASSWORD_SET: "/ilk-sifre-teyini",
    TWO_FA_SETUP: "/2fa-qurulmasi",
    TWO_FA_VERIFY: "/2fa-tesdiq",
    PROFILE: "/sexsi-kabinet",
    MODULES: "/modullar",
    ICAZELER: "/icazeler",
    TESKILATLAR: "/modullar/teskilatlar",
    INZIBATCI: "/inzibatci-paneli",
    INZIBATCI_ISTIFADECILER: "/inzibatci-paneli/istifadeciler",
    INZIBATCI_ICAZELER: "/inzibatci-paneli/icazeler",
    INZIBATCI_DEPARTAMENT_VEZIFE: "/inzibatci-paneli/departament-vezife",
    IDXAL_IXRAC: "/modullar/lisenziya-senedler/idxal-ixrac",
    IDXAL_IXRAC_YENI: "/modullar/lisenziya-senedler/idxal-ixrac/yeni",
    ISTEHSAL: "/modullar/lisenziya-senedler/istehsal",
    ISTEHSAL_YENI: "/modullar/lisenziya-senedler/istehsal/yeni",
    XUSUSI_SATIS: "/modullar/lisenziya-senedler/xususi-satis",
    XUSUSI_SATIS_YENI: "/modullar/lisenziya-senedler/xususi-satis/yeni",
    EDV_GUZESTI: "/modullar/lisenziya-senedler/edv-guzesti",
    EDV_GUZESTI_YENI: "/modullar/lisenziya-senedler/edv-guzesti/yeni",
    QURUM_YOXLAMASI_ICAZELERI: "/lisenziya-icazeleri/qurum-yoxlamasi",
    TESDIQ_HUQUQLARI: "/lisenziya-icazeleri/tesdiq-huquqlari",
    TESDIQ_AXINI: "/lisenziya-icazeleri/tesdiq-axini",
    YOXLAMALARIM: "/lisenziya-icazeleri/yoxlamalarim",
    SENEDLERIM: "/lisenziya-icazeleri/senedlerim",
    SENED: (id) => `/lisenziya-icazeleri/sened/${id}`,
    TESKILATLAR_YENI: "/modullar/teskilatlar/yeni",
    BILDIRISLER:"/bildirisler",
    HESABATLAR: "/modullar/hesabatlar",
    HESABATLAR_TESKILATLAR: "/modullar/hesabatlar/teskilatlar",
    HESABATLAR_TESKILAT_DETAL: (id) => `/modullar/hesabatlar/teskilatlar/${id}`,
    HESABATLAR_STATISTIK: "/modullar/hesabatlar/statistik-melumatlar",
}

/* Hesabatlar modulu - lisenziya kateqoriyaları (bax: licenses/field_schema.py DOC_TYPES,
   frontend-də ayrıca sorğu getməsin deyə burada təkrarlanır). */
export const LICENSE_TYPES = [
    {key: "ixrac", label: "İxrac"},
    {key: "idxal", label: "İdxal"},
    {key: "istehsal", label: "İstehsal"},
    {key: "xususi_satis", label: "Xüsusi Satış"},
    {key: "gomrukden_azadolma", label: "Gömrükdən Azadolma"},
    {key: "edvden_azadolma", label: "ƏDV-dən Azadolma"},
]

export const LICENSE_STATUS_LABELS = {
    gozleyir: "Gözlənilir",
    aktiv: "Aktiv",
    bitmis: "Bitmiş",
    legv: "Ləğv edilib",
    dayandirilib: "Dayandırılıb",
}

export const GRANULARITY_OPTIONS = [
    {key: "day", label: "Günə görə"},
    {key: "month", label: "Aya görə"},
    {key: "year", label: "İlə görə"},
]

export const LOGIN_STEPS = {
    CREDENTIALS: "credentials",
    PASSWORD_CHANGE: "password_change_required",
    TOTP_SETUP: "totp_setup_required",
    TOTP_VERIFY: "totp_required",
}
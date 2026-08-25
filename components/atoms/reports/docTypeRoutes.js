import {APP_ROUTES} from "@/components/constants";

/** Sənəd növünə (doc_type) görə hansı kateqoriya siyahı səhifəsinə keçid ediləcəyini müəyyən edir -
 * bax licenses/field_schema.py DOC_TYPES. Hesabatlar-dakı sənəd sətirlərinə klikləyəndə istifadə olunur. */
export function docTypeListRoute(docType) {
    switch (docType) {
        case 'ixrac':
        case 'idxal':
            return APP_ROUTES.IDXAL_IXRAC;
        case 'istehsal':
            return APP_ROUTES.ISTEHSAL;
        case 'xususi_satis':
            return APP_ROUTES.XUSUSI_SATIS;
        case 'gomrukden_azadolma':
        case 'edvden_azadolma':
            return APP_ROUTES.EDV_GUZESTI;
        default:
            return APP_ROUTES.MODULES;
    }
}

export function docTypeDetailRoute(docType, id) {
    return `${docTypeListRoute(docType)}/${id}`;
}
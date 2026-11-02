/**
 * Yeni sənəd yaradıldıqdan sonra: backend sənədi 'qaralama' (natamam) və ya 'yoxlamada' qaytarır.
 * - Natamam -> istifadəçi sənədin detalına yönləndirilir (çatışmayan faylları orada yükləyir).
 * - Tam    -> əvvəlki kimi siyahı səhifəsinə qayıdır.
 */
import {docTypeDetailRoute} from "@/components/atoms/reports/docTypeRoutes";

export function afterPermitCreate({data, router, enqueueSnackbar, successMessage, listRoute}) {
    if (data?.status === 'qaralama') {
        const n = (data.missing_files || []).length;
        enqueueSnackbar(
            `Sənəd natamam kimi saxlanıldı (qaralama). Çatışmayan ${n} sənədi yükləyin - tamamlanan kimi yoxlamaya göndəriləcək.`,
            {variant: 'warning', autoHideDuration: 6000}
        );
        router.push(docTypeDetailRoute(data.doc_type, data.id));
        return;
    }
    enqueueSnackbar(successMessage, {variant: 'success'});
    router.push(listRoute);
}
"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";
import FileDropField from "@/components/atoms/licenses/FileDropField";

function Banner({tone, title, children}) {
    const tones = {
        warn: {bg: '#FFF6E5', border: '#E8C77A', fg: '#7A5200'},
        info: {bg: '#E7EEFA', border: '#A9C0EA', fg: '#1F4E9A'},
        error: {bg: '#FDECEC', border: '#F0B4AE', fg: '#B42318'},
        ok: {bg: '#E8F5EC', border: '#A7D5B5', fg: '#1E7A3C'},
    }[tone];
    return (
        <Box sx={{backgroundColor: tones.bg, border: `1px solid ${tones.border}`, borderRadius: 2, p: 2.5, mb: 3}}>
            <Typography sx={{fontSize: 14, fontWeight: 800, color: tones.fg, mb: 0.5}}>{title}</Typography>
            <Box sx={{fontSize: 13, color: GOV.textPrimary}}>{children}</Box>
        </Box>
    );
}

/**
 * Sənədin detal səhifəsində statusa görə panel:
 *  - qaralama   -> çatışmayan məcburi sənədləri yükləmə sahələri (hamısı yüklənəndə sənəd avtomatik yoxlamaya gedir)
 *  - yoxlamada  -> operator yoxlamasında olduğu barədə məlumat
 *  - legv       -> imtina / rədd səbəbi
 *  - operator yoxlamasından keçib -> məlumat
 * İstifadə: <PermitStatusPanel doc={doc} onUpdated={setDoc}/>
 */
export default function PermitStatusPanel({doc, onUpdated}) {
    const {enqueueSnackbar} = useSnackbar();
    const [files, setFiles] = useState({});
    const [busy, setBusy] = useState(false);

    if (!doc) return null;
    const missing = doc.missing_files || [];

    const upload = async () => {
        const chosen = Object.entries(files).filter(([, f]) => !!f);
        if (chosen.length === 0) {
            enqueueSnackbar('Əvvəlcə yüklənəcək faylı seçin.', {variant: 'warning'});
            return;
        }
        setBusy(true);
        try {
            const fd = new FormData();
            chosen.forEach(([key, file]) => fd.append(`file__${key}`, file));
            const res = await service_api.post(NEXT_API_ENDPOINTS.LICENSES.PERMIT_UPLOAD_FILES(doc.id), fd, {
                headers: {'Content-Type': 'multipart/form-data'},
            });
            setFiles({});
            onUpdated?.(res.data);
            if (res.data?.submitted) {
                enqueueSnackbar('Bütün sənədlər tamamlandı - yoxlamaya göndərildi.', {variant: 'success'});
            } else {
                const left = (res.data?.missing_files || []).length;
                enqueueSnackbar(`Fayllar yükləndi. Hələ ${left} sənəd çatışmır.`, {variant: 'info'});
            }
        } catch (e) {
            enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
        } finally {
            setBusy(false);
        }
    };

    if (doc.status === 'qaralama') {
        return (
            <Banner tone="warn" title="Sənəd natamamdır (qaralama)">
                <Typography sx={{fontSize: 13, mb: 2}}>
                    Aşağıdakı sənədlər hələ yüklənməyib. Hamısı yüklənən kimi sənəd avtomatik yoxlamaya göndəriləcək.
                    Bir hissəsini indi, qalanını sonra da yükləyə bilərsiniz.
                </Typography>
                {missing.length > 0 && (
                    <Box sx={{display: 'grid', gap: 2, gridTemplateColumns: {xs: '1fr', md: '1fr 1fr'}, mb: 2}}>
                        {missing.map((m) => (
                            <FileDropField
                                key={m.key} field={{key: m.key, label: m.label}}
                                file={files[m.key]}
                                onChange={(file) => setFiles((prev) => ({...prev, [m.key]: file}))}
                            />
                        ))}
                    </Box>
                )}
                <Button
                    variant="contained" disabled={busy || missing.length === 0} onClick={upload}
                    sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, '&:hover': {backgroundColor: GOV.navyMid}}}
                >
                    {busy ? 'Yüklənir...' : 'Seçilmiş sənədləri yüklə'}
                </Button>
            </Banner>
        );
    }

    if (doc.status === 'yoxlamada') {
        return (
            <Banner tone="info" title="Operator yoxlamasındadır">
                Qurum təsdiqindən keçib, indi MSN operatorları tərəfindən yoxlanılır. Yoxlama uğurlu olduqda avtomatik təsdiq hüququ olan şəxsə göndəriləcək.
            </Banner>
        );
    }

    if (doc.status === 'legv' && doc.rejection_reason) {
        return (
            <Banner tone="error" title={doc.operator_decision === 'imtina' ? 'Operator yoxlamasında imtina edilib' : 'Sənəd rədd edilib'}>
                <b>Səbəb:</b> {doc.rejection_reason}
                {(doc.rejected_by_name || doc.operator_reviewed_by_name) && (
                    <Typography component="span" sx={{fontSize: 12, color: GOV.textMuted, ml: 1}}>
                        ({doc.rejected_by_name || doc.operator_reviewed_by_name})
                    </Typography>
                )}
            </Banner>
        );
    }

    if (doc.operator_decision === 'ugurlu' && doc.operator_reviewed_by_name) {
        return (
            <Banner tone="ok" title="Operator yoxlamasından keçib">
                Yoxlayan: {doc.operator_reviewed_by_name}
                {doc.operator_comment ? ` · Qeyd: ${doc.operator_comment}` : ''}
            </Banner>
        );
    }
    return null;
}
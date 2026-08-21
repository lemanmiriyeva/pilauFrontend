"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import PdfViewer from "@/components/atoms/PdfViewer";
import CertificateSignDialog from "@/components/atoms/CertificateSignDialog";

function formatDateTime(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('az-AZ', {dateStyle: 'medium', timeStyle: 'short'});
}

function SignedBadge({method, phone, signedAt}) {
    const label = method === 'sima' ? 'SİMA İmza' : 'Asan İmza';
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1, px: 2, py: 1.25,
            borderRadius: 1.5, backgroundColor: '#E8F5EC', mb: 2,
        }}>
            <CheckCircleOutlineIcon sx={{fontSize: 20, color: '#1E7A3C'}}/>
            <Typography sx={{fontSize: 13, color: '#1E7A3C'}}>
                Sənəd <strong>{label}</strong> ilə imzalanıb{phone ? ` · ${phone}` : ''}
                {signedAt ? ` · ${formatDateTime(signedAt)}` : ''}
            </Typography>
        </Box>
    );
}

/**
 * Lisenziya tam təsdiqlənəndə (bax certificate_id) həmin lisenziyanın öz detal səhifəsində
 * (istehsal/idxal-ixrac/xüsusi-satış/ƏDV-güzəşt [id]) sənədin özünü - PDF-i, imza statusunu,
 * imzalama düymələrini və "Tamamlandı" statusunu - göstərmək üçün. Eyni məzmun ayrıca
 * /lisenziya-icazeleri/sened/[id] səhifəsində də var - bura yalnız daxili görünüş üçündür,
 * "sənədə bax"a keçmədən lisenziyanın öz səhifəsində baxmaq istəyənlər üçün.
 */
export default function CertificateEmbed({certificateId}) {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [cert, setCert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [signDialogMethod, setSignDialogMethod] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.LICENSES.CERTIFICATE_DETAIL(certificateId));
            setCert(res.data);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [certificateId]);

    const handleSignConfirm = async (phone) => {
        const res = await service_api.post(NEXT_API_ENDPOINTS.LICENSES.CERTIFICATE_SIGN(certificateId), {
            method: signDialogMethod, phone,
        });
        setCert(res.data);
        enqueueSnackbar('Sənəd uğurla imzalandı.', {variant: 'success'});
    };

    if (loading) {
        return (
            <Box sx={{
                backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: 3, mb: 3,
                display: 'flex', justifyContent: 'center', py: 6,
            }}>
                <CircularProgress size={24}/>
            </Box>
        );
    }

    if (!cert) return null;

    const pdfSrc = `/api/${NEXT_API_ENDPOINTS.LICENSES.CERTIFICATE_PDF(cert.id)}`;

    return (
        <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: 3, mb: 3}}>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2}}>
                <Typography sx={{fontSize: 14, fontWeight: 700, color: GOV.textPrimary}}>
                    Sənəd görünüşü — {cert.number}
                </Typography>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                    <Button
                        size="small"
                        onClick={() => router.push(APP_ROUTES.SENED(cert.id))}
                        sx={{
                            textTransform: 'none', fontWeight: 700, fontSize: 12.5,
                            color: GOV.textPrimary, border: `1px solid ${GOV.cardBorder}`, px: 1.5,
                        }}
                    >
                        Tam səhifədə aç
                    </Button>
                    <Button
                        component="a"
                        href={`/api/${NEXT_API_ENDPOINTS.LICENSES.CERTIFICATE_PDF(cert.id)}?download=1`}
                        target="_blank" rel="noopener noreferrer"
                        size="small" startIcon={<PictureAsPdfIcon sx={{fontSize: 16}}/>}
                        sx={{
                            textTransform: 'none', fontWeight: 700, fontSize: 12.5,
                            color: GOV.textPrimary, border: `1px solid ${GOV.cardBorder}`, px: 1.5,
                        }}
                    >
                        PDF yüklə
                    </Button>
                </Box>
            </Box>

            {cert.is_signed && (
                <SignedBadge method={cert.signature_method} phone={cert.signed_phone} signedAt={cert.signed_at}/>
            )}

            <Box sx={{mb: 2}}>
                <PdfViewer src={pdfSrc} title={cert.number}/>
            </Box>

            {!cert.is_signed && (
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center'}}>
                    <Button
                        variant="contained" startIcon={<PhoneIphoneIcon/>}
                        onClick={() => setSignDialogMethod('sima')}
                        sx={{
                            backgroundColor: GOV.navySoft, textTransform: 'none', fontWeight: 700,
                            fontSize: 13, px: 3, py: 1.1, '&:hover': {backgroundColor: GOV.navy},
                        }}
                    >
                        SİMA ilə imzala
                    </Button>
                    <Button
                        variant="contained" startIcon={<FingerprintIcon/>}
                        onClick={() => setSignDialogMethod('asan')}
                        sx={{
                            backgroundColor: GOV.goldDark, textTransform: 'none', fontWeight: 700,
                            fontSize: 13, px: 3, py: 1.1, '&:hover': {backgroundColor: GOV.gold},
                        }}
                    >
                        Asan İmza ilə imzala
                    </Button>
                </Box>
            )}

            <CertificateSignDialog
                open={!!signDialogMethod} method={signDialogMethod}
                onClose={() => setSignDialogMethod(null)}
                onConfirm={handleSignConfirm}
            />
        </Box>
    );
}
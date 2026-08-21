"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {useRouter} from "next/navigation";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";
import {APP_ROUTES} from "@/components/constants";
import PdfViewer from "./PdfViewer";

/**
 * Lisenziya sənədinin (PermitDocument) öz detal səhifəsində ("İdxal/İxrac", "İstehsal" və s.
 * [id]/page.js) rəsmi sertifikatın (LicenseCertificate) qısa görünüşünü göstərir - PDF önizləmə +
 * status. Tam funksionallıq (imzalama - SİM/Asan İmza, "Tamamlandı" işarələnməsi) üçün ayrıca
 * /lisenziya-icazeleri/sened/[id] səhifəsinə keçid verir, onu təkrarlamır.
 *
 * @param {number|null} certificateId - PermitDocumentDetailSerializer.certificate_id (sənəd hər
 *   iki mərhələdə təsdiqlənməyibsə null olur - bax licenses/serializers.py get_certificate_id).
 */
export default function CertificateEmbed({certificateId}) {
    const router = useRouter();
    const [cert, setCert] = useState(null);
    const [loading, setLoading] = useState(!!certificateId);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!certificateId) {
            setCert(null);
            setLoading(false);
            return;
        }
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.LICENSES.CERTIFICATE_DETAIL(certificateId));
                setCert(res.data);
            } catch (e) {
                setError(handleError(e));
            } finally {
                setLoading(false);
            }
        })();
    }, [certificateId]);

    // Sənəd hələ yaradılmayıb (müraciət hər iki mərhələdə təsdiqlənməyib).
    if (!certificateId) {
        return (
            <Box sx={{
                border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, backgroundColor: '#fff',
                py: 6, textAlign: 'center',
            }}>
                <HourglassEmptyIcon sx={{fontSize: 30, color: GOV.textMuted, mb: 1}}/>
                <Typography sx={{fontSize: 14, fontWeight: 700, color: GOV.textPrimary, mb: 0.5}}>
                    Rəsmi sənəd hələ yaradılmayıb
                </Typography>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, maxWidth: 380, mx: 'auto'}}>
                    Müraciət hər iki mərhələdə təsdiqləndikdən sonra rəsmi sənəd avtomatik yaradılacaq
                    və bu bölmədə görünəcək.
                </Typography>
            </Box>
        );
    }

    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                <CircularProgress size={24}/>
            </Box>
        );
    }

    if (error || !cert) {
        return (
            <Typography sx={{fontSize: 13, color: GOV.textMuted, textAlign: 'center', py: 4}}>
                {error || 'Sənəd yüklənə bilmədi.'}
            </Typography>
        );
    }

    const pdfSrc = `/api/${NEXT_API_ENDPOINTS.LICENSES.CERTIFICATE_PDF(cert.id)}`;
    const done = cert.status === 'tamamlandi';

    return (
        <Box sx={{border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, backgroundColor: '#fff', p: 3}}>
            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 2.5}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.25}}>
                    <Box sx={{
                        width: 36, height: 36, borderRadius: 1.5, backgroundColor: `${GOV.gold}1A`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                        <VerifiedOutlinedIcon sx={{fontSize: 18, color: GOV.goldDark}}/>
                    </Box>
                    <Box>
                        <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>
                            {cert.number}
                        </Typography>
                        <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.2}}>
                            {done && <CheckCircleOutlineIcon sx={{fontSize: 13, color: '#1E7A3C'}}/>}
                            <Typography sx={{fontSize: 11.5, color: done ? '#1E7A3C' : GOV.textMuted}}>
                                {done ? 'Tamamlandı' : 'Qaralama'}{cert.is_signed ? ' · İmzalanıb' : ''}
                            </Typography>
                        </Box>
                    </Box>
                </Box>

                <Box sx={{display: 'flex', gap: 1}}>
                    <Button
                        component="a" href={`${pdfSrc}?download=1`} target="_blank" rel="noopener noreferrer"
                        startIcon={<PictureAsPdfIcon sx={{fontSize: 16}}/>}
                        sx={{
                            textTransform: 'none', fontWeight: 700, fontSize: 12.5, color: GOV.textPrimary,
                            border: `1px solid ${GOV.cardBorder}`, px: 1.75,
                        }}
                    >
                        PDF yüklə
                    </Button>
                    <Button
                        onClick={() => router.push(APP_ROUTES.SENED(cert.id))}
                        startIcon={<OpenInNewIcon sx={{fontSize: 16}}/>}
                        sx={{
                            textTransform: 'none', fontWeight: 700, fontSize: 12.5, color: '#fff',
                            backgroundColor: GOV.navy, px: 1.75, '&:hover': {backgroundColor: GOV.navyMid},
                        }}
                    >
                        Tam görünüş
                    </Button>
                </Box>
            </Box>

            <PdfViewer src={pdfSrc} title={cert.number} height="60vh"/>
        </Box>
    );
}
"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import {useRouter, useParams} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import CertificateSignDialog from "@/components/atoms/CertificateSignDialog";
import PdfViewer from "../../../../components/atoms/PdfViewer";

function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('az-AZ');
}

function formatDateTime(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleString('az-AZ', {dateStyle: 'medium', timeStyle: 'short'});
}

function displayValue(field, rawValue) {
    if (rawValue === undefined || rawValue === null || rawValue === '') return '-';
    if (field.type === 'select') {
        const match = (field.options || []).find(([value]) => value === rawValue);
        return match ? match[1] : rawValue;
    }
    if (field.type === 'date') return formatDate(rawValue);
    return String(rawValue);
}

function InfoRow({label, value}) {
    return (
        <Box>
            <Typography sx={{fontSize: 11, fontWeight: 700, color: GOV.textMuted, textTransform: 'uppercase', letterSpacing: 0.3, mb: 0.4}}>
                {label}
            </Typography>
            <Typography sx={{fontSize: 13.5, color: GOV.textPrimary}}>
                {value || '-'}
            </Typography>
        </Box>
    );
}

function SectionCard({title, children}) {
    return (
        <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: 3, mb: 3}}>
            <Typography sx={{fontSize: 14, fontWeight: 700, color: GOV.textPrimary, mb: 2}}>
                {title}
            </Typography>
            {children}
        </Box>
    );
}

function CertificateStatusChip({status}) {
    const done = status === 'tamamlandi';
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.5, py: 0.6,
            borderRadius: 5, fontSize: 12.5, fontWeight: 700,
            backgroundColor: done ? '#E8F5EC' : '#FFF6E5',
            color: done ? '#1E7A3C' : '#9A6A00',
        }}>
            <Box sx={{width: 7, height: 7, borderRadius: '50%', backgroundColor: done ? '#1E7A3C' : '#C9982B'}}/>
            {done ? 'Tamamlandı' : 'Qaralama'}
        </Box>
    );
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

export default function Page() {
    const router = useRouter();
    const params = useParams();
    const {enqueueSnackbar} = useSnackbar();
    const [cert, setCert] = useState(null);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [tab, setTab] = useState('melumatlar');
    const [signDialogMethod, setSignDialogMethod] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.LICENSES.CERTIFICATE_DETAIL(params.id));
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
    }, [params.id]);

    const handleComplete = async () => {
        setCompleting(true);
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.LICENSES.CERTIFICATE_COMPLETE(params.id));
            setCert(res.data);
            enqueueSnackbar('Sənəd tamamlandı olaraq işarələndi.', {variant: 'success'});
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setCompleting(false);
        }
    };

    const handleSignConfirm = async (phone) => {
        const res = await service_api.post(NEXT_API_ENDPOINTS.LICENSES.CERTIFICATE_SIGN(params.id), {
            method: signDialogMethod, phone,
        });
        setCert(res.data);
        enqueueSnackbar('Sənəd uğurla imzalandı.', {variant: 'success'});
    };

    if (loading) {
        return (
            <AppShell>
                <Box sx={{display: 'flex', justifyContent: 'center', py: 10}}>
                    <CircularProgress size={26}/>
                </Box>
            </AppShell>
        );
    }

    if (!cert) {
        return (
            <AppShell>
                <Box sx={{textAlign: 'center', py: 10}}>
                    <Typography sx={{fontSize: 14, color: GOV.textMuted}}>Sənəd tapılmadı.</Typography>
                </Box>
            </AppShell>
        );
    }

    const schema = cert.schema || [];
    const pdfSrc = `/api/${NEXT_API_ENDPOINTS.LICENSES.CERTIFICATE_PDF(cert.id)}`;

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Ana səhifə
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>{cert.number}</span>
                </Typography>

                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 3}}>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                        <Box sx={{
                            width: 44, height: 44, borderRadius: 2, backgroundColor: `${GOV.gold}1A`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}>
                            <VerifiedOutlinedIcon sx={{fontSize: 22, color: GOV.goldDark}}/>
                        </Box>
                        <Box>
                            <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary}}>
                                {cert.category} lisenziyası
                            </Typography>
                            <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mt: 0.3}}>
                                {cert.number} · Müraciət: {cert.permit_number}
                            </Typography>
                        </Box>
                    </Box>
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                        <CertificateStatusChip status={cert.status}/>
                        <Button
                            component="a"
                            href={`/api/${NEXT_API_ENDPOINTS.LICENSES.CERTIFICATE_PDF(cert.id)}?download=1`}
                            target="_blank" rel="noopener noreferrer"
                            startIcon={<PictureAsPdfIcon sx={{fontSize: 17}}/>}
                            sx={{
                                textTransform: 'none', fontWeight: 700, fontSize: 12.5,
                                color: GOV.textPrimary, border: `1px solid ${GOV.cardBorder}`, px: 1.75,
                            }}
                        >
                            PDF yüklə
                        </Button>
                    </Box>
                </Box>

                <Tabs
                    value={tab} onChange={(e, v) => setTab(v)}
                    sx={{mb: 3, minHeight: 36, '& .MuiTab-root': {minHeight: 36, textTransform: 'none', fontWeight: 700, fontSize: 13}}}
                >
                    <Tab value="melumatlar" label="Məlumatlar"/>
                    <Tab value="sened" label="Sənəd görünüşü"/>
                </Tabs>

                {tab === 'melumatlar' && (
                    <>
                        <SectionCard title="Əsas məlumatlar">
                            <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr 1fr'}}}>
                                <InfoRow label="Müəssisə" value={cert.applicant_name}/>
                                <InfoRow label="Verilmə tarixi" value={formatDate(cert.issue_date)}/>
                                <InfoRow label="Bitmə tarixi" value={formatDate(cert.expiry_date)}/>
                            </Box>
                        </SectionCard>

                        <SectionCard title="Lisenziya anketi">
                            {schema.length === 0 ? (
                                <Typography sx={{fontSize: 13, color: GOV.textMuted}}>
                                    Bu sənəd növü üçün anket sahələri təyin olunmayıb.
                                </Typography>
                            ) : (
                                <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}}}>
                                    {schema.map((field) => (
                                        <InfoRow
                                            key={field.key} label={field.label}
                                            value={displayValue(field, cert.form_data?.[field.key])}
                                        />
                                    ))}
                                </Box>
                            )}
                        </SectionCard>

                        <Box sx={{
                            backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: 3,
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2,
                        }}>
                            {cert.status === 'tamamlandi' ? (
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <CheckCircleOutlineIcon sx={{fontSize: 20, color: '#1E7A3C'}}/>
                                    <Typography sx={{fontSize: 13, color: GOV.textPrimary}}>
                                        {cert.completed_by_name ? `${cert.completed_by_name} tərəfindən` : ''} tamamlandı
                                        {cert.completed_at ? ` · ${formatDateTime(cert.completed_at)}` : ''}
                                    </Typography>
                                </Box>
                            ) : (
                                <Typography sx={{fontSize: 13, color: GOV.textMuted, maxWidth: 480}}>
                                    Lisenziyanız artıq qüvvədədir. "Tamamlandı" düyməsi yalnız sənədi nəzərdən
                                    keçirdiyinizi qeyd edir - basmasanız da lisenziya etibarlı olaraq qalır.
                                </Typography>
                            )}

                            {cert.status !== 'tamamlandi' && (
                                <Button
                                    variant="contained" disabled={completing} onClick={handleComplete}
                                    startIcon={completing ? <CircularProgress size={14} color="inherit"/> : <CheckCircleOutlineIcon/>}
                                    sx={{
                                        backgroundColor: GOV.navySoft, textTransform: 'none', fontWeight: 600,
                                        px: 3, py: 1, '&:hover': {backgroundColor: GOV.navy},
                                    }}
                                >
                                    Tamamlandı
                                </Button>
                            )}
                        </Box>
                    </>
                )}

                {tab === 'sened' && (
                    <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: 3}}>
                        {cert.is_signed && (
                            <SignedBadge method={cert.signature_method} phone={cert.signed_phone} signedAt={cert.signed_at}/>
                        )}

                        <Box sx={{mb: 3}}>
                            <PdfViewer src={pdfSrc} title={cert.number}/>
                        </Box>

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
                    </Box>
                )}
            </Box>

            <CertificateSignDialog
                open={!!signDialogMethod} method={signDialogMethod}
                onClose={() => setSignDialogMethod(null)}
                onConfirm={handleSignConfirm}
            />
        </AppShell>
    );
}
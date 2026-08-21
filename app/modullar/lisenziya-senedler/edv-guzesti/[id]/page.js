"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import DownloadIcon from '@mui/icons-material/Download';
import {useRouter, useParams} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import PermitStatusChip from "@/components/atoms/licenses/PermitStatusChip";
import CertificateEmbed from "@/components/atoms/CertificateEmbed";

function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('az-AZ');
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

export default function Page() {
    const router = useRouter();
    const params = useParams();
    const {enqueueSnackbar} = useSnackbar();
    const [doc, setDoc] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.LICENSES.PERMIT_DETAIL(params.id));
                setDoc(res.data);
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
            } finally {
                setLoading(false);
            }
        })();
    }, [params.id]);

    if (loading) {
        return (
            <AppShell>
                <Box sx={{display: 'flex', justifyContent: 'center', py: 10}}>
                    <CircularProgress size={26}/>
                </Box>
            </AppShell>
        );
    }

    if (!doc) {
        return (
            <AppShell>
                <Box sx={{textAlign: 'center', py: 10}}>
                    <Typography sx={{fontSize: 14, color: GOV.textMuted}}>Sənəd tapılmadı.</Typography>
                </Box>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Ana səhifə
                    </Link>
                    {' / '}
                    <Link component="button" onClick={() => router.push(APP_ROUTES.EDV_GUZESTI)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        ƏDV güzəşt icazə sənədi
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>{doc.number}</span>
                </Typography>

                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 3}}>
                    <Box>
                        <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary}}>
                            {doc.title || doc.category}
                        </Typography>
                        <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mt: 0.3}}>
                            {doc.number} · {doc.category}
                        </Typography>
                    </Box>
                    <PermitStatusChip status={doc.status}/>
                </Box>

                <SectionCard title="Sənəd məlumatları">
                    <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr 1fr'}}}>
                        <InfoRow label="Verilmə tarixi" value={formatDate(doc.issue_date)}/>
                        <InfoRow label="Bitmə tarixi" value={formatDate(doc.expiry_date)}/>
                        <InfoRow label="Müraciət üsulu" value={doc.submission_mode === 'file' ? 'Fayl yüklə' : 'Elektron müraciət forması'}/>
                    </Box>
                </SectionCard>

                <SectionCard title="Rəsmi sənəd">
                    <CertificateEmbed certificateId={doc.certificate_id}/>
                </SectionCard>

                <SectionCard title="Müraciətçi məlumatları">
                    <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}}}>
                        <InfoRow label="Müəssisənin tam adı" value={doc.applicant_name}/>
                        <InfoRow label="VÖEN" value={doc.voen}/>
                        <InfoRow label="FİN kod" value={doc.fin_kod}/>
                        <InfoRow label="Telefon" value={doc.phone}/>
                        <InfoRow label="E-poçt" value={doc.email}/>
                        <InfoRow label="Departament/Şöbə" value={doc.department}/>
                        <InfoRow label="Vəzifə" value={doc.position}/>
                    </Box>
                </SectionCard>

                {doc.submission_mode === 'file' ? (
                    <SectionCard title="Yüklənmiş sənədlər">
                        {(doc.files || []).length === 0 ? (
                            <Typography sx={{fontSize: 13, color: GOV.textMuted}}>Fayl yüklənməyib.</Typography>
                        ) : (
                            <Box sx={{display: 'grid', gap: 1.25}}>
                                {doc.files.map((f) => (
                                    <Box key={f.id} sx={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        border: `1px solid ${GOV.cardBorder}`, borderRadius: 1.5, px: 2, py: 1.25,
                                    }}>
                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.25}}>
                                            <InsertDriveFileIcon sx={{fontSize: 17, color: GOV.navySoft}}/>
                                            <Box>
                                                <Typography sx={{fontSize: 12.5, fontWeight: 600, color: GOV.textPrimary}}>
                                                    {f.field_label}
                                                </Typography>
                                                <Typography sx={{fontSize: 11.5, color: GOV.textMuted}}>
                                                    {f.original_name}
                                                </Typography>
                                            </Box>
                                        </Box>
                                        <Link href={f.file} target="_blank" rel="noopener noreferrer">
                                            <DownloadIcon sx={{fontSize: 18, color: GOV.textMuted}}/>
                                        </Link>
                                    </Box>
                                ))}
                            </Box>
                        )}
                    </SectionCard>
                ) : (
                    <SectionCard title="Lisenziya anketi">
                        <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}}}>
                            {Object.entries(doc.form_data || {}).map(([key, value]) => (
                                <InfoRow key={key} label={key.replaceAll('_', ' ')} value={value}/>
                            ))}
                        </Box>
                    </SectionCard>
                )}
            </Box>
        </AppShell>
    );
}
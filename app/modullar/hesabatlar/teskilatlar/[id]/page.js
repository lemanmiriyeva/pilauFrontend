"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {useRouter, useParams} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import PermitStatusChip from "@/components/atoms/licenses/PermitStatusChip";
import DateRangeFilter from "@/components/atoms/reports/DateRangeFilter";
import {docTypeDetailRoute} from "@/components/atoms/reports/docTypeRoutes";
import {
    StatCard,
    SectionCard,
    TimeSeriesChart,
    StatusBreakdownBars,
    DocTypePieChart
} from "@/components/atoms/reports/StatsWidgets";

function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('az-AZ');
}

export default function Page() {
    const router = useRouter();
    const params = useParams();
    const {enqueueSnackbar} = useSnackbar();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({dateFrom: '', dateTo: '', granularity: 'month'});

    const load = async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams();
            if (filters.dateFrom) qs.set('date_from', filters.dateFrom);
            if (filters.dateTo) qs.set('date_to', filters.dateTo);
            qs.set('granularity', filters.granularity);
            const res = await service_api.get(
                `${NEXT_API_ENDPOINTS.ORGANIZATIONS.STATS(params.id)}?${qs.toString()}`
            );
            setData(res.data);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, [params.id, filters.dateFrom, filters.dateTo, filters.granularity]);

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HESABATLAR)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Hesabatlar
                    </Link>
                    {' / '}
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HESABATLAR_TESKILATLAR)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Təşkilatlar
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>
                        {data?.organization?.full_name || '...'}
                                </span>
                </Typography>

                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mb: 0.5}}>
                    {data?.organization?.full_name || 'Təşkilat'}
                </Typography>
                <Typography sx={{fontSize: 13, color: GOV.textMuted, mb: 3}}>
                    Seçilmiş tarix aralığı üzrə statistika.
                </Typography>

                <Box sx={{mb: 3}}>
                    <DateRangeFilter
                        dateFrom={filters.dateFrom} dateTo={filters.dateTo} granularity={filters.granularity}
                        onChange={(patch) => setFilters((prev) => ({...prev, ...patch}))}
                    />
                </Box>

                {loading && !data ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                        <CircularProgress size={26}/>
                    </Box>
                ) : !data ? null : (
                    <>
                        <Box sx={{display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap'}}>
                            <StatCard label="Ümumi sənəd" value={data.total}/>
                            <StatCard label="Aktiv" value={data.status_breakdown?.aktiv || 0}/>
                            <StatCard label="Gözlənilir" value={data.status_breakdown?.gozleyir || 0}/>
                        </Box>

                        <Box sx={{
                            display: 'grid', gap: 2.5, mb: 2.5,
                            gridTemplateColumns: {xs: '1fr', md: '1.4fr 1fr'},
                        }}>
                            <SectionCard title="Zaman üzrə sənəd sayı">
                                <TimeSeriesChart series={data.series} granularity={filters.granularity}/>
                            </SectionCard>
                            <SectionCard title="Status bölgüsü">
                                <StatusBreakdownBars statusBreakdown={data.status_breakdown}/>
                            </SectionCard>
                        </Box>

                        <SectionCard title="Kateqoriya üzrə bölgü" sx={{mb: 2.5}}>
                            <DocTypePieChart byDocType={data.by_doc_type}/>
                        </SectionCard>

                        <SectionCard title="Son sənədlər">
                            {(!data.documents || data.documents.length === 0) ? (
                                <Box sx={{textAlign: 'center', py: 4}}>
                                    <InfoOutlinedIcon sx={{fontSize: 26, color: GOV.textMuted, mb: 1}}/>
                                    <Typography sx={{fontSize: 13, color: GOV.textMuted}}>
                                        Bu aralıqda sənəd yoxdur.
                                    </Typography>
                                </Box>
                            ) : (
                                <Box sx={{overflowX: 'auto'}}>
                                    <Box component="table"
                                         sx={{width: '100%', borderCollapse: 'collapse', minWidth: 560}}>
                                        <Box component="thead">
                                            <Box component="tr" sx={{borderBottom: `1px solid ${GOV.cardBorder}`}}>
                                                {['Nömrə', 'Başlıq', 'Kateqoriya', 'Status', 'Tarix'].map((h) => (
                                                    <Box component="th" key={h} sx={{
                                                        textAlign: 'left',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        color: GOV.textMuted,
                                                        textTransform: 'uppercase',
                                                        letterSpacing: 0.4,
                                                        px: 1.5,
                                                        py: 1.25,
                                                    }}>
                                                        {h}
                                                    </Box>
                                                ))}
                                            </Box>
                                        </Box>
                                        <Box component="tbody">
                                            {data.documents.map((doc) => (
                                                <Box
                                                    component="tr" key={doc.id}
                                                    onClick={() => router.push(docTypeDetailRoute(doc.doc_type, doc.id))}
                                                    sx={{
                                                        borderBottom: `1px solid ${GOV.cardBorder}`, cursor: 'pointer',
                                                        '&:hover': {backgroundColor: GOV.pageBg},
                                                        '&:last-of-type': {borderBottom: 'none'},
                                                    }}
                                                >
                                                    <Box component="td" sx={{
                                                        px: 1.5,
                                                        py: 1.25,
                                                        fontSize: 13,
                                                        fontWeight: 600,
                                                        color: GOV.textPrimary
                                                    }}>
                                                        {doc.number}
                                                    </Box>
                                                    <Box component="td"
                                                         sx={{px: 1.5, py: 1.25, fontSize: 13, color: GOV.textPrimary}}>
                                                        {doc.title || '-'}
                                                    </Box>
                                                    <Box component="td"
                                                         sx={{px: 1.5, py: 1.25, fontSize: 12.5, color: GOV.textMuted}}>
                                                        {doc.category}
                                                    </Box>
                                                    <Box component="td" sx={{px: 1.5, py: 1.25}}>
                                                        <PermitStatusChip status={doc.status}/>
                                                    </Box>
                                                    <Box component="td"
                                                         sx={{px: 1.5, py: 1.25, fontSize: 12.5, color: GOV.textMuted}}>
                                                        {formatDate(doc.created_at)}
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                            )}
                        </SectionCard>
                    </>
                )}
            </Box>
        </AppShell>
    );
}
"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES, LICENSE_TYPES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import DateRangeFilter from "@/components/atoms/reports/DateRangeFilter";
import {
    StatCard, SectionCard, TimeSeriesChart, StatusBreakdownBars, DocTypePieChart, ByOrganizationBarChart,
} from "@/components/atoms/reports/StatsWidgets";

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({dateFrom: '', dateTo: '', granularity: 'month', docType: ''});

    const load = async () => {
        setLoading(true);
        try {
            const qs = new URLSearchParams();
            if (filters.dateFrom) qs.set('date_from', filters.dateFrom);
            if (filters.dateTo) qs.set('date_to', filters.dateTo);
            if (filters.docType) qs.set('doc_type', filters.docType);
            qs.set('granularity', filters.granularity);
            const res = await service_api.get(
                `${NEXT_API_ENDPOINTS.LICENSES.STATS_OVERVIEW}?${qs.toString()}`
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
    }, [filters.dateFrom, filters.dateTo, filters.granularity, filters.docType]);

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HESABATLAR)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Hesabatlar
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Statistik məlumatlar</span>
                </Typography>

                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mb: 0.5}}>
                    Statistik məlumatlar
                </Typography>
                <Typography sx={{fontSize: 13, color: GOV.textMuted, mb: 3}}>
                    Bütün təşkilatlar üzrə ümumi lisenziya statistikası.
                </Typography>

                <Box sx={{display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center', mb: 3}}>
                    <FormControl size="small" sx={{minWidth: 190}}>
                        <InputLabel>Kateqoriya</InputLabel>
                        <Select
                            label="Kateqoriya" value={filters.docType}
                            onChange={(e) => setFilters((prev) => ({...prev, docType: e.target.value}))}
                            sx={{backgroundColor: '#fff'}}
                        >
                            <MenuItem value="">Bütün kateqoriyalar</MenuItem>
                            {LICENSE_TYPES.map((lt) => (
                                <MenuItem key={lt.key} value={lt.key}>{lt.label}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
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
                            <StatCard label="Təşkilat sayı" value={data.by_organization?.length || 0}/>
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

                        <Box sx={{
                            display: 'grid', gap: 2.5,
                            gridTemplateColumns: {xs: '1fr', md: data.by_doc_type?.length ? '1fr 1.2fr' : '1fr'},
                        }}>
                            {!!data.by_doc_type?.length && (
                                <SectionCard title="Kateqoriya üzrə bölgü">
                                    <DocTypePieChart byDocType={data.by_doc_type}/>
                                </SectionCard>
                            )}
                            <SectionCard title="Təşkilat üzrə bölgü (ilk 8)">
                                <ByOrganizationBarChart byOrganization={data.by_organization}/>
                            </SectionCard>
                        </Box>
                    </>
                )}
            </Box>
        </AppShell>
    );
}
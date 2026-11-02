"use client"
import React, {useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";
import {docTypeDetailRoute} from "@/components/atoms/reports/docTypeRoutes";
import {SimpleTable, StatusChip, formatDate} from "./shared";

const PERMIT_FILTERS = [
    {key: 'all', label: 'Hamısı', types: null},
    {key: 'idxal', label: 'İdxal', types: ['idxal']},
    {key: 'ixrac', label: 'İxrac', types: ['ixrac']},
    {key: 'edv', label: 'ƏDV / Gömrük güzəşti', types: ['edvden_azadolma', 'gomrukden_azadolma']},
    {key: 'satis', label: 'Xüsusi satış', types: ['xususi_satis']},
];

/**
 * group="license" -> Xüsusi/Ümumi Lisenziyalar; group="permit" -> İdxal/İxrac/ƏDV/Xüsusi satış icazə sənədləri.
 * Lisenziyalar müddətsizdir (bitmə tarixi boşdur), icazə sənədlərinin müddəti sənəd növündən asılıdır.
 */
export default function DocumentsTab({orgId, group}) {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await service_api.get(`${NEXT_API_ENDPOINTS.ORGANIZATIONS.PERMIT_DOCUMENTS(orgId)}?group=${group}`);
                setRows(Array.isArray(res.data) ? res.data : []);
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
            } finally {
                setLoading(false);
            }
        })();
    }, [orgId, group]);

    const visible = useMemo(() => {
        const f = PERMIT_FILTERS.find((x) => x.key === filter);
        if (group !== 'permit' || !f?.types) return rows;
        return rows.filter((r) => f.types.includes(r.doc_type));
    }, [rows, filter, group]);

    const columns = [
        {label: 'NÖMRƏ', width: '1.3fr', render: (r) => <b>{r.number}</b>},
        {label: 'NÖVÜ', width: '1.3fr', render: (r) => r.category},
        {label: 'VERİLMƏ TARİXİ', width: '1fr', render: (r) => (r.issue_date ? formatDate(r.issue_date) : 'İmza gözlənilir')},
        {label: 'MÜDDƏT', width: '1fr', render: (r) => (r.expiry_date ? `${formatDate(r.expiry_date)}-dək` : 'Müddətsiz')},
        {label: 'STATUS', width: '0.9fr', render: (r) => <StatusChip status={r.status}/>},
    ];

    if (loading) {
        return <Box sx={{display: 'flex', justifyContent: 'center', py: 5}}><CircularProgress size={22}/></Box>;
    }

    return (
        <Box>
            {group === 'permit' && (
                <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2}}>
                    {PERMIT_FILTERS.map((f) => {
                        const count = f.types ? rows.filter((r) => f.types.includes(r.doc_type)).length : rows.length;
                        const active = filter === f.key;
                        return (
                            <Chip
                                key={f.key} clickable onClick={() => setFilter(f.key)}
                                label={`${f.label} (${count})`}
                                sx={{
                                    fontWeight: 600, fontSize: 12.5,
                                    backgroundColor: active ? GOV.navy : '#fff', color: active ? '#fff' : GOV.textPrimary,
                                    border: `1px solid ${active ? GOV.navy : GOV.cardBorder}`,
                                    '&:hover': {backgroundColor: active ? GOV.navyMid : GOV.pageBg},
                                }}
                            />
                        );
                    })}
                </Box>
            )}
            <SimpleTable
                columns={columns} rows={visible}
                onRowClick={(r) => router.push(docTypeDetailRoute(r.doc_type, r.id))}
                empty={group === 'license' ? 'Bu təşkilata hələ lisenziya verilməyib.' : 'Bu təşkilat üzrə icazə sənədi tapılmadı.'}
            />
            <Typography sx={{fontSize: 11.5, color: GOV.textMuted, mt: 1.5}}>
                Sətirə klikləyərək sənədin təfərrüatına keçə bilərsiniz.
            </Typography>
        </Box>
    );
}

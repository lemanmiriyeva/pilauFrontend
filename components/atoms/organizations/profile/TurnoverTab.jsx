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

const SCOPE_FILTERS = [
    {key: 'all', label: 'Hamısı'},
    {key: 'xarici', label: 'Xarici'},
    {key: 'yerli', label: 'Yerli'},
];

const DIRECTION_FILTERS = [
    {key: 'all', label: 'İdxal + İxrac'},
    {key: 'idxal', label: 'İdxal'},
    {key: 'ixrac', label: 'İxrac'},
];

const DIRECTION_LABELS = {idxal: 'İdxal', ixrac: 'İxrac', daxili_satis: 'Daxili satış'};
const SCOPE_LABELS = {xarici: 'Xarici', yerli: 'Yerli'};

const fmtQty = (v) => (v === null || v === undefined
    ? '—'
    : Number(v).toLocaleString('az-AZ', {maximumFractionDigits: 2}));

function SummaryCard({title, data}) {
    return (
        <Box sx={{flex: '1 1 280px', backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: 2.25}}>
            <Typography sx={{fontSize: 12, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.5, mb: 1}}>
                {title.toUpperCase()}
            </Typography>
            <Typography sx={{fontSize: 26, fontWeight: 800, color: GOV.textPrimary, lineHeight: 1.1}}>
                {data?.count ?? 0}
                <Typography component="span" sx={{fontSize: 12.5, fontWeight: 600, color: GOV.textMuted, ml: 0.75}}>
                    sənəd
                </Typography>
            </Typography>
            <Box sx={{display: 'flex', gap: 3, mt: 1.5, flexWrap: 'wrap'}}>
                {[
                    ['Təsdiq olunmuş', data?.approved_qty],
                    ['Faktiki', data?.actual_qty],
                    ['Qalıq', data?.remaining_qty],
                ].map(([label, value]) => (
                    <Box key={label}>
                        <Typography sx={{fontSize: 11, color: GOV.textMuted}}>{label}</Typography>
                        <Typography sx={{fontSize: 14, fontWeight: 700, color: GOV.textPrimary}}>{fmtQty(value)}</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

function FilterChips({options, value, onChange, countOf}) {
    return (
        <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
            {options.map((f) => {
                const active = value === f.key;
                return (
                    <Chip
                        key={f.key} clickable onClick={() => onChange(f.key)}
                        label={`${f.label} (${countOf(f.key)})`}
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
    );
}

/**
 * Dövriyyə: təşkilatın xarici və yerli idxal/ixrac sənədləri - nə (məhsul), nə qədər (təsdiq olunmuş /
 * faktiki / qalıq). İLKİN VERSİYA: təsnifat qaydası backend-də (OrganizationTurnoverView._classify).
 */
export default function TurnoverTab({orgId}) {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [data, setData] = useState(null);
    const [scope, setScope] = useState('all');
    const [direction, setDirection] = useState('all');

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.TURNOVER(orgId));
                setData(res.data);
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
                setData({summary: {}, results: []});
            }
        })();
    }, [orgId]);

    const rows = data?.results || [];

    const byScope = useMemo(
        () => rows.filter((r) => scope === 'all' || r.scope === scope),
        [rows, scope]
    );
    const visible = useMemo(
        () => byScope.filter((r) => direction === 'all' || r.direction === direction),
        [byScope, direction]
    );

    if (!data) {
        return <Box sx={{display: 'flex', justifyContent: 'center', py: 5}}><CircularProgress size={22}/></Box>;
    }

    const columns = [
        {label: 'SƏNƏD №', width: '1.1fr', render: (r) => <b>{r.number}</b>},
        {label: 'TƏYİNAT', width: '0.8fr', render: (r) => SCOPE_LABELS[r.scope]},
        {label: 'NÖV', width: '0.9fr', render: (r) => DIRECTION_LABELS[r.direction] || r.direction},
        {label: 'NƏ (MƏHSUL)', width: '1.6fr', render: (r) => r.product || '—'},
        {label: 'TƏSDİQ OLUNMUŞ', width: '1fr', render: (r) => fmtQty(r.approved_qty)},
        {label: 'FAKTİKİ', width: '0.9fr', render: (r) => fmtQty(r.actual_qty)},
        {label: 'QALIQ', width: '0.8fr', render: (r) => fmtQty(r.remaining_qty)},
        {label: 'TARİX', width: '0.9fr', render: (r) => (r.issue_date ? formatDate(r.issue_date) : '—')},
        {label: 'STATUS', width: '0.9fr', render: (r) => <StatusChip status={r.status}/>},
    ];

    return (
        <Box>
            <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2.5}}>
                <SummaryCard title="Xarici dövriyyə" data={data.summary?.xarici}/>
                <SummaryCard title="Yerli dövriyyə" data={data.summary?.yerli}/>
            </Box>

            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2}}>
                <FilterChips
                    options={SCOPE_FILTERS} value={scope}
                    onChange={(v) => {
                        setScope(v);
                        setDirection('all');
                    }}
                    countOf={(k) => (k === 'all' ? rows.length : rows.filter((r) => r.scope === k).length)}
                />
                <FilterChips
                    options={DIRECTION_FILTERS} value={direction} onChange={setDirection}
                    countOf={(k) => (k === 'all' ? byScope.length : byScope.filter((r) => r.direction === k).length)}
                />
            </Box>

            <SimpleTable
                columns={columns} rows={visible}
                onRowClick={(r) => router.push(docTypeDetailRoute(r.doc_type, r.id))}
                empty="Bu təşkilat üzrə dövriyyə sənədi tapılmadı."
            />
            <Typography sx={{fontSize: 11.5, color: GOV.textMuted, mt: 1.5}}>
                İlkin versiya: miqdar sahələri (təsdiq olunmuş / faktiki / qalıq) sənəd formasında doldurulubsa göstərilir,
                əks halda "—" görünür. Sətirə klikləyərək sənədin təfərrüatına keçə bilərsiniz.
            </Typography>
        </Box>
    );
}
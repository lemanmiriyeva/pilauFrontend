"use client"
import React, {useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";
import {SimpleTable} from "./shared";
import {DIRECTION_LABELS, SCOPE_LABELS, fmtAmount, fmtDate, fmtQuantity} from "@/components/atoms/turnover/shared";

const SCOPE_FILTERS = [{key: 'all', label: 'Hamısı'}, {key: 'xarici', label: 'Xarici'}, {key: 'yerli', label: 'Yerli'}];
const DIRECTION_FILTERS = [{key: 'all', label: 'İdxal + İxrac'}, {key: 'idxal', label: 'İdxal'}, {key: 'ixrac', label: 'İxrac'}];

function SummaryCard({title, data}) {
    return (
        <Box sx={{flex: '1 1 240px', backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: 2.25}}>
            <Typography sx={{fontSize: 12, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.5, mb: 1}}>{title.toUpperCase()}</Typography>
            <Typography sx={{fontSize: 26, fontWeight: 800, color: GOV.textPrimary, lineHeight: 1.1}}>
                {data?.count ?? 0}
                <Typography component="span" sx={{fontSize: 12.5, fontWeight: 600, color: GOV.textMuted, ml: 0.75}}>qeyd</Typography>
            </Typography>
            <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mt: 1}}>
                İdxal: <b>{data?.idxal ?? 0}</b> · İxrac: <b>{data?.ixrac ?? 0}</b>
            </Typography>
        </Box>
    );
}

function FilterChips({options, value, onChange, countOf}) {
    return (
        <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>
            {options.map((f) => {
                const active = value === f.key;
                return (
                    <Chip key={f.key} clickable onClick={() => onChange(f.key)} label={`${f.label} (${countOf(f.key)})`}
                          sx={{
                              fontWeight: 600, fontSize: 12.5,
                              backgroundColor: active ? GOV.navy : '#fff', color: active ? '#fff' : GOV.textPrimary,
                              border: `1px solid ${active ? GOV.navy : GOV.cardBorder}`,
                              '&:hover': {backgroundColor: active ? GOV.navyMid : GOV.pageBg},
                          }}/>
                );
            })}
        </Box>
    );
}

/** Təşkilatın detalı -> Dövriyyə: həmin təşkilatın xarici/yerli idxal-ixrac qeydləri (Dövriyyələr modulunda daxil edilir). */
export default function TurnoverTab({orgId}) {
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
                enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
                setData({summary: {}, results: []});
            }
        })();
    }, [orgId]);

    const rows = data?.results || [];
    const byScope = useMemo(() => rows.filter((r) => scope === 'all' || r.scope === scope), [rows, scope]);
    const visible = useMemo(() => byScope.filter((r) => direction === 'all' || r.direction === direction), [byScope, direction]);

    if (!data) return <Box sx={{display: 'flex', justifyContent: 'center', py: 5}}><CircularProgress size={22}/></Box>;

    const columns = [
        {label: 'TARİX', width: '0.9fr', render: (r) => fmtDate(r.date)},
        {label: 'TƏYİNAT', width: '0.8fr', render: (r) => SCOPE_LABELS[r.scope]},
        {label: 'NÖV', width: '0.8fr', render: (r) => DIRECTION_LABELS[r.direction]},
        {label: 'SƏNƏD №', width: '1fr', render: (r) => r.document_number || '—'},
        {label: 'NƏ (MƏHSUL)', width: '1.6fr', render: (r) => <b>{r.product}</b>},
        {label: 'MİQDAR', width: '1fr', render: (r) => fmtQuantity(r)},
        {label: 'MƏBLƏĞ', width: '1fr', render: (r) => fmtAmount(r)},
    ];

    return (
        <Box>
            <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2.5}}>
                <SummaryCard title="Xarici dövriyyə" data={data.summary?.xarici}/>
                <SummaryCard title="Yerli dövriyyə" data={data.summary?.yerli}/>
            </Box>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.25, mb: 2}}>
                <FilterChips options={SCOPE_FILTERS} value={scope}
                             onChange={(v) => { setScope(v); setDirection('all'); }}
                             countOf={(k) => (k === 'all' ? rows.length : rows.filter((r) => r.scope === k).length)}/>
                <FilterChips options={DIRECTION_FILTERS} value={direction} onChange={setDirection}
                             countOf={(k) => (k === 'all' ? byScope.length : byScope.filter((r) => r.direction === k).length)}/>
            </Box>
            <SimpleTable columns={columns} rows={visible} empty="Bu təşkilat üzrə dövriyyə qeydi tapılmadı."/>
        </Box>
    );
}
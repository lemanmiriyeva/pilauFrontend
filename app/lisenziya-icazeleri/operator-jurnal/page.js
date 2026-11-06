"use client"
import React, {useCallback, useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import CircularProgress from '@mui/material/CircularProgress';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";

const PAGE_SIZE = 100;
const EMPTY = {operator: '', object_type: '', date_from: '', date_to: '', q: ''};

const fmtDateTime = (v) => {
    const d = new Date(v);
    return isNaN(d.getTime()) ? '-' : d.toLocaleString('az-AZ');
};

function ResultChip({code}) {
    const meta = code < 400
        ? {label: 'Uğurlu', bg: '#E8F5EC', fg: '#1E7A3C'}
        : (code === 401 || code === 403)
            ? {label: 'İcazə yoxdur', bg: '#FDECEC', fg: '#B42318'}
            : {label: `Xəta ${code}`, bg: '#FFF6E5', fg: '#9A6A00'};
    return (
        <Box sx={{display: 'inline-flex', px: 1.1, py: 0.3, borderRadius: 5, fontSize: 11.5, fontWeight: 700, backgroundColor: meta.bg, color: meta.fg}}>
            {meta.label}
        </Box>
    );
}

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [filters, setFilters] = useState(EMPTY);
    const [debouncedQ, setDebouncedQ] = useState('');
    const [meta, setMeta] = useState({operators: [], object_types: []});
    const [rows, setRows] = useState(null);
    const [total, setTotal] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);
    const [openId, setOpenId] = useState(null);
    const [ready, setReady] = useState(false);

    // Operatorlar səhifəsindən "Jurnal" düyməsi ilə gələndə (?operator=<id>) həmin operator seçilir
    useEffect(() => {
        const op = new URLSearchParams(window.location.search).get('operator');
        if (op) setFilters((p) => ({...p, operator: op}));
        setReady(true);
    }, []);

    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(filters.q), 350);
        return () => clearTimeout(t);
    }, [filters.q]);

    const buildParams = useCallback((offset) => {
        const params = new URLSearchParams({limit: String(PAGE_SIZE), offset: String(offset)});
        ['operator', 'object_type', 'date_from', 'date_to'].forEach((k) => filters[k] && params.set(k, filters[k]));
        if (debouncedQ.trim()) params.set('q', debouncedQ.trim());
        return params.toString();
    }, [filters.operator, filters.object_type, filters.date_from, filters.date_to, debouncedQ]);

    const load = useCallback(async () => {
        try {
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.WORKFLOW.OPERATOR_ACTIVITY}?${buildParams(0)}`);
            setRows(res.data.results || []);
            setTotal(res.data.total || 0);
            setMeta({operators: res.data.operators || [], object_types: res.data.object_types || []});
        } catch (e) {
            enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
            setRows((prev) => prev || []);
        }
    }, [buildParams]);

    useEffect(() => {
        if (ready) load();
    }, [load, ready]);

    const loadMore = async () => {
        setLoadingMore(true);
        try {
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.WORKFLOW.OPERATOR_ACTIVITY}?${buildParams(rows.length)}`);
            setRows((prev) => [...prev, ...(res.data.results || [])]);
        } catch (e) {
            enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
        } finally {
            setLoadingMore(false);
        }
    };

    const setF = (k) => (e) => setFilters((p) => ({...p, [k]: e.target.value}));
    const hasFilters = Object.values(filters).some((v) => String(v).trim() !== '');
    const GRID = '1.1fr 1.2fr 2fr 2fr 1.4fr 0.9fr';

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>Ana səhifə</Link>
                    {' / '}
                    <Link component="button" onClick={() => router.push('/lisenziya-icazeleri/operatorlar')}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>Operatorlar</Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Fəaliyyət jurnalı</span>
                </Typography>
                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>Operator fəaliyyət jurnalı</Typography>
                <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5, mb: 3}}>
                    Operatorların nomenklatura, təşkilat, lisenziya və icazə sənədləri üzrə etdiyi bütün əməliyyatlar. Qeydlər silinmir və dəyişdirilmir.
                </Typography>

                <Box sx={{
                    display: 'grid', gap: 1.5, p: 2, mb: 2.5, borderRadius: 2, backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`,
                    gridTemplateColumns: {xs: '1fr', md: '1.4fr 1.2fr 1fr 1fr 1.6fr auto'}, alignItems: 'center',
                }}>
                    <TextField select size="small" label="Operator" value={filters.operator} onChange={setF('operator')}>
                        <MenuItem value="">Hamısı</MenuItem>
                        {meta.operators.map((o) => (
                            <MenuItem key={o.user_id} value={String(o.user_id)}>{o.name}{o.is_active ? '' : ' (çıxarılıb)'}</MenuItem>
                        ))}
                    </TextField>
                    <TextField select size="small" label="Obyekt" value={filters.object_type} onChange={setF('object_type')}>
                        <MenuItem value="">Hamısı</MenuItem>
                        {meta.object_types.map((t) => <MenuItem key={t.key} value={t.key}>{t.label}</MenuItem>)}
                    </TextField>
                    <TextField size="small" type="date" label="Tarixdən" value={filters.date_from} onChange={setF('date_from')} InputLabelProps={{shrink: true}}/>
                    <TextField size="small" type="date" label="Tarixə qədər" value={filters.date_to} onChange={setF('date_to')} InputLabelProps={{shrink: true}}/>
                    <TextField size="small" label="Əməliyyat və ya obyekt üzrə axtar" value={filters.q} onChange={setF('q')}/>
                    <Button disabled={!hasFilters} onClick={() => setFilters(EMPTY)} sx={{textTransform: 'none', fontWeight: 700}}>Təmizlə</Button>
                </Box>

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflowX: 'auto'}}>
                    <Box sx={{minWidth: 980}}>
                        <Box sx={{
                            display: 'grid', gridTemplateColumns: GRID, gap: 1.5, px: 2.5, py: 1.5, backgroundColor: GOV.pageBg,
                            borderBottom: `1px solid ${GOV.cardBorder}`, fontSize: 11, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.4,
                        }}>
                            <span>VAXT</span><span>OPERATOR</span><span>ƏMƏLİYYAT</span><span>OBYEKT</span><span>TƏŞKİLAT</span><span>NƏTİCƏ</span>
                        </Box>
                        {rows === null ? (
                            <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}><CircularProgress size={26}/></Box>
                        ) : rows.length === 0 ? (
                            <Typography sx={{fontSize: 13.5, color: GOV.textMuted, textAlign: 'center', py: 5}}>Qeyd tapılmadı.</Typography>
                        ) : rows.map((a) => {
                            const open = openId === a.id;
                            return (
                                <Box key={a.id} sx={{borderBottom: `1px solid ${GOV.cardBorder}`, '&:last-of-type': {borderBottom: 'none'}}}>
                                    <Box onClick={() => setOpenId(open ? null : a.id)}
                                         sx={{display: 'grid', gridTemplateColumns: GRID, gap: 1.5, px: 2.5, py: 1.6, alignItems: 'center',
                                             cursor: 'pointer', '&:hover': {backgroundColor: GOV.pageBg}}}>
                                        <Typography sx={{fontSize: 12.5, color: GOV.textMuted}}>{fmtDateTime(a.created_at)}</Typography>
                                        <Typography sx={{fontSize: 13, fontWeight: 700}}>{a.operator_name || a.operator_username}</Typography>
                                        <Typography sx={{fontSize: 13}}>{a.action_label}</Typography>
                                        <Typography sx={{fontSize: 12.5, color: GOV.textPrimary}}>{a.object_label || '—'}</Typography>
                                        <Typography sx={{fontSize: 12.5, color: GOV.textMuted}}>{a.organization_name || '—'}</Typography>
                                        <ResultChip code={a.status_code}/>
                                    </Box>
                                    {open && (
                                        <Box sx={{px: 2.5, pb: 2, backgroundColor: GOV.pageBg}}>
                                            <Typography sx={{fontSize: 12, color: GOV.textMuted, mb: 0.75}}>
                                                {a.method} {a.path} · IP: {a.ip_address || '—'} · istifadəçi: {a.operator_username}
                                            </Typography>
                                            <Box component="pre" sx={{
                                                m: 0, p: 1.5, borderRadius: 1.5, backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`,
                                                fontSize: 12, overflowX: 'auto', whiteSpace: 'pre-wrap',
                                            }}>
                                                {Object.keys(a.detail || {}).length ? JSON.stringify(a.detail, null, 2) : 'Əlavə detal yoxdur.'}
                                            </Box>
                                        </Box>
                                    )}
                                </Box>
                            );
                        })}
                    </Box>
                </Box>

                {rows && (
                    <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5}}>
                        <Typography sx={{fontSize: 11.5, color: GOV.textMuted}}>Göstərilir: {rows.length} / {total}</Typography>
                        {rows.length < total && (
                            <Button size="small" disabled={loadingMore} onClick={loadMore} sx={{textTransform: 'none', fontWeight: 700}}>
                                {loadingMore ? 'Yüklənir...' : 'Daha çox göstər'}
                            </Button>
                        )}
                    </Box>
                )}
            </Box>
        </AppShell>
    );
}
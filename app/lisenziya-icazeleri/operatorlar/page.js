"use client"
import React, {useCallback, useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";

const todayStr = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const EMPTY_FORM = {first_name: '', last_name: '', username: '', email: '', phone: '', fin_kod: ''};

function StatusChip({op}) {
    const meta = op.is_enabled && op.manual_override
        ? {label: 'Baş admin açıb (limitsiz)', bg: '#E7EEFA', fg: '#1F4E9A'}
        : op.is_enabled
            ? {label: 'Aktiv', bg: '#E8F5EC', fg: '#1E7A3C'}
            : op.disabled_reason === 'manual'
                ? {label: 'Baş admin söndürüb', bg: '#FDECEC', fg: '#B42318'}
                : {label: 'Limitə çatıb', bg: '#FFF6E5', fg: '#9A6A00'};
    return (
        <Box sx={{display: 'inline-flex', px: 1.25, py: 0.4, borderRadius: 5, fontSize: 12, fontWeight: 700, backgroundColor: meta.bg, color: meta.fg}}>
            {meta.label}
        </Box>
    );
}

function StatCard({label, value}) {
    return (
        <Box sx={{flex: '1 1 180px', backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: 2}}>
            <Typography sx={{fontSize: 11.5, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.4}}>{label.toUpperCase()}</Typography>
            <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mt: 0.5}}>{value}</Typography>
        </Box>
    );
}

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [day, setDay] = useState(todayStr());
    const [data, setData] = useState(null);
    const [maxInput, setMaxInput] = useState('');
    const [savingMax, setSavingMax] = useState(false);
    const [busyId, setBusyId] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [form, setForm] = useState(EMPTY_FORM);
    const [creating, setCreating] = useState(false);
    const [created, setCreated] = useState(null);

    const load = useCallback(async (d) => {
        try {
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.WORKFLOW.OPERATORS}?date=${d}`);
            setData(res.data);
            setMaxInput(String(res.data?.settings?.max_per_round ?? ''));
        } catch (e) {
            enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
            setData({results: [], settings: {}, totals: {}, can_edit: false});
        }
    }, []);

    useEffect(() => {
        load(day);
    }, [day]);

    const canEdit = !!data?.can_edit;
    const rows = data?.results || [];
    const maxPerRound = data?.settings?.max_per_round || 0;

    const saveMax = async () => {
        setSavingMax(true);
        try {
            await service_api.put(NEXT_API_ENDPOINTS.WORKFLOW.OPERATOR_SETTINGS, {max_per_round: Number(maxInput)});
            enqueueSnackbar('Dövr limiti yeniləndi.', {variant: 'success', autoHideDuration: 2500});
            await load(day);
        } catch (e) {
            enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
        } finally {
            setSavingMax(false);
        }
    };

    const toggle = async (op, enabled) => {
        setBusyId(op.id);
        try {
            await service_api.patch(NEXT_API_ENDPOINTS.WORKFLOW.OPERATOR(op.id), {is_enabled: enabled});
            await load(day);
        } catch (e) {
            enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
        } finally {
            setBusyId(null);
        }
    };

    const remove = async (op) => {
        if (!window.confirm(`${op.full_name} operatorluqdan çıxarılsın? (İstifadəçi hesabı qalır.)`)) return;
        setBusyId(op.id);
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.WORKFLOW.OPERATOR(op.id));
            await load(day);
        } catch (e) {
            enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
        } finally {
            setBusyId(null);
        }
    };

    const createOperator = async () => {
        setCreating(true);
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.WORKFLOW.OPERATORS, form);
            setCreated(res.data);
            setCreateOpen(false);
            setForm(EMPTY_FORM);
            await load(day);
        } catch (e) {
            const d = e?.response?.data;
            const firstFieldError = d && typeof d === 'object' ? Object.values(d).flat().find((v) => typeof v === 'string') : null;
            enqueueSnackbar(d?.detail || firstFieldError || handleError(e), {variant: 'error'});
        } finally {
            setCreating(false);
        }
    };

    const setField = (k) => (e) => setForm((p) => ({...p, [k]: e.target.value}));

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>Ana səhifə</Link>
                    {' / '}
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>İnzibatçı paneli</Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Operatorlar</span>
                </Typography>

                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3}}>
                    <Box>
                        <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>Operatorlar</Typography>
                        <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5}}>
                            Lisenziya və icazə sənədlərini yoxlayan MSN operatorları və gündəlik iş statistikası.
                        </Typography>
                    </Box>
                    <Box sx={{display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap'}}>
                        <TextField type="date" size="small" label="Tarix" value={day}
                                   onChange={(e) => setDay(e.target.value || todayStr())}
                                   InputLabelProps={{shrink: true}}/>
                        {canEdit && (
                            <Button variant="contained" onClick={() => setCreateOpen(true)}
                                    sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, '&:hover': {backgroundColor: GOV.navyMid}}}>
                                + Operator yarat
                            </Button>
                        )}
                    </Box>
                </Box>

                {data && !canEdit && (
                    <Box sx={{p: 2, mb: 3, borderRadius: 2, backgroundColor: '#E7EEFA', border: '1px solid #A9C0EA'}}>
                        <Typography sx={{fontSize: 13, color: '#1F4E9A', fontWeight: 700}}>
                            Bu səhifəni yalnız görə bilərsiniz. Redaktə (operator yaratmaq, limit və aç/söndür) yalnız Baş admin üçündür.
                        </Typography>
                    </Box>
                )}

                {!data ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}><CircularProgress size={26}/></Box>
                ) : (
                    <>
                        <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3}}>
                            <StatCard label="Operator sayı" value={data.totals?.operators ?? 0}/>
                            <StatCard label="Seçilmiş gün yaradılan" value={data.totals?.created_today ?? 0}/>
                            <StatCard label="Seçilmiş gün yoxlanılan" value={data.totals?.reviewed_today ?? 0}/>
                            <StatCard label="Yoxlama gözləyən" value={data.totals?.pending_documents ?? 0}/>
                            <StatCard label="Cari dövr" value={`#${data.settings?.round_number ?? 1}`}/>
                        </Box>

                        <Box sx={{
                            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap', p: 2.5, mb: 3, borderRadius: 2,
                            backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`,
                        }}>
                            <Box sx={{flex: '1 1 320px'}}>
                                <Typography sx={{fontSize: 14, fontWeight: 800, color: GOV.textPrimary}}>
                                    Dövr limiti (maksimum)
                                </Typography>

                            </Box>
                            <TextField size="small" type="number" label="Limit" value={maxInput} disabled={!canEdit}
                                       onChange={(e) => setMaxInput(e.target.value)} sx={{width: 120}}
                                       inputProps={{min: 1, max: 1000}}/>
                            {canEdit && (
                                <Button variant="outlined" disabled={savingMax || Number(maxInput) === maxPerRound} onClick={saveMax}
                                        sx={{textTransform: 'none', fontWeight: 700}}>
                                    {savingMax ? 'Saxlanılır...' : 'Yadda saxla'}
                                </Button>
                            )}
                        </Box>

                        <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflowX: 'auto'}}>
                            <Box sx={{minWidth: 920}}>
                                <Box sx={{
                                    display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 0.8fr 1.2fr 1.3fr 1.4fr', gap: 1.5, px: 2.5, py: 1.5,
                                    backgroundColor: GOV.pageBg, borderBottom: `1px solid ${GOV.cardBorder}`,
                                    fontSize: 11, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.4,
                                }}>
                                    <span>OPERATOR</span><span>YARADIB</span><span>YOXLAYIB</span>
                                    <span>UĞURLU / İMTİNA</span><span>DÖVR ÜZRƏ</span><span>STATUS / ƏMƏLİYYAT</span>
                                </Box>
                                {rows.length === 0 ? (
                                    <Typography sx={{fontSize: 13.5, color: GOV.textMuted, textAlign: 'center', py: 5}}>
                                        Hələ operator yoxdur.
                                    </Typography>
                                ) : rows.map((op) => {
                                    const pct = Math.min(100, Math.round((op.round_count / Math.max(1, op.max_per_round)) * 100));
                                    return (
                                        <Box key={op.id} sx={{
                                            display: 'grid', gridTemplateColumns: '1.6fr 0.8fr 0.8fr 1.2fr 1.3fr 1.4fr', gap: 1.5, px: 2.5, py: 1.75,
                                            alignItems: 'center', borderBottom: `1px solid ${GOV.cardBorder}`, '&:last-of-type': {borderBottom: 'none'},
                                            backgroundColor: op.is_enabled ? '#fff' : '#FAFAFB', opacity: busyId === op.id ? 0.55 : 1,
                                        }}>
                                            <Box sx={{minWidth: 0}}>
                                                <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>{op.full_name}</Typography>
                                                <Typography sx={{fontSize: 11.5, color: GOV.textMuted, overflow: 'hidden', textOverflow: 'ellipsis'}}>
                                                    {op.username} · {op.email}
                                                </Typography>
                                            </Box>
                                            <Typography sx={{fontSize: 14, fontWeight: 700}}>{op.created_today}</Typography>
                                            <Typography sx={{fontSize: 14, fontWeight: 700}}>{op.reviewed_today}</Typography>
                                            <Typography sx={{fontSize: 13}}>
                                                <span style={{color: '#1E7A3C', fontWeight: 700}}>{op.approved_today}</span>
                                                {' / '}
                                                <span style={{color: '#B42318', fontWeight: 700}}>{op.rejected_today}</span>
                                            </Typography>
                                            <Box>
                                                <Typography sx={{fontSize: 12.5, fontWeight: 700, mb: 0.5}}>{op.round_count} / {op.max_per_round}</Typography>
                                                <LinearProgress variant="determinate" value={pct}
                                                                sx={{height: 6, borderRadius: 3, backgroundColor: GOV.pageBg,
                                                                    '& .MuiLinearProgress-bar': {backgroundColor: op.is_enabled ? GOV.navy : '#D92D20'}}}/>
                                            </Box>
                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap'}}>
                                                <StatusChip op={op}/>
                                                {canEdit && (op.is_enabled ? (
                                                    <Button size="small" disabled={busyId === op.id} onClick={() => toggle(op, false)}
                                                            sx={{textTransform: 'none', fontWeight: 700, fontSize: 12}}>
                                                        {op.manual_override ? 'Limiti bağla (söndür)' : 'Söndür'}
                                                    </Button>
                                                ) : (
                                                    <Button size="small" variant="contained" disabled={busyId === op.id} onClick={() => toggle(op, true)}
                                                            sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 12, '&:hover': {backgroundColor: GOV.navyMid}}}>
                                                        Aç
                                                    </Button>
                                                ))}
                                                {canEdit && (
                                                    <Button size="small" color="error" disabled={busyId === op.id} onClick={() => remove(op)}
                                                            sx={{textTransform: 'none', fontSize: 12}}>Sil</Button>
                                                )}
                                            </Box>
                                        </Box>
                                    );
                                })}
                            </Box>
                        </Box>
                    </>
                )}
            </Box>

            {/* Operator yarat */}
            <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{fontSize: 16, fontWeight: 700}}>Yeni operator</DialogTitle>
                <DialogContent>
                    <Box sx={{display: 'grid', gap: 2, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, pt: 1}}>
                        <TextField size="small" label="Ad" value={form.first_name} onChange={setField('first_name')}/>
                        <TextField size="small" label="Soyad" value={form.last_name} onChange={setField('last_name')}/>
                        <TextField size="small" label="İstifadəçi adı" value={form.username} onChange={setField('username')}/>
                        <TextField size="small" label="E-poçt" value={form.email} onChange={setField('email')}/>
                        <TextField size="small" label="Telefon" value={form.phone} onChange={setField('phone')}/>
                        <TextField size="small" label="FİN kod" value={form.fin_kod} onChange={setField('fin_kod')}/>
                    </Box>
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2.5}}>
                    <Button onClick={() => setCreateOpen(false)} sx={{textTransform: 'none'}}>Ləğv et</Button>
                    <Button variant="contained" disabled={creating} onClick={createOperator}
                            sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, '&:hover': {backgroundColor: GOV.navyMid}}}>
                        {creating ? 'Yaradılır...' : 'Yarat'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Yaradıldı - müvəqqəti şifrə */}
            <Dialog open={!!created} onClose={() => setCreated(null)} fullWidth maxWidth="xs">
                <DialogTitle sx={{fontSize: 16, fontWeight: 700}}>Operator yaradıldı</DialogTitle>
                <DialogContent>
                    <Typography sx={{fontSize: 13.5, mb: 1.5}}>
                        <b>{created?.full_name}</b> ({created?.username}) üçün ilkin şifrə:
                    </Typography>
                    <Box sx={{p: 1.5, borderRadius: 1.5, backgroundColor: GOV.pageBg, fontFamily: 'monospace', fontSize: 14, fontWeight: 700}}>
                        {created?.initial_password}
                    </Box>
                    <Typography sx={{fontSize: 12, color: GOV.textMuted, mt: 1.5}}>
                        İstifadəçi ilk girişdə şifrəni özü dəyişəcək.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2.5}}>
                    <Button variant="contained" onClick={() => setCreated(null)}
                            sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700}}>Bağla</Button>
                </DialogActions>
            </Dialog>
        </AppShell>
    );
}
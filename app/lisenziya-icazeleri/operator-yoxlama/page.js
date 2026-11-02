"use client"
import React, {useCallback, useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import {docTypeDetailRoute} from "@/components/atoms/reports/docTypeRoutes";

function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    return isNaN(d.getTime()) ? '-' : d.toLocaleString('az-AZ');
}

function QuotaPanel({me}) {
    if (!me) return null;

    if (me.role === 'main_admin') {
        return (
            <Box sx={{p: 2, mb: 3, borderRadius: 2, backgroundColor: '#E8F5EC', border: '1px solid #A7D5B5'}}>
                <Typography sx={{fontSize: 13, color: '#1E7A3C', fontWeight: 700}}>
                    Baş admin olaraq limitsiz yoxlama apara bilərsiniz.
                </Typography>
            </Box>
        );
    }
    if (me.role === 'viewer') {
        return (
            <Box sx={{p: 2, mb: 3, borderRadius: 2, backgroundColor: '#E7EEFA', border: '1px solid #A9C0EA'}}>
                <Typography sx={{fontSize: 13, color: '#1F4E9A', fontWeight: 700}}>
                    Siz yalnız baxış rejimindəsiniz - qərar vermək üçün operator olmalısınız.
                </Typography>
            </Box>
        );
    }

    const pct = Math.min(100, Math.round((me.round_count / Math.max(1, me.max_per_round)) * 100));
    if (me.manual_override && me.is_enabled) {
        return (
            <Box sx={{p: 2, mb: 3, borderRadius: 2, backgroundColor: '#E7EEFA', border: '1px solid #A9C0EA'}}>
                <Typography sx={{fontSize: 13, color: '#1F4E9A', fontWeight: 700}}>
                    Baş admin sizi limitdən azad edib - o söndürənə qədər yoxlama apara bilərsiniz. Bu dövr: {me.round_count} yoxlama.
                </Typography>
            </Box>
        );
    }
    return (
        <Box sx={{
            p: 2.5, mb: 3, borderRadius: 2, backgroundColor: '#fff',
            border: `1px solid ${me.is_enabled ? GOV.cardBorder : '#F0B4AE'}`,
        }}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1, mb: 1}}>
                <Typography sx={{fontSize: 13.5, fontWeight: 800, color: GOV.textPrimary}}>
                    Dövr #{me.round_number}: {me.round_count} / {me.max_per_round} yoxlama
                </Typography>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted}}>Bu gün yoxladığınız: {me.reviewed_today}</Typography>
            </Box>
            <LinearProgress
                variant="determinate" value={pct}
                sx={{height: 8, borderRadius: 4, backgroundColor: GOV.pageBg, '& .MuiLinearProgress-bar': {backgroundColor: me.is_enabled ? GOV.navy : '#D92D20'}}}
            />
            {!me.is_enabled && (
                <Typography sx={{fontSize: 13, color: '#B42318', mt: 1.5, fontWeight: 600}}>
                    {me.disabled_message}
                </Typography>
            )}
        </Box>
    );
}

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [data, setData] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [reason, setReason] = useState('');

    const load = useCallback(async () => {
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.WORKFLOW.OPERATOR_QUEUE);
            setData(res.data);
        } catch (e) {
            enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
            setData({me: null, results: []});
        }
    }, []);

    useEffect(() => {
        load();
    }, []);

    const decide = async (doc, decision, comment = '') => {
        setBusyId(doc.id);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.LICENSES.PERMIT_OPERATOR_REVIEW(doc.id), {decision, comment});
            enqueueSnackbar(
                decision === 'ugurlu' ? `${doc.number}: yoxlama uğurla başa çatdı - təsdiqə göndərildi.` : `${doc.number}: imtina edildi.`,
                {variant: decision === 'ugurlu' ? 'success' : 'info', autoHideDuration: 3000}
            );
            setRejectTarget(null);
            await load();
        } catch (e) {
            enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error', autoHideDuration: 6000});
            await load();
        } finally {
            setBusyId(null);
        }
    };

    const me = data?.me;
    const canDecide = !!me?.can_decide;
    const rows = data?.results || [];

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Ana səhifə
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Operator yoxlaması</span>
                </Typography>
                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>Operator yoxlaması</Typography>
                <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5, mb: 3}}>
                    Yoxlamanı gözləyən lisenziya və icazə sənədləri. Uğurlu yoxlamadan sonra sənəd təsdiq mərhələsinə keçir.
                </Typography>

                <QuotaPanel me={me}/>

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                    {!data ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}><CircularProgress size={26}/></Box>
                    ) : rows.length === 0 ? (
                        <Box sx={{textAlign: 'center', py: 6}}>
                            <InfoOutlinedIcon sx={{fontSize: 28, color: GOV.textMuted, mb: 1}}/>
                            <Typography sx={{fontSize: 14, color: GOV.textMuted}}>Yoxlama gözləyən sənəd yoxdur.</Typography>
                        </Box>
                    ) : rows.map((doc) => (
                        <Box key={doc.id} sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap',
                            px: 2.5, py: 2, borderBottom: `1px solid ${GOV.cardBorder}`, '&:last-of-type': {borderBottom: 'none'},
                            opacity: busyId === doc.id ? 0.55 : 1,
                        }}>
                            <Box sx={{minWidth: 0, flex: '1 1 280px'}}>
                                <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>
                                    {doc.number} · {doc.category}
                                </Typography>
                                <Typography sx={{fontSize: 12, color: GOV.textMuted, mt: 0.3}}>
                                    {doc.applicant_name || doc.organization_name || 'Müraciətçi göstərilməyib'}
                                    {' · '}{doc.files_count} fayl{' · '}göndərilib: {formatDate(doc.submitted_at)}
                                </Typography>
                            </Box>
                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap'}}>
                                <Button size="small" variant="text"
                                        onClick={() => router.push(docTypeDetailRoute(doc.doc_type, doc.id))}
                                        sx={{textTransform: 'none', fontSize: 12.5, fontWeight: 700, color: GOV.navySoft}}>
                                    Bax
                                </Button>
                                <Button size="small" variant="outlined" color="error"
                                        disabled={!canDecide || busyId === doc.id}
                                        startIcon={<HighlightOffIcon sx={{fontSize: 16}}/>}
                                        onClick={() => {
                                            setRejectTarget(doc);
                                            setReason('');
                                        }}
                                        sx={{textTransform: 'none', fontSize: 12.5, fontWeight: 700}}>
                                    İmtina
                                </Button>
                                <Button size="small" variant="contained"
                                        disabled={!canDecide || busyId === doc.id}
                                        startIcon={<CheckCircleOutlineIcon sx={{fontSize: 16}}/>}
                                        onClick={() => decide(doc, 'ugurlu')}
                                        sx={{backgroundColor: GOV.navy, textTransform: 'none', fontSize: 12.5, fontWeight: 700, '&:hover': {backgroundColor: GOV.navyMid}}}>
                                    Yoxlama uğurlu
                                </Button>
                            </Box>
                        </Box>
                    ))}
                </Box>
            </Box>

            <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} fullWidth maxWidth="xs">
                <DialogTitle sx={{fontSize: 16, fontWeight: 700}}>Yoxlamada imtina</DialogTitle>
                <DialogContent>
                    <Typography sx={{fontSize: 13, color: GOV.textMuted, mb: 2}}>
                        {rejectTarget?.number} nömrəli sənəd üçün imtina səbəbini yazın. Səbəb sənəd sahibinə bildiriləcək.
                    </Typography>
                    <TextField fullWidth multiline minRows={3} autoFocus placeholder="Səbəb..."
                               value={reason} onChange={(e) => setReason(e.target.value)}/>
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2.5}}>
                    <Button onClick={() => setRejectTarget(null)} sx={{textTransform: 'none'}}>Ləğv et</Button>
                    <Button variant="contained" color="error" disabled={busyId === rejectTarget?.id}
                            onClick={() => {
                                if (!reason.trim()) {
                                    enqueueSnackbar('Səbəb tələb olunur.', {variant: 'warning'});
                                    return;
                                }
                                decide(rejectTarget, 'imtina', reason.trim());
                            }}
                            sx={{textTransform: 'none', fontWeight: 700}}>
                        İmtina et
                    </Button>
                </DialogActions>
            </Dialog>
        </AppShell>
    );
}
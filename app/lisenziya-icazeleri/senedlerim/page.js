"use client"
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
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

/* Kateqoriya adları və tab sırası (backend: licenses/field_schema.py -> DOC_TYPES) */
const CATEGORY_LABELS = {
    ixrac: 'İxrac',
    idxal: 'İdxal',
    istehsal: 'Lisenziya (köhnə)',
    xususi_lisenziya: 'Xüsusi Lisenziya',
    umumi_lisenziya: 'Ümumi Lisenziya',
    xususi_satis: 'Xüsusi Satış',
    gomrukden_azadolma: 'Gömrükdən Azadolma',
    edvden_azadolma: 'ƏDV-dən Azadolma',
};
const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS);

/* Sənədin detal səhifəsinin qovluğu */
const DETAIL_FOLDER = {
    xususi_lisenziya: 'lisenziya', umumi_lisenziya: 'lisenziya', istehsal: 'lisenziya',
    idxal: 'idxal-ixrac', ixrac: 'idxal-ixrac', xususi_satis: 'xususi-satis',
    gomrukden_azadolma: 'edv-guzesti', edvden_azadolma: 'edv-guzesti',
};

const STATUS_META = {
    gozleyir: {label: 'Gözlənilir', bg: '#FFF6E5', color: '#9A6A00', dot: '#C9982B'},
    aktiv: {label: 'Aktiv', bg: '#E8F5EC', color: '#1E7A3C', dot: '#1E7A3C'},
    bitmis: {label: 'Bitmiş', bg: '#EEF0F4', color: '#4B5563', dot: '#9CA3AF'},
    legv: {label: 'Ləğv edilib', bg: '#FDECEC', color: '#B42318', dot: '#D92D20'},
    dayandirilib: {label: 'Dayandırılıb', bg: '#EEF0F4', color: '#4B5563', dot: '#9CA3AF'},
};

const asList = (data) => (Array.isArray(data) ? data : (data?.results || []));

function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('az-AZ');
}

function StatusChip({status}) {
    const m = STATUS_META[status] || {label: status || '-', bg: '#EEF0F4', color: '#4B5563', dot: '#9CA3AF'};
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.4,
            borderRadius: 5, fontSize: 12, fontWeight: 700, backgroundColor: m.bg, color: m.color,
        }}>
            <Box sx={{width: 6, height: 6, borderRadius: '50%', backgroundColor: m.dot}}/>
            {m.label}
        </Box>
    );
}

function EmptyState({text}) {
    return (
        <Box sx={{textAlign: 'center', py: 6}}>
            <InfoOutlinedIcon sx={{fontSize: 28, color: GOV.textMuted, mb: 1}}/>
            <Typography sx={{fontSize: 14, color: GOV.textMuted}}>{text}</Typography>
        </Box>
    );
}

function DocRow({doc, mode, busy, onOpen, onOpenCertificate, onApprove, onReject}) {
    const isPending = mode === 'pending';
    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap',
            px: 2.5, py: 2, borderBottom: `1px solid ${GOV.cardBorder}`,
            '&:last-of-type': {borderBottom: 'none'}, opacity: busy ? 0.55 : 1, transition: 'opacity .15s',
            '&:hover': {backgroundColor: GOV.pageBg},
        }}>
            <Box sx={{minWidth: 0, flex: '1 1 260px'}}>
                <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>
                    {doc.title || doc.category} · {doc.number}
                </Typography>
                <Typography sx={{fontSize: 12, color: GOV.textMuted, mt: 0.3}}>
                    {doc.category} · {doc.applicant_name || 'Müəssisə göstərilməyib'}
                    {!isPending && doc.issue_date ? ` · ${formatDate(doc.issue_date)}` : ''}
                </Typography>
            </Box>

            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0, flexWrap: 'wrap'}}>
                {isPending ? (
                    <Typography sx={{fontSize: 12, fontWeight: 700, color: GOV.textMuted, mr: 0.5}}>
                        {doc.approval_stage}-ci mərhələ
                    </Typography>
                ) : (
                    <StatusChip status={doc.status}/>
                )}

                {DETAIL_FOLDER[doc.doc_type] && (
                    <Button
                        size="small" variant="text" onClick={() => onOpen(doc)}
                        sx={{textTransform: 'none', fontSize: 12.5, fontWeight: 700, color: GOV.navySoft}}
                    >
                        Bax
                    </Button>
                )}

                {!isPending && doc.certificate_id && (
                    <Button
                        size="small" variant="outlined" onClick={() => onOpenCertificate(doc)}
                        sx={{
                            textTransform: 'none', fontSize: 12.5, fontWeight: 700,
                            color: GOV.textPrimary, borderColor: GOV.cardBorder,
                        }}
                    >
                        Sertifikat
                    </Button>
                )}

                {isPending && (
                    <>
                        <Button
                            size="small" variant="outlined" color="error" disabled={busy}
                            startIcon={<HighlightOffIcon sx={{fontSize: 16}}/>}
                            onClick={() => onReject(doc)}
                            sx={{textTransform: 'none', fontSize: 12.5, fontWeight: 700}}
                        >
                            Təsdiq etmə
                        </Button>
                        <Button
                            size="small" variant="contained" disabled={busy}
                            startIcon={<CheckCircleOutlineIcon sx={{fontSize: 16}}/>}
                            onClick={() => onApprove(doc)}
                            sx={{
                                backgroundColor: GOV.navy, textTransform: 'none', fontSize: 12.5, fontWeight: 700,
                                '&:hover': {backgroundColor: GOV.navyMid},
                            }}
                        >
                            Təsdiq et
                        </Button>
                    </>
                )}
            </Box>
        </Box>
    );
}

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();

    const [isReviewer, setIsReviewer] = useState(false);
    const [mainTab, setMainTab] = useState('mine');          // 'mine' | 'pending'
    const [category, setCategory] = useState('all');         // 'all' | doc_type
    const [mineDocs, setMineDocs] = useState(null);
    const [pendingDocs, setPendingDocs] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [rejectTarget, setRejectTarget] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    /* Yaratdığım sənədlər */
    const loadMine = useCallback(async () => {
        try {
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.LICENSES.PERMIT_LIST}?mine=1`);
            setMineDocs(asList(res.data));
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
            setMineDocs([]);
        }
    }, []);

    /* Təsdiq gözləyən sənədlər (1-ci və 2-ci mərhələ birlikdə) */
    const loadPending = useCallback(async () => {
        try {
            const [s1, s2] = await Promise.all([
                service_api.get(`${NEXT_API_ENDPOINTS.LICENSES.PERMIT_LIST}?approval_stage=1`),
                service_api.get(`${NEXT_API_ENDPOINTS.LICENSES.PERMIT_LIST}?approval_stage=2`),
            ]);
            setPendingDocs([...asList(s1.data), ...asList(s2.data)]);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
            setPendingDocs([]);
        }
    }, []);

    useEffect(() => {
        loadMine();
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.LICENSES.REVIEW_SUMMARY);
                if (res.data?.is_reviewer) {
                    setIsReviewer(true);
                    loadPending();
                    // Ana səhifədəki kartdan gələndə (?tab=tesdiq) birbaşa həmin tab açılsın
                    if (new URLSearchParams(window.location.search).get('tab') === 'tesdiq') {
                        setMainTab('pending');
                    }
                }
            } catch (e) { /* təsdiq hüququ yoxdursa tab göstərilmir */ }
        })();
    }, []);

    const docs = mainTab === 'pending' ? pendingDocs : mineDocs;

    /* Kateqoriya tabları: yalnız sənədi olan kateqoriyalar + "Hamısı" */
    const categoryTabs = useMemo(() => {
        const counts = {};
        (docs || []).forEach((d) => {
            counts[d.doc_type] = (counts[d.doc_type] || 0) + 1;
        });
        const present = CATEGORY_ORDER.filter((k) => counts[k]);
        Object.keys(counts).forEach((k) => {
            if (!present.includes(k)) present.push(k);   // naməlum yeni kateqoriya itməsin
        });
        return {counts, keys: present};
    }, [docs]);

    // Seçilmiş kateqoriyada sənəd qalmayıbsa (məs. hamısı təsdiqləndi) "Hamısı"-na qayıt
    useEffect(() => {
        if (category !== 'all' && !categoryTabs.counts[category]) setCategory('all');
    }, [categoryTabs, category]);

    const visibleDocs = useMemo(
        () => (docs || []).filter((d) => category === 'all' || d.doc_type === category),
        [docs, category]
    );

    const switchMain = (value) => {
        setMainTab(value);
        setCategory('all');
    };

    /* Təsdiq / rədd */
    const handleApprove = async (doc) => {
        setBusyId(doc.id);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.LICENSES.PERMIT_APPROVE(doc.id), {});
            enqueueSnackbar(`${doc.number} təsdiqləndi.`, {variant: 'success', autoHideDuration: 2500});
            await Promise.all([loadPending(), loadMine()]);
        } catch (e) {
            enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
        } finally {
            setBusyId(null);
        }
    };

    const openReject = (doc) => {
        setRejectTarget(doc);
        setRejectReason('');
    };

    const handleReject = async () => {
        if (!rejectTarget) return;
        if (!rejectReason.trim()) {
            enqueueSnackbar('Səbəb tələb olunur.', {variant: 'warning'});
            return;
        }
        setBusyId(rejectTarget.id);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.LICENSES.PERMIT_REJECT(rejectTarget.id), {
                reason: rejectReason.trim(),
            });
            enqueueSnackbar(`${rejectTarget.number} təsdiq edilmədi.`, {variant: 'info', autoHideDuration: 2500});
            setRejectTarget(null);
            await Promise.all([loadPending(), loadMine()]);
        } catch (e) {
            enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
        } finally {
            setBusyId(null);
        }
    };

    const openDoc = (doc) => router.push(`/modullar/lisenziya-senedler/${DETAIL_FOLDER[doc.doc_type]}/${doc.id}`);
    const openCertificate = (doc) => router.push(APP_ROUTES.SENED(doc.certificate_id));

    const loading = docs === null;
    const pendingCount = pendingDocs?.length ?? null;

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Ana səhifə
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Sənədlərim</span>
                </Typography>

                <Typography sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5}}>
                    LİSENZİYA VƏ SƏNƏDLƏR
                </Typography>
                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>
                    Sənədlərim
                </Typography>
                <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5, mb: 3}}>
                    {mainTab === 'pending'
                        ? 'Sizin təsdiqinizi gözləyən sənədlər.'
                        : 'Sizin yaratdığınız sənədlər.'}
                </Typography>

                {/* 1-ci səviyyə: Yaratdığım / Təsdiq gözləyən */}
                {isReviewer && (
                    <Tabs
                        value={mainTab} onChange={(e, v) => switchMain(v)}
                        sx={{
                            mb: 1, minHeight: 40, borderBottom: `1px solid ${GOV.cardBorder}`,
                            '& .MuiTab-root': {minHeight: 40, textTransform: 'none', fontWeight: 800, fontSize: 14},
                        }}
                    >
                        <Tab value="mine" label={`Yaratdığım sənədlər${mineDocs ? ` (${mineDocs.length})` : ''}`}/>
                        <Tab value="pending"
                             label={`Təsdiq gözləyən sənədlər${pendingCount !== null ? ` (${pendingCount})` : ''}`}/>
                    </Tabs>
                )}

                {/* 2-ci səviyyə: kateqoriyalar */}
                <Tabs
                    value={category} onChange={(e, v) => setCategory(v)}
                    variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile
                    sx={{
                        mb: 2, minHeight: 36,
                        '& .MuiTab-root': {minHeight: 36, textTransform: 'none', fontWeight: 700, fontSize: 13},
                    }}
                >
                    <Tab value="all" label={`Hamısı${docs ? ` (${docs.length})` : ''}`}/>
                    {categoryTabs.keys.map((k) => (
                        <Tab key={k} value={k} label={`${CATEGORY_LABELS[k] || k} (${categoryTabs.counts[k]})`}/>
                    ))}
                </Tabs>

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                    {loading ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                            <CircularProgress size={26}/>
                        </Box>
                    ) : visibleDocs.length === 0 ? (
                        <EmptyState text={
                            mainTab === 'pending'
                                ? 'Təsdiqinizi gözləyən sənəd yoxdur.'
                                : 'Bu kateqoriya üzrə yaratdığınız sənəd yoxdur.'
                        }/>
                    ) : (
                        visibleDocs.map((doc) => (
                            <DocRow
                                key={`${mainTab}-${doc.id}`} doc={doc} mode={mainTab} busy={busyId === doc.id}
                                onOpen={openDoc} onOpenCertificate={openCertificate}
                                onApprove={handleApprove} onReject={openReject}
                            />
                        ))
                    )}
                </Box>
            </Box>

            <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} fullWidth maxWidth="xs">
                <DialogTitle sx={{fontSize: 16, fontWeight: 700}}>Sənədi təsdiq etmə</DialogTitle>
                <DialogContent>
                    <Typography sx={{fontSize: 13, color: GOV.textMuted, mb: 2}}>
                        {rejectTarget?.number} nömrəli sənədi təsdiq etməmək üzrəsiniz. Səbəbi qeyd edin.
                    </Typography>
                    <TextField
                        fullWidth multiline minRows={3} autoFocus
                        placeholder="Səbəb..." value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                    />
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2.5}}>
                    <Button onClick={() => setRejectTarget(null)} sx={{textTransform: 'none'}}>Ləğv et</Button>
                    <Button
                        variant="contained" color="error" onClick={handleReject}
                        disabled={busyId === rejectTarget?.id}
                        sx={{textTransform: 'none', fontWeight: 700}}
                    >
                        Təsdiq etmə
                    </Button>
                </DialogActions>
            </Dialog>
        </AppShell>
    );
}
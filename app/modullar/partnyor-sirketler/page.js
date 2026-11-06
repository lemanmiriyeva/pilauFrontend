"use client"
import React, {useCallback, useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import {SimpleTable} from "@/components/atoms/organizations/profile/shared";
import PartnerFormDialog from "@/components/atoms/partners/PartnerFormDialog";

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [user, setUser] = useState(null);
    const isAdmin = Boolean(user?.is_staff || user?.is_superuser);

    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [orgOptions, setOrgOptions] = useState([]);
    const [dialog, setDialog] = useState({open: false, item: null});

    useEffect(() => {
        const t = setTimeout(() => setDebounced(search.trim()), 300);
        return () => clearTimeout(t);
    }, [search]);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const p = new URLSearchParams();
            if (debounced) p.set('q', debounced);
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.ORGANIZATIONS.PARTNERS}?${p}`);
            setRows(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    }, [debounced]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        if (!isAdmin) return;
        service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.TABLE)
            .then((res) => {
                const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
                setOrgOptions(list.filter((o) => o.is_active !== false));
            })
            .catch(() => {});
    }, [isAdmin]);

    const remove = async (r) => {
        if (!window.confirm(`"${r.name}" silinsin?`)) return;
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.ORGANIZATIONS.PARTNER(r.id));
            setRows((prev) => prev.filter((x) => x.id !== r.id));
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        }
    };

    const columns = [
        {label: 'ŞİRKƏT', width: '2fr', render: (r) => (
            <Box><b>{r.name}</b>{!r.is_active && <Chip size="small" label="Passiv" sx={{ml: 1}}/>}
                {r.voen && <Typography component="span" sx={{display: 'block', fontSize: 11.5, color: GOV.textMuted}}>VÖEN: {r.voen}</Typography>}</Box>
        )},
        {label: 'ÖLKƏ', width: '1fr', render: (r) => r.country || '—'},
        {label: 'ƏLAQƏ', width: '1.6fr', render: (r) => (
            <Box>{r.contact_person || '—'}
                {(r.phone || r.email) && <Typography component="span" sx={{display: 'block', fontSize: 11.5, color: GOV.textMuted}}>{[r.phone, r.email].filter(Boolean).join(' · ')}</Typography>}</Box>
        )},
        {label: 'TƏŞKİLATLAR', width: '2fr', render: (r) => (
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5}}>
                {(r.organizations || []).length === 0
                    ? <Typography sx={{fontSize: 12, color: GOV.textMuted}}>Təyin olunmayıb</Typography>
                    : r.organizations.map((o) => (
                        <Chip key={o.id} size="small" label={o.name} onClick={() => router.push(`${APP_ROUTES.TESKILATLAR}/${o.id}`)}/>
                    ))}
            </Box>
        )},
        {label: 'QEYD', width: '1.4fr', render: (r) => r.note || '—'},
        ...(isAdmin ? [{
            label: '', width: '1fr', render: (r) => (
                <Box sx={{display: 'flex', gap: 2}}>
                    <Link component="button" onClick={() => setDialog({open: true, item: r})} sx={{fontSize: 12.5, fontWeight: 600, color: GOV.navySoft, textDecoration: 'none'}}>Redaktə</Link>
                    <Link component="button" onClick={() => remove(r)} sx={{fontSize: 12.5, fontWeight: 600, color: '#B0374D', textDecoration: 'none'}}>Sil</Link>
                </Box>
            ),
        }] : []),
    ];

    return (
        <AppShell onReady={({user: u}) => setUser(u)}>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)} sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>Ana səhifə</Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Partnyor şirkətlər</span>
                </Typography>

                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5, mb: 3}}>
                    <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary}}>Partnyor şirkətlər</Typography>
                    {isAdmin && (
                        <Button variant="contained" startIcon={<AddIcon/>} onClick={() => setDialog({open: true, item: null})}
                                sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13, '&:hover': {backgroundColor: GOV.navyMid}}}>
                            Yeni partnyor şirkət
                        </Button>
                    )}
                </Box>

                <TextField size="small" placeholder="Ad, VÖEN və ya ölkə üzrə axtar..." value={search}
                           onChange={(e) => setSearch(e.target.value)} fullWidth sx={{mb: 2, backgroundColor: '#fff'}}
                           InputProps={{startAdornment: <InputAdornment position="start"><SearchIcon sx={{fontSize: 20, color: GOV.textMuted}}/></InputAdornment>}}/>

                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}><CircularProgress size={24}/></Box>
                ) : (
                    <SimpleTable columns={columns} rows={rows} empty="Partnyor şirkət tapılmadı."/>
                )}

                {isAdmin && (
                    <PartnerFormDialog
                        open={dialog.open} item={dialog.item} orgOptions={orgOptions}
                        onClose={() => setDialog({open: false, item: null})}
                        onSaved={() => { setDialog({open: false, item: null}); load(); }}
                    />
                )}
            </Box>
        </AppShell>
    );
}

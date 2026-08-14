"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.TABLE);
            setOrgs(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const toggleStatus = async (org) => {
        setBusyId(org.id);
        try {
            await service_api.patch(NEXT_API_ENDPOINTS.ORGANIZATIONS.DETAIL(org.id), {
                is_active: !org.is_active,
            });
            setOrgs((prev) => prev.map((o) => (o.id === org.id ? {...o, is_active: !o.is_active} : o)));
            enqueueSnackbar(!org.is_active ? 'Təşkilat aktivləşdirildi.' : 'Təşkilat deaktiv edildi.', {variant: 'success'});
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setBusyId(null);
        }
    };

    return (
        <AppShell>
            <Box sx={{maxWidth: 1080, mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5}}>
                    HÜQUQİ ŞƏXSLƏR
                </Typography>

                <Box sx={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3}}>
                    <Box>
                        <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>
                            Təşkilatlar
                        </Typography>
                        <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5}}>
                            Sistemə giriş hüququ olan təşkilatların siyahısı.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained" startIcon={<AddIcon/>}
                        onClick={() => router.push(APP_ROUTES.TESKILATLAR_YENI)}
                        sx={{
                            backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13,
                            px: 2.5, '&:hover': {backgroundColor: GOV.navyMid},
                        }}
                    >
                        Yeni təşkilat
                    </Button>
                </Box>

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                    <Box sx={{
                        display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1.2fr', px: 2.5, py: 1.25,
                        borderBottom: `1px solid ${GOV.cardBorder}`, backgroundColor: '#FAFAFC',
                    }}>
                        {['TƏŞKİLATIN ADI', 'SİSTEMDƏKİ İŞÇİ SAYI', 'STATUS', ''].map((h) => (
                            <Typography key={h} sx={{fontSize: 11, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.5}}>
                                {h}
                            </Typography>
                        ))}
                    </Box>

                    {loading ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', py: 5}}>
                            <CircularProgress size={22}/>
                        </Box>
                    ) : orgs.length === 0 ? (
                        <Typography sx={{fontSize: 13, color: GOV.textMuted, textAlign: 'center', py: 5}}>
                            Hələ heç bir təşkilat yoxdur.
                        </Typography>
                    ) : (
                        orgs.map((o) => (
                            <Box
                                key={o.id}
                                sx={{
                                    display: 'grid', gridTemplateColumns: '2fr 1fr 0.8fr 1.2fr', alignItems: 'center',
                                    px: 2.5, py: 1.75,
                                    borderBottom: `1px solid ${GOV.cardBorder}`,
                                    '&:last-of-type': {borderBottom: 'none'},
                                }}
                            >
                                <Typography sx={{fontSize: 13.5, fontWeight: 600, color: GOV.textPrimary}}>
                                    {o.full_name}
                                </Typography>

                                <Box>
                                    <Box sx={{
                                        display: 'inline-block', fontSize: 12, color: GOV.textMuted,
                                        backgroundColor: GOV.pageBg, borderRadius: 4, px: 1.25, py: 0.4,
                                    }}>
                                        {o.authorized_person_count} nəfər
                                    </Box>
                                </Box>

                                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75}}>
                                    <Box sx={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        backgroundColor: o.is_active ? '#2E9E5B' : '#B0374D',
                                    }}/>
                                    <Typography sx={{fontSize: 12.5, fontWeight: 600, color: GOV.textPrimary}}>
                                        {o.is_active ? 'Aktiv' : 'Deaktiv'}
                                    </Typography>
                                </Box>

                                <Box sx={{display: 'flex', gap: 2}}>
                                    <Link
                                        component="button"
                                        onClick={() => router.push(`${APP_ROUTES.TESKILATLAR}/${o.id}`)}
                                        sx={{fontSize: 12.5, fontWeight: 600, color: GOV.navySoft, textDecoration: 'none'}}
                                    >
                                        Redaktə
                                    </Link>
                                    <Link
                                        component="button" disabled={busyId === o.id}
                                        onClick={() => toggleStatus(o)}
                                        sx={{
                                            fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                                            color: o.is_active ? '#B0374D' : '#2E9E5B',
                                            opacity: busyId === o.id ? 0.5 : 1,
                                        }}
                                    >
                                        {o.is_active ? 'Deaktiv et' : 'Aktiv et'}
                                    </Link>
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            </Box>
        </AppShell>
    );
}
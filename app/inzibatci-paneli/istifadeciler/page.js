"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";

function initialsOf(u) {
    const a = (u.first_name || '')[0] || '';
    const b = (u.last_name || '')[0] || '';
    return (a + b).toUpperCase() || (u.username || '?')[0].toUpperCase();
}

export default function Page() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.ADMIN_USERS_LIST);
            setUsers(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const toggleStatus = async (user) => {
        setBusyId(user.id);
        try {
            await service_api.patch(NEXT_API_ENDPOINTS.AUTHENTICATION.ADMIN_USER_DETAIL(user.id), {
                is_active: !user.is_active,
            });
            setUsers((prev) => prev.map((u) => (u.id === user.id ? {...u, is_active: !u.is_active} : u)));
            enqueueSnackbar(!user.is_active ? 'İstifadəçi aktivləşdirildi.' : 'İstifadəçi deaktiv edildi.', {variant: 'success'});
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setBusyId(null);
        }
    };

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Giriş nəzarəti
                    </Link>
                </Typography>

                <Box sx={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3}}>
                    <Box>
                        <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary}}>
                            İstifadəçilər
                        </Typography>
                        <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5}}>
                            Sistemə giriş hüququ olan istifadəçilərin siyahısı.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained" startIcon={<AddIcon/>}
                        onClick={() => router.push(`${APP_ROUTES.INZIBATCI_ISTIFADECILER}/istifadeci-yarat`)}
                        sx={{
                            backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13,
                            '&:hover': {backgroundColor: GOV.navyMid},
                        }}
                    >
                        Yeni istifadəçi
                    </Button>
                </Box>

                <Box sx={{backgroundColor: '#FFFFFF', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                    <Box sx={{
                        display: 'grid', gridTemplateColumns: '2.2fr 1.4fr 0.9fr 1.2fr', px: 2.5, py: 1.25,
                        borderBottom: `1px solid ${GOV.cardBorder}`, backgroundColor: '#FAFAFC',
                    }}>
                        {['İSTİFADƏÇİ', 'TƏŞKİLAT', 'STATUS', ''].map((h) => (
                            <Typography key={h} sx={{fontSize: 11, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.5}}>
                                {h}
                            </Typography>
                        ))}
                    </Box>

                    {loading ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', py: 5}}>
                            <CircularProgress size={22}/>
                        </Box>
                    ) : users.length === 0 ? (
                        <Typography sx={{fontSize: 13, color: GOV.textMuted, textAlign: 'center', py: 5}}>
                            Hələ heç bir istifadəçi yoxdur.
                        </Typography>
                    ) : (
                        users.map((u) => (
                            <Box
                                key={u.id}
                                sx={{
                                    display: 'grid', gridTemplateColumns: '2.2fr 1.4fr 0.9fr 1.2fr',
                                    alignItems: 'center', px: 2.5, py: 1.5,
                                    borderBottom: `1px solid ${GOV.cardBorder}`,
                                    '&:last-of-type': {borderBottom: 'none'},
                                }}
                            >
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                                    <Avatar sx={{width: 30, height: 30, fontSize: 12, backgroundColor: GOV.navySoft, color: '#fff'}}>
                                        {initialsOf(u)}
                                    </Avatar>
                                    <Box>
                                        <Typography sx={{fontSize: 13, fontWeight: 600, color: GOV.textPrimary}}>
                                            {u.full_name}
                                        </Typography>
                                        <Typography sx={{fontSize: 12, color: GOV.textMuted}}>
                                            {u.email}
                                        </Typography>
                                    </Box>
                                </Box>

                                <Typography sx={{fontSize: 12.5, color: GOV.textPrimary}}>
                                    {u.organization_name || '—'}
                                </Typography>

                                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75}}>
                                    <FiberManualRecordIcon sx={{
                                        fontSize: 9, color: u.is_active ? '#2E9E5B' : '#B0374D',
                                    }}/>
                                    <Typography sx={{fontSize: 12.5, fontWeight: 600, color: GOV.textPrimary}}>
                                        {u.is_active ? 'Aktiv' : 'Deaktiv'}
                                    </Typography>
                                </Box>

                                <Box sx={{display: 'flex', gap: 2}}>
                                    <Link
                                        component="button"
                                        onClick={() => router.push(`${APP_ROUTES.INZIBATCI_ISTIFADECILER}/${u.id}`)}
                                        sx={{fontSize: 12.5, fontWeight: 600, color: GOV.navySoft, textDecoration: 'none'}}
                                    >
                                        Redaktə
                                    </Link>
                                    <Link
                                        component="button" disabled={busyId === u.id}
                                        onClick={() => toggleStatus(u)}
                                        sx={{
                                            fontSize: 12.5, fontWeight: 600, textDecoration: 'none',
                                            color: u.is_active ? '#B0374D' : '#2E9E5B',
                                            opacity: busyId === u.id ? 0.5 : 1,
                                        }}
                                    >
                                        {u.is_active ? 'Deaktiv et' : 'Aktiv et'}
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
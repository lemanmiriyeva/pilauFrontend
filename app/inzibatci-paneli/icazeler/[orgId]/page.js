"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import {useRouter, useParams} from "next/navigation";
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
    const router = useRouter();
    const params = useParams();
    const {enqueueSnackbar} = useSnackbar();
    const [org, setOrg] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [permissionsByUser, setPermissionsByUser] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const [orgRes, employeesRes] = await Promise.all([
                    service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.DETAIL(params.orgId)),
                    service_api.get(`${NEXT_API_ENDPOINTS.AUTHENTICATION.ADMIN_USERS_LIST}?organization=${params.orgId}`),
                ]);
                setOrg(orgRes.data);
                const emps = Array.isArray(employeesRes.data) ? employeesRes.data : [];
                setEmployees(emps);

                const permResults = await Promise.all(
                    emps.map((e) =>
                        service_api.get(`${NEXT_API_ENDPOINTS.PERMISSIONS.USER_PERMISSIONS}?user=${e.id}`)
                            .then((r) => [e.id, Array.isArray(r.data) ? r.data : []])
                            .catch(() => [e.id, []])
                    )
                );
                setPermissionsByUser(Object.fromEntries(permResults));
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
                router.push(APP_ROUTES.INZIBATCI_ICAZELER);
            } finally {
                setLoading(false);
            }
        })();
    }, [params.orgId]);

    return (
        <AppShell>
            <Box sx={{maxWidth: 1080, mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Giriş nəzarəti
                    </Link>
                    {' / '}
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI_ICAZELER)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        İcazələrin idarə edilməsi
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>{org?.full_name || '...'}</span>
                </Typography>

                <Box sx={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3}}>
                    <Box>
                        <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary}}>
                            {org?.full_name}
                        </Typography>
                        <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5}}>
                            İşçilərə verilmiş modul icazələri.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained" startIcon={<AddIcon/>}
                        onClick={() => router.push(`${APP_ROUTES.INZIBATCI_ICAZELER}/icaze-yarat?organization=${params.orgId}`)}
                        sx={{
                            backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13,
                            '&:hover': {backgroundColor: GOV.navyMid},
                        }}
                    >
                        Yeni icazə
                    </Button>
                </Box>

                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                        <CircularProgress size={24}/>
                    </Box>
                ) : employees.length === 0 ? (
                    <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, textAlign: 'center', py: 6}}>
                        <Typography sx={{fontSize: 13, color: GOV.textMuted}}>
                            Bu təşkilatda işçi tapılmadı.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                        {employees.map((emp, i) => {
                            const perms = permissionsByUser[emp.id] || [];
                            return (
                                <Box
                                    key={emp.id}
                                    sx={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        gap: 2, px: 2.5, py: 1.75, flexWrap: 'wrap',
                                        borderBottom: i === employees.length - 1 ? 'none' : `1px solid ${GOV.cardBorder}`,
                                    }}
                                >
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 220}}>
                                        <Avatar sx={{width: 30, height: 30, fontSize: 12, backgroundColor: GOV.navySoft, color: '#fff'}}>
                                            {initialsOf(emp)}
                                        </Avatar>
                                        <Box>
                                            <Typography sx={{fontSize: 13, fontWeight: 600, color: GOV.textPrimary}}>
                                                {emp.full_name}
                                            </Typography>
                                            <Typography sx={{fontSize: 12, color: GOV.textMuted}}>
                                                {emp.email}
                                            </Typography>
                                        </Box>
                                    </Box>

                                    <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.75, flexGrow: 1}}>
                                        {perms.length === 0 ? (
                                            <Typography sx={{fontSize: 12.5, color: GOV.textMuted}}>
                                                Heç bir modula icazəsi yoxdur.
                                            </Typography>
                                        ) : (
                                            perms.map((p) => (
                                                <Chip
                                                    key={p.id} size="small" label={p.module_title}
                                                    sx={{
                                                        fontSize: 11.5, fontWeight: 600, backgroundColor: GOV.pageBg,
                                                        color: GOV.textPrimary,
                                                    }}
                                                />
                                            ))
                                        )}
                                    </Box>

                                    <Link
                                        component="button"
                                        onClick={() => router.push(`${APP_ROUTES.INZIBATCI_ICAZELER}/icaze-yarat?organization=${params.orgId}&employee=${emp.id}`)}
                                        sx={{fontSize: 12.5, fontWeight: 600, color: GOV.navySoft, textDecoration: 'none', flexShrink: 0}}
                                    >
                                        İcazəni redaktə et
                                    </Link>
                                </Box>
                            );
                        })}
                    </Box>
                )}
            </Box>
        </AppShell>
    );
}
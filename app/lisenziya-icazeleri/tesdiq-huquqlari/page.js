"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import PermissionGrid from "@/components/atoms/licenses/PermissionGrid";

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingKey, setPendingKey] = useState(null);
    const [search, setSearch] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.WORKFLOW.STAGE2_PERMISSIONS);
            setData(res.data);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const handleToggle = async (userId, docType, value) => {
        const key = `${userId}:${docType}`;
        setPendingKey(key);
        setData((prev) => ({
            ...prev,
            users: prev.users.map((u) => u.id === userId
                ? {...u, permissions: {...u.permissions, [docType]: value}}
                : u),
        }));
        try {
            await service_api.post(NEXT_API_ENDPOINTS.WORKFLOW.STAGE2_PERMISSIONS, {
                user: userId, doc_type: docType, value,
            });
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
            setData((prev) => ({
                ...prev,
                users: prev.users.map((u) => u.id === userId
                    ? {...u, permissions: {...u.permissions, [docType]: !value}}
                    : u),
            }));
        } finally {
            setPendingKey(null);
        }
    };

    const filteredUsers = [
        ...(data?.stage1_users || []),
        ...(data?.stage2_users || []),
    ].filter((u) => {
        if (!search) return true;

        const q = search.toLowerCase();

        return (
            u.full_name?.toLowerCase().includes(q) ||
            u.username?.toLowerCase().includes(q)
        );
    });

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        İnzibatçı paneli
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Təsdiq hüquqları</span>
                </Typography>

                <Typography sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5}}>
                    LİSENZİYA VƏ SƏNƏDLƏR · 2-Cİ MƏRHƏLƏ
                </Typography>
                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>
                    Təsdiq hüquqları
                </Typography>
                <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5, mb: 3}}>
                    Hansı istifadəçilərin hansı lisenziya kateqoriyaları üzrə yoxlama və son təsdiq hüququ olduğunu təyin edin.
                </Typography>

                <TextField
                    size="small" placeholder="İstifadəçi axtar..." value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{mb: 2.5, minWidth: 280, backgroundColor: '#fff'}}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon sx={{fontSize: 18, color: GOV.textMuted}}/>
                            </InputAdornment>
                        ),
                    }}
                />

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                    <PermissionGrid
                        loading={loading}
                        docTypes={data?.doc_types || []}
                        users={filteredUsers}
                        pendingKey={pendingKey}
                        onToggle={handleToggle}
                        emptyText="İstifadəçi tapılmadı."
                    />
                </Box>
            </Box>
        </AppShell>
    );
}
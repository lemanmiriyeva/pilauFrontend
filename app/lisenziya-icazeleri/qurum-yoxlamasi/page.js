"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
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

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.WORKFLOW.STAGE1_PERMISSIONS);
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
        // Optimistik UI - dərhal switch-i dəyişdir, sorğu uğursuz olarsa geri qaytar.
        setData((prev) => ({
            ...prev,
            users: prev.users.map((u) => u.id === userId
                ? {...u, permissions: {...u.permissions, [docType]: value}}
                : u),
        }));
        try {
            await service_api.post(NEXT_API_ENDPOINTS.WORKFLOW.STAGE1_PERMISSIONS, {
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

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Ana səhifə
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Qurum yoxlaması icazələri</span>
                </Typography>

                <Typography sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5}}>
                    LİSENZİYA VƏ SƏNƏDLƏR · 1-Cİ MƏRHƏLƏ
                </Typography>
                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>
                    Qurum yoxlaması icazələri
                </Typography>
                <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5, mb: 3}}>
                    {data?.organization?.full_name
                        ? `${data.organization.full_name} təşkilatının işçilərinə hansı lisenziya kateqoriyalarını ilkin yoxlaya biləcəklərini təyin edin.`
                        : 'Təşkilatınızın işçilərinə hansı lisenziya kateqoriyalarını ilkin yoxlaya biləcəklərini təyin edin.'}
                </Typography>

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                    <PermissionGrid
                        loading={loading}
                        docTypes={data?.doc_types || []}
                        users={data?.users || []}
                        pendingKey={pendingKey}
                        onToggle={handleToggle}
                        emptyText="Təşkilatınızda aktiv istifadəçi tapılmadı."
                    />
                </Box>
            </Box>
        </AppShell>
    );
}
"use client"

import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import {useRouter} from "next/navigation";

import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";

import AppHeader from "@/components/atoms/AppHeader";
import AdminSidebar from "@/components/atoms/admin/AdminSidebar";

export default function AppShell({children, onReady}) {
    const [user, setUser] = useState(null);
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(false);

    const router = useRouter();

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            try {
                const [userRes, modulesRes] = await Promise.all([service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.USER),

                    service_api.get(NEXT_API_ENDPOINTS.PERMISSIONS.MY_MODULES),]);

                if (!mounted) return;

                const currentUser = userRes.data;

                const modules = Array.isArray(modulesRes.data) ? modulesRes.data : [];

                setUser(currentUser);
                setTree(modules);

                onReady && onReady({
                    user: currentUser,
                });

            } catch (e) {
                if (!mounted) return;

                router.push(APP_ROUTES.SIGNIN);
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadData();

        return () => {
            mounted = false;
        };
    }, [router, onReady]);

    if (loading) {
        return (<Box
                sx={{
                    display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh',
                }}
            >
                <CircularProgress size={28}/>
            </Box>);
    }

    /*
     * IMPORTANT:
     *
     * Artıq "Təsdiq hüquqları",
     * "Təsdiq axını",
     * "Departamentlər və vəzifələr"
     * frontend-də əl ilə əlavə edilmir.
     *
     * Bu modullar permissions_module.Module cədvəlində
     * mövcuddur və MY_MODULES API tərəfindən qaytarılmalıdır.
     *
     * Buna görə sidebar-a birbaşa backend-dən gələn tree ötürülür.
     */
    const sidebarTree = tree;

    return (<Box
            sx={{
                minHeight: '100vh', backgroundColor: GOV.pageBg,
            }}
        >
            <AppHeader user={user}/>

            <Box
                sx={{
                    display: 'flex', alignItems: 'stretch', minHeight: 'calc(100vh - 62px)',
                }}
            >
                <AdminSidebar
                    tree={sidebarTree}
                    collapsed={collapsed}
                    onToggleCollapsed={() => setCollapsed((c) => !c)}
                />

                <Box
                    sx={{
                        flexGrow: 1, minWidth: 0,
                    }}
                >
                    {typeof children === 'function' ? children({
                        user, tree,
                    }) : children}
                </Box>
            </Box>
        </Box>);
}
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
        (async () => {
            try {
                const [userRes, modulesRes] = await Promise.all([
                    service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.USER),
                    service_api.get(NEXT_API_ENDPOINTS.PERMISSIONS.MY_MODULES),
                ]);
                setUser(userRes.data);
                setTree(modulesRes.data);
                onReady && onReady({user: userRes.data});
            } catch (e) {
                router.push(APP_ROUTES.SIGNIN);
                return;
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh'}}>
                <CircularProgress size={28}/>
            </Box>
        );
    }

    // Mərhələli təsdiqləmə icazə ekranları (Qurum yoxlaması / Təsdiq hüquqları) DB modul
    // ağacında deyil - istifadəçi rolundan (is_org_admin / is_staff) asılı olaraq "İnzibatçı
    // Paneli" budağına sadəcə sidebar-da görünmək üçün əlavə olunur. Real icazə yoxlaması
    // backend-də olur (bax: workflow app) - bu, yalnız naviqasiyadır.
    const sidebarTree = tree.map((module) => {
        if (module.key !== 'inzibatci-paneli') return module;
        const extraChildren = [];
        if (user?.is_org_admin) {
            extraChildren.push({
                id: 'qurum-yoxlamasi-icazeleri', key: 'qurum-yoxlamasi-icazeleri',
                title: 'Qurum yoxlaması icazələri', children: [],
            });
        }
        if (user?.is_staff) {
            extraChildren.push({
                id: 'tesdiq-huquqlari', key: 'tesdiq-huquqlari',
                title: 'Təsdiq hüquqları', children: [],
            });
        }
        if (extraChildren.length === 0) return module;
        return {...module, children: [...(module.children || []), ...extraChildren]};
    });

    return (
        <Box sx={{minHeight: '100vh', backgroundColor: GOV.pageBg}}>
            <AppHeader user={user}/>
            <Box sx={{display: 'flex', alignItems: 'stretch', minHeight: 'calc(100vh - 62px)'}}>
                <AdminSidebar tree={sidebarTree} collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)}/>
                <Box sx={{flexGrow: 1, minWidth: 0}}>
                    {typeof children === 'function' ? children({user, tree}) : children}
                </Box>
            </Box>
        </Box>
    );
}
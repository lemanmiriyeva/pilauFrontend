"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import {useRouter} from "next/navigation";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppHeader from "@/components/atoms/AppHeader";
import ModuleCard from "@/components/atoms/ModuleCard";

export default function Page() {
    const [user, setUser] = useState(null);
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                const [userRes, modulesRes] = await Promise.all([
                    service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.USER),
                    service_api.get(NEXT_API_ENDPOINTS.PERMISSIONS.MY_MODULES),
                ]);
                setUser(userRes.data);
                setModules(modulesRes.data);
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

    return (
        <Box sx={{minHeight: '100vh', backgroundColor: GOV.pageBg}}>
            <AppHeader user={user}/>

            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 5, md: 8}}}>
                <Box sx={{textAlign: 'center', mb: 6}}>
                    <Typography sx={{
                        fontSize: {xs: 26, md: 34}, fontWeight: 800, letterSpacing: 1,
                        color: GOV.textPrimary, textTransform: 'uppercase',
                    }}>
                        Pilau Sistemi
                    </Typography>
                    <Box sx={{width: 48, height: 3, backgroundColor: GOV.navySoft, mx: 'auto', mt: 1.5}}/>
                </Box>

                <Box sx={{display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2}}>
                    <Typography sx={{fontSize: 14, fontWeight: 700, color: GOV.textPrimary}}>
                        Modullar
                    </Typography>
                    <Typography sx={{fontSize: 12, color: GOV.textMuted, letterSpacing: 0.5}}>
                        {modules.length} MODUL
                    </Typography>
                </Box>

                {modules.length === 0 ? (
                    <Typography sx={{fontSize: 13, color: GOV.textMuted, py: 4, textAlign: 'center'}}>
                        Hazırda heç bir modula girişiniz yoxdur. Administrator ilə əlaqə saxlayın.
                    </Typography>
                ) : (
                    <Box sx={{
                        display: 'grid', gap: 2,
                        gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr'},
                    }}>
                        {modules.map((m) => (
                            <ModuleCard
                                key={m.id}
                                module={m}
                                variant="home"
                                onClick={() => {
                                    const path = m.key.startsWith('/') ? m.key : `modullar/${m.key}`;
                                    const finalRoute = m.key.includes('inzibatci-paneli')
                                        ? `/${m.key.replace(/^\/+/, '')}`
                                        : `modullar/${m.key}`;

                                    router.push(finalRoute);
                                }}
                            />
                        ))}
                    </Box>
                )}
            </Box>
        </Box>
    );
}
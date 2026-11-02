"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import {useRouter} from "next/navigation";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import ModulesTab from "@/components/atoms/organizations/profile/ModulesTab";

/** Nazirlik admini: bütün qurum adminləri üçün ümumi modul konfiqurasiyası. */
export default function Page() {
    const router = useRouter();
    return (
        <AppShell onReady={({user}) => { if (user && !user.is_staff && !user.is_superuser) router.replace(APP_ROUTES.INZIBATCI); }}>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Giriş nəzarəti
                    </Link>
                    {' / '}<span>Qurum modulları</span>
                </Typography>
                <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary, mb: 3}}>
                    Qurum adminləri üçün modullar
                </Typography>
                <ModulesTab global/>
            </Box>
        </AppShell>
    );
}

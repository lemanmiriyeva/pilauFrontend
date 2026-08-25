"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import {useRouter} from "next/navigation";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import ModuleCard from "@/components/atoms/ModuleCard";

const CARDS = [
    {
        id: 'teskilatlar',
        title: 'Təşkilatlar',
        description: 'Hər təşkilatın yaratdığı lisenziya sənədlərinə görə statistik dashboard-a keçin.',
        icon: 'apartment',
        href: APP_ROUTES.HESABATLAR_TESKILATLAR,
    },
    {
        id: 'statistik-melumatlar',
        title: 'Statistik məlumatlar',
        description: 'Bütün təşkilatlar üzrə ümumi lisenziya statistikası - status, kateqoriya və zaman üzrə.',
        icon: 'assessment',
        href: APP_ROUTES.HESABATLAR_STATISTIK,
    },
];

export default function Page() {
    const router = useRouter();

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Ana Səhifə
                    </Link>
                    {' / '}
                    <span>Hesabatlar</span>
                </Typography>

                <Box sx={{textAlign: 'center', mb: 5}}>
                    <Typography sx={{
                        fontSize: {xs: 22, md: 28}, fontWeight: 800, letterSpacing: 1,
                        color: GOV.textPrimary, textTransform: 'uppercase',
                    }}>
                        Hesabatlar
                    </Typography>
                </Box>

                <Box sx={{display: 'grid', gap: 2, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}}}>
                    {CARDS.map((card) => (
                        <ModuleCard
                            key={card.id} module={card} variant="sub"
                            onClick={() => router.push(card.href)}
                        />
                    ))}
                </Box>
            </Box>
        </AppShell>
    );
}
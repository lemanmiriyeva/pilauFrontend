"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import {useRouter} from "next/navigation";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import ApprovalFlowTab from "@/components/atoms/organizations/profile/ApprovalFlowTab";

/** Qurum admini üçün: öz təşkilatının təsdiq axını (Nazirlik admini ümumi səhifəni istifadə edir). */
export default function Page() {
    const router = useRouter();
    const [user, setUser] = useState(null);

    return (
        <AppShell onReady={({user}) => {
            if (user?.is_staff || user?.is_superuser) router.replace(APP_ROUTES.TESDIQ_AXINI);
            else setUser(user);
        }}>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Giriş nəzarəti
                    </Link>
                    {' / '}<span>Təsdiq axını</span>
                </Typography>
                <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary, mb: 3}}>Təsdiq axını</Typography>
                {user?.organization
                    ? <ApprovalFlowTab orgId={user.organization}/>
                    : <Box sx={{py: 6, textAlign: 'center'}}><CircularProgress size={28}/></Box>}
            </Box>
        </AppShell>
    );
}

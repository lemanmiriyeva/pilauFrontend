"use client"
import React, {useEffect} from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import {useRouter} from "next/navigation";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";

export default function Page() {
    const router = useRouter();

    useEffect(() => {
        (async () => {
            try {
                await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.LOGOUT);
            } finally {
                router.push(APP_ROUTES.SIGNIN);
            }
        })();
    }, []);

    return (
        <Box sx={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: '100vh', gap: 2,
        }}>
            <CircularProgress size={28}/>
            <Typography sx={{fontSize: 14, color: '#6B7280'}}>Çıxış edilir…</Typography>
        </Box>
    );
}

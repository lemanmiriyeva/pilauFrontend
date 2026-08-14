"use client"
import React, {useState} from 'react';
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
import OrganizationForm from "@/components/atoms/organizations/OrganizationForm";

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (form) => {
        setSubmitting(true);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.LIST, form);
            enqueueSnackbar('Təşkilat uğurla yaradıldı.', {variant: 'success'});
            router.push(APP_ROUTES.TESKILATLAR);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Typography sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5}}>
                        HÜQUQİ ŞƏXSLƏR
                    </Typography>
                </Typography>

                <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary, mb: 3}}>
                    Təşkilat yarat
                </Typography>

                <OrganizationForm
                    mode="create" submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={() => router.push(APP_ROUTES.TESKILATLAR)}
                />
            </Box>
        </AppShell>
    );
}
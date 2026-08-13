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
import UserForm from "@/components/atoms/admin/UserForm";

export default function Page() {
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();

    const handleSubmit = async (form) => {
        setSubmitting(true);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.ADMIN_CREATE_USER, {
                first_name: form.first_name,
                last_name: form.last_name,
                username: form.username,
                email: form.email,
                phone: form.phone,
                organization: form.organization || null,
                fin_kod: form.fin_kod,
                id_card_serial: form.id_card_serial,
                modules: form.modules,
            });
            enqueueSnackbar('İstifadəçi uğurla yaradıldı. Şifrə təyini üçün e-poçt göndərildi.', {variant: 'success'});
            router.push(APP_ROUTES.INZIBATCI_ISTIFADECILER);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppShell>
            <Box sx={{maxWidth: 900, mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Giriş nəzarəti
                    </Link>
                    {' / '}
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI_ISTIFADECILER)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        İstifadəçilər
                    </Link>
                    {' / '}
                    <span>Yeni istifadəçi</span>
                </Typography>

                <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary, mb: 3}}>
                    Yeni istifadəçi
                </Typography>

                <UserForm
                    mode="create" submitting={submitting}
                    onSubmit={handleSubmit}
                    onCancel={() => router.push(APP_ROUTES.INZIBATCI_ISTIFADECILER)}
                />
            </Box>
        </AppShell>
    );
}
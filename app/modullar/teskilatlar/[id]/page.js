"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import CircularProgress from '@mui/material/CircularProgress';
import {useRouter, useParams} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import OrganizationForm from "@/components/atoms/OrganizationForm";

export default function Page() {
    const router = useRouter();
    const params = useParams();
    const {enqueueSnackbar} = useSnackbar();
    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.DETAIL(params.id));
                setOrg(res.data);
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
                router.push(APP_ROUTES.TESKILATLAR);
            } finally {
                setLoading(false);
            }
        })();
    }, [params.id]);

    const handleSubmit = async (form) => {
        setSubmitting(true);
        try {
            await service_api.patch(NEXT_API_ENDPOINTS.ORGANIZATIONS.DETAIL(params.id), form);
            enqueueSnackbar('Dəyişikliklər yadda saxlanıldı.', {variant: 'success'});
            router.push(APP_ROUTES.TESKILATLAR);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppShell>
            <Box sx={{maxWidth: 900, mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.TESKILATLAR)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Təşkilatlar
                    </Link>
                    {' / '}
                    <span>Redaktə</span>
                </Typography>

                <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary, mb: 3}}>
                    Təşkilatı redaktə et
                </Typography>

                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                        <CircularProgress size={24}/>
                    </Box>
                ) : (
                    <OrganizationForm
                        mode="edit" submitting={submitting}
                        initialData={org}
                        onSubmit={handleSubmit}
                        onCancel={() => router.push(APP_ROUTES.TESKILATLAR)}
                    />
                )}
            </Box>
        </AppShell>
    );
}
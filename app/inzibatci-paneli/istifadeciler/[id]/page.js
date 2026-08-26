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
import UserForm from "@/components/atoms/admin/UserForm";

export default function Page() {
    const {id} = useParams();
    const [user, setUser] = useState(null);
    const [initialModules, setInitialModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        (async () => {
            try {
                const [userRes, permRes] = await Promise.all([
                    service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.ADMIN_USER_DETAIL(id)),
                    service_api.get(`${NEXT_API_ENDPOINTS.PERMISSIONS.USER_PERMISSIONS}?user=${id}`),
                ]);
                setUser(userRes.data);
                setInitialModules(Array.isArray(permRes.data) ? permRes.data : []);
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
                router.push(APP_ROUTES.INZIBATCI_ISTIFADECILER);
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    const handleSubmit = async (form) => {
        setSubmitting(true);
        try {
            await service_api.patch(
                NEXT_API_ENDPOINTS.AUTHENTICATION.ADMIN_USER_DETAIL(id),
                {
                    first_name: form.first_name,
                    last_name: form.last_name,
                    email: form.email,
                    phone: form.phone,
                    organization: form.organization || null,

                    department: form.department || null,
                    position: form.position || null,
                    birth_date: form.birth_date || null,

                    fin_kod: form.fin_kod,
                    id_card_serial: form.id_card_serial,

                    approver_doc_types: form.approver_doc_types,
                }
            );
            if (form.modules && form.modules.length) {
                await service_api.post(NEXT_API_ENDPOINTS.PERMISSIONS.GRANT, {
                    user: Number(id), modules: form.modules,
                });
            }
            enqueueSnackbar('Dəyişikliklər yadda saxlanıldı.', {variant: 'success'});
            router.push(APP_ROUTES.INZIBATCI_ISTIFADECILER);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
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
                    <span>Redaktə</span>
                </Typography>

                <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary, mb: 3}}>
                    İstifadəçini redaktə et
                </Typography>

                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                        <CircularProgress size={24}/>
                    </Box>
                ) : (
                    <UserForm
                        mode="edit" submitting={submitting}
                        initialData={user} initialModules={initialModules}
                        onSubmit={handleSubmit}
                        onCancel={() => router.push(APP_ROUTES.INZIBATCI_ISTIFADECILER)}
                    />
                )}
            </Box>
        </AppShell>
    );
}
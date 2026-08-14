"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import {useRouter, useSearchParams} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import OrganizationSelect from "@/components/atoms/admin/OrganizationSelect";
import ModulePermissionsPicker from "@/components/atoms/admin/ModulePermissionsPicker";

export default function Page() {
    const searchParams = useSearchParams();
    const [organization, setOrganization] = useState(searchParams.get('organization') || '');
    const [employees, setEmployees] = useState([]);
    const [employee, setEmployee] = useState('');
    const [modules, setModules] = useState([]);
    const [initialModules, setInitialModules] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const preselectedEmployee = searchParams.get('employee') || '';

    useEffect(() => {
        setEmployee('');
        if (!organization) {
            setEmployees([]);
            return;
        }
        (async () => {
            try {
                const res = await service_api.get(
                    `${NEXT_API_ENDPOINTS.AUTHENTICATION.ADMIN_USERS_LIST}?organization=${organization}`
                );
                const emps = Array.isArray(res.data) ? res.data : [];
                setEmployees(emps);
                if (preselectedEmployee && emps.some((e) => String(e.id) === String(preselectedEmployee))) {
                    setEmployee(preselectedEmployee);
                }
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
            }
        })();
    }, [organization]);

    useEffect(() => {
        if (!employee) {
            setInitialModules([]);
            return;
        }
        (async () => {
            try {
                const res = await service_api.get(`${NEXT_API_ENDPOINTS.PERMISSIONS.USER_PERMISSIONS}?user=${employee}`);
                setInitialModules(Array.isArray(res.data) ? res.data : []);
            } catch (e) {
                setInitialModules([]);
            }
        })();
    }, [employee]);

    const handleSubmit = async () => {
        const next = {};
        if (!organization) next.organization = 'Tələb olunur';
        if (!employee) next.employee = 'Tələb olunur';
        setErrors(next);
        if (Object.keys(next).length) return;

        setSubmitting(true);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.PERMISSIONS.GRANT, {
                user: employee, modules,
            });
            enqueueSnackbar('İcazə uğurla yaradıldı.', {variant: 'success'});
            router.push(APP_ROUTES.INZIBATCI_ICAZELER);
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
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI_ICAZELER)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        İcazələrin idarə edilməsi
                    </Link>
                    {' / '}
                    <span>Yeni icazə yarat</span>
                </Typography>

                <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary, mb: 3}}>
                    Yeni icazə yarat
                </Typography>

                <Box sx={{display: 'grid', gap: 2.5, mb: 3}}>
                    <OrganizationSelect
                        label="Təşkilatı seçin" required value={organization} onChange={setOrganization}
                        error={!!errors.organization} helperText={errors.organization}
                    />

                    <TextField
                        select fullWidth size="small" label="İşçini seçin" required
                        value={employee} onChange={(e) => setEmployee(e.target.value)}
                        disabled={!organization}
                        error={!!errors.employee} helperText={errors.employee}
                    >
                        {employees.map((e) => (
                            <MenuItem key={e.id} value={e.id}>{e.full_name}</MenuItem>
                        ))}
                        {organization && employees.length === 0 && (
                            <MenuItem disabled value="">Bu təşkilatda işçi tapılmadı</MenuItem>
                        )}
                    </TextField>
                </Box>

                <ModulePermissionsPicker key={employee || 'new'} initialModules={initialModules} onChange={setModules}/>

                <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 4}}>
                    <Button
                        onClick={() => router.push(APP_ROUTES.INZIBATCI_ICAZELER)} disabled={submitting}
                        sx={{textTransform: 'none', fontWeight: 600, fontSize: 13, color: GOV.textMuted}}
                    >
                        Ləğv et
                    </Button>
                    <Button
                        variant="contained" onClick={handleSubmit} disabled={submitting}
                        sx={{
                            backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13,
                            '&:hover': {backgroundColor: GOV.navyMid},
                        }}
                    >
                        YARAT
                    </Button>
                </Box>
            </Box>
        </AppShell>
    );
}
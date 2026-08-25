"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";

const fieldSx = {backgroundColor: '#fff'};

function Field({label, ...props}) {
    return (
        <Box>
            <Typography sx={{
                fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: GOV.textMuted,
                textTransform: 'uppercase', mb: 0.75,
            }}>
                {label}
            </Typography>
            <TextField size="small" fullWidth sx={fieldSx} {...props} />
        </Box>
    );
}

function SelectField({label, value, onChange, options, disabled, emptyLabel}) {
    return (
        <Box>
            <Typography sx={{
                fontSize: 11, fontWeight: 700, letterSpacing: 0.4, color: GOV.textMuted,
                textTransform: 'uppercase', mb: 0.75,
            }}>
                {label}
            </Typography>
            <FormControl size="small" fullWidth>
                <Select
                    displayEmpty value={value ?? ''} onChange={onChange} disabled={disabled}
                    sx={fieldSx}
                >
                    <MenuItem value="">
                        <em style={{color: GOV.textMuted, fontStyle: 'normal'}}>
                            {emptyLabel || 'Seçin...'}
                        </em>
                    </MenuItem>
                    {options.map((o) => (
                        <MenuItem key={o.id} value={o.id}>{o.name}</MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Box>
    );
}

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [user, setUser] = useState(null);
    const [form, setForm] = useState(null);
    const [orgOptions, setOrgOptions] = useState({departments: [], positions: []});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [orgOpen, setOrgOpen] = useState(true);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [userRes, optionsRes] = await Promise.all([
                service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.USER),
                service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.MY_ORGANIZATION_OPTIONS),
            ]);
            setUser(userRes.data);
            setOrgOptions(optionsRes.data || {departments: [], positions: []});
            setForm({
                first_name: userRes.data.first_name || '',
                last_name: userRes.data.last_name || '',
                phone: userRes.data.phone || '',
                email: userRes.data.email || '',
                id_card_serial: userRes.data.id_card_serial || '',
                department: userRes.data.department || '',
                position: userRes.data.position || '',
            });
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const set = (key) => (e) => setForm((f) => ({...f, [key]: e.target.value}));

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await service_api.patch(NEXT_API_ENDPOINTS.AUTHENTICATION.USER, {
                ...form,
                department: form.department || null,
                position: form.position || null,
            });
            setUser(res.data);
            enqueueSnackbar('Məlumatlarınız yadda saxlanıldı.', {variant: 'success'});
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    };

    if (loading || !form) {
        return (
            <AppShell>
                <Box sx={{display: 'flex', justifyContent: 'center', py: 10}}>
                    <CircularProgress size={26}/>
                </Box>
            </AppShell>
        );
    }

    const org = user?.organization_detail;

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Ana səhifə
                    </Link>
                </Typography>

                <Typography sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5}}>
                    ŞƏXSİ KABİNET
                </Typography>
                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mb: 3}}>
                    Məlumatlarım
                </Typography>

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: {xs: 2.5, md: 4}}}>
                    <Box sx={{display: 'grid', gap: 3, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr 1fr'}}}>
                        <Field label="FİN kod" value={user?.fin_kod || ''} disabled/>
                        <Field label="Ad" value={form.first_name} onChange={set('first_name')}/>
                        <Field label="Soyad" value={form.last_name} onChange={set('last_name')}/>

                        <Field
                            label="Şəxsiyyət vəsiqəsinin seriya nömrəsi"
                            value={form.id_card_serial} onChange={set('id_card_serial')}
                        />
                        <Field label="Telefon nömrəsi" value={form.phone} onChange={set('phone')}/>
                        <Field label="Elektron poçt ünvanı" type="email" value={form.email} onChange={set('email')}/>
                    </Box>

                    <Box sx={{mt: 4}}>
                        <Box
                            onClick={() => setOrgOpen((o) => !o)}
                            sx={{
                                display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                                backgroundColor: GOV.pageBg, border: `1px solid ${GOV.cardBorder}`,
                                borderRadius: 1.5, px: 2, py: 1.25,
                            }}
                        >
                            <ExpandMoreIcon sx={{
                                fontSize: 20, color: GOV.textMuted,
                                transform: orgOpen ? 'rotate(0deg)' : 'rotate(-90deg)', transition: 'transform .15s',
                            }}/>
                            <Typography sx={{fontSize: 12.5, fontWeight: 700, color: GOV.textPrimary, letterSpacing: 0.3}}>
                                TƏŞKİLAT
                            </Typography>
                        </Box>

                        {orgOpen && (
                            <Box sx={{display: 'grid', gap: 3, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr 1fr'}, mt: 3}}>
                                <Field label="Təşkilatın adı" value={org?.full_name || ''} disabled/>
                                <Field label="Təşkilatın VÖENİ" value={org?.voen || ''} disabled/>
                                <Field label="Dövlət qeydiyyat nömrəsi" value={org?.state_reg_number || ''} disabled/>

                                <Field label="Təşkilatın elektron poçtu" value={org?.email || ''} disabled/>
                                <Field label="Təşkilatın telefonu" value={org?.phone || ''} disabled/>
                                <Field label="Ünvan" value={org?.address || ''} disabled/>

                                <SelectField
                                    label="Departament/Şöbə" value={form.department}
                                    onChange={set('department')} options={orgOptions.departments}
                                    disabled={orgOptions.departments.length === 0}
                                    emptyLabel={orgOptions.departments.length === 0 ? 'Təşkilat üçün departament təyin olunmayıb' : 'Seçin...'}
                                />
                                <SelectField
                                    label="Vəzifə" value={form.position}
                                    onChange={set('position')} options={orgOptions.positions}
                                    disabled={orgOptions.positions.length === 0}
                                    emptyLabel={orgOptions.positions.length === 0 ? 'Təşkilat üçün vəzifə təyin olunmayıb' : 'Seçin...'}
                                />
                            </Box>
                        )}
                    </Box>

                    <Box sx={{display: 'flex', justifyContent: 'flex-end', mt: 4}}>
                        <Button
                            variant="contained" disabled={saving}
                            onClick={handleSave}
                            sx={{
                                backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13,
                                px: 3, '&:hover': {backgroundColor: GOV.navyMid},
                            }}
                        >
                            {saving ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                        </Button>
                    </Box>
                </Box>
            </Box>
        </AppShell>
    );
}
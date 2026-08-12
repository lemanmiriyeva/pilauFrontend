"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import {GOV} from "@/components/theme/govColors";
import OrganizationSelect from "@/components/admin/OrganizationSelect";
import ModulePermissionsPicker from "@/components/admin/ModulePermissionsPicker";

const emptyForm = {
    first_name: '', last_name: '', username: '', email: '', phone: '',
    organization: '', fin_kod: '', id_card_serial: '',
};

export default function UserForm({mode = 'create', initialData, initialModules = [], onSubmit, onCancel, submitting}) {
    const [form, setForm] = useState({...emptyForm, ...(initialData || {})});
    const [modules, setModules] = useState([]);
    const [errors, setErrors] = useState({});

    const set = (field) => (e) => setForm((f) => ({...f, [field]: e.target.value}));

    const validate = () => {
        const next = {};
        if (!form.first_name) next.first_name = 'Tələb olunur';
        if (!form.last_name) next.last_name = 'Tələb olunur';
        if (mode === 'create' && !form.username) next.username = 'Tələb olunur';
        if (!form.email) next.email = 'Tələb olunur';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit({...form, modules});
    };

    return (
        <Box>
            <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, mb: 3}}>
                <TextField
                    label="Ad" size="small" required value={form.first_name} onChange={set('first_name')}
                    error={!!errors.first_name} helperText={errors.first_name}
                />
                <TextField
                    label="Soyad" size="small" required value={form.last_name} onChange={set('last_name')}
                    error={!!errors.last_name} helperText={errors.last_name}
                />
                <TextField
                    label="İstifadəçi adı" size="small" required={mode === 'create'} disabled={mode === 'edit'}
                    value={form.username} onChange={set('username')}
                    error={!!errors.username} helperText={errors.username}
                />
                <TextField
                    label="E-poçt" size="small" required value={form.email} onChange={set('email')}
                    error={!!errors.email} helperText={errors.email}
                />
                <TextField
                    label="Telefon" size="small" placeholder="+994 __ ___ __ __"
                    value={form.phone} onChange={set('phone')}
                />
                <OrganizationSelect value={form.organization} onChange={(v) => setForm((f) => ({...f, organization: v}))}/>
                <TextField
                    label="FİN kod" size="small" value={form.fin_kod} onChange={set('fin_kod')}
                />
                <TextField
                    label="Şəxsiyyət vəsiqəsinin seriya nömrəsi" size="small"
                    value={form.id_card_serial} onChange={set('id_card_serial')}
                />
            </Box>

            <ModulePermissionsPicker initialModules={initialModules} onChange={setModules}/>

            <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 4}}>
                <Button
                    onClick={onCancel} disabled={submitting}
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
                    {mode === 'create' ? 'İstifadəçini yarat' : 'Yadda saxla'}
                </Button>
            </Box>
        </Box>
    );
}
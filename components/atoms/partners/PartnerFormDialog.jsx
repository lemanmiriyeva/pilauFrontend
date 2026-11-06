"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";

const EMPTY = {name: '', voen: '', country: '', address: '', contact_person: '', phone: '', email: '', note: '', is_active: true, organizations: []};

function errorText(e) {
    const data = e?.response?.data;
    if (data && typeof data === 'object' && !data.detail) {
        const first = Object.values(data)[0];
        return Array.isArray(first) ? first[0] : String(first);
    }
    return handleError(e);
}

/** Partnyor şirkət yaratma/redaktə pəncərəsi (yalnız Nazirlik admini). */
export default function PartnerFormDialog({open, item, orgOptions, onClose, onSaved}) {
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const set = (k) => (e) => setForm((p) => ({...p, [k]: e.target.value}));

    useEffect(() => {
        if (!open) return;
        setError('');
        setForm(item ? {
            ...EMPTY, ...item,
            organizations: (item.organizations || []).map((o) => ({id: o.id, full_name: o.name})),
        } : EMPTY);
    }, [open, item]);

    const submit = async () => {
        if (!form.name.trim()) return setError('Şirkətin adını yazın.');
        setSaving(true);
        setError('');
        try {
            const body = {
                name: form.name.trim(), voen: form.voen, country: form.country, address: form.address,
                contact_person: form.contact_person, phone: form.phone, email: form.email, note: form.note,
                is_active: form.is_active, organization_ids: form.organizations.map((o) => o.id),
            };
            if (item) await service_api.patch(NEXT_API_ENDPOINTS.ORGANIZATIONS.PARTNER(item.id), body);
            else await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.PARTNERS, body);
            onSaved();
        } catch (e) {
            setError(errorText(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="md">
            <DialogTitle sx={{fontWeight: 800}}>{item ? 'Partnyor şirkəti redaktə et' : 'Yeni partnyor şirkət'}</DialogTitle>
            <DialogContent>
                <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2, mt: 1}}>
                    <TextField size="small" label="Şirkətin adı" required value={form.name} onChange={set('name')}
                               sx={{gridColumn: {sm: '1 / -1'}}}/>
                    <TextField size="small" label="VÖEN / qeydiyyat nömrəsi" value={form.voen} onChange={set('voen')}/>
                    <TextField size="small" label="Ölkə" value={form.country} onChange={set('country')}/>
                    <TextField size="small" label="Ünvan" value={form.address} onChange={set('address')}
                               sx={{gridColumn: {sm: '1 / -1'}}}/>
                    <TextField size="small" label="Əlaqə şəxsi" value={form.contact_person} onChange={set('contact_person')}/>
                    <TextField size="small" label="Telefon" value={form.phone} onChange={set('phone')}/>
                    <TextField size="small" label="E-poçt" type="email" value={form.email} onChange={set('email')}
                               sx={{gridColumn: {sm: '1 / -1'}}}/>
                    <Autocomplete
                        multiple size="small" options={orgOptions || []} value={form.organizations}
                        getOptionLabel={(o) => o.full_name || ''}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        onChange={(_, v) => setForm((p) => ({...p, organizations: v}))}
                        noOptionsText="Təşkilat tapılmadı"
                        renderInput={(p) => <TextField {...p} label="İşlədiyi təşkilatlar"/>}
                        sx={{gridColumn: {sm: '1 / -1'}}}
                    />
                    <TextField size="small" label="Qeyd" multiline minRows={2} value={form.note} onChange={set('note')}
                               sx={{gridColumn: {sm: '1 / -1'}}}/>
                    <FormControlLabel
                        control={<Checkbox size="small" checked={form.is_active}
                                           onChange={(e) => setForm((p) => ({...p, is_active: e.target.checked}))}/>}
                        label={<Typography sx={{fontSize: 13}}>Aktivdir</Typography>}
                    />
                </Box>
                {error && <Typography sx={{fontSize: 12.5, color: '#d32f2f', mt: 2}}>{error}</Typography>}
            </DialogContent>
            <DialogActions sx={{px: 3, pb: 2}}>
                <Button onClick={onClose} disabled={saving} sx={{textTransform: 'none'}}>Ləğv et</Button>
                <Button variant="contained" onClick={submit} disabled={saving}
                        sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, '&:hover': {backgroundColor: GOV.navyMid}}}>
                    {saving ? 'Yadda saxlanır...' : 'Yadda saxla'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

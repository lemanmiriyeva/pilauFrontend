"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {GOV} from "@/components/theme/govColors";
import {handleError} from "@/app/utils";
import CatalogAutocomplete from "./CatalogAutocomplete";

export const UNITS = ['ədəd', 'komplekt', 'kq', 'ton', 'litr', 'metr', 'm²', 'm³'];

function errorText(e) {
    const data = e?.response?.data;
    if (data && typeof data === 'object' && !data.detail) {
        const first = Object.values(data)[0];
        return Array.isArray(first) ? first[0] : String(first);
    }
    return handleError(e);
}

const EMPTY = {operation_type: null, category: null, subcategory: null, name: '', unit: '', note: '', organizations: []};

/** Nomenklatura yaratma/redaktə pəncərəsi (yalnız admin). item - redaktə üçün mövcud sətir. */
export default function NomenclatureFormDialog({open, item, orgOptions, onClose, onSaved}) {
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!open) return;
        setError('');
        setForm(item ? {
            operation_type: {id: item.operation_type, name: item.operation_type_name},
            category: {id: item.category, name: item.category_name},
            subcategory: item.subcategory ? {id: item.subcategory, name: item.subcategory_name} : null,
            name: item.name, unit: item.unit || '', note: item.note || '',
            organizations: (item.organizations || []).map((o) => ({id: o.id, full_name: o.name})),
        } : EMPTY);
    }, [open, item]);

    const submit = async () => {
        setError('');
        if (!form.operation_type) return setError('Əməliyyat növünü seçin.');
        if (!form.category) return setError('Kateqoriyanı seçin.');
        if (!form.name.trim()) return setError('Məhsulun adını yazın.');
        setSaving(true);
        try {
            const body = {
                operation_type: form.operation_type.id, category: form.category.id,
                subcategory: form.subcategory ? form.subcategory.id : null,
                name: form.name.trim(), unit: form.unit || '', note: form.note || '',
                organization_ids: form.organizations.map((o) => o.id),
            };
            if (item) await service_api.patch(`${NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURES}/${item.id}`, body);
            else await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURES, body);
            onSaved();
        } catch (e) {
            setError(errorText(e));
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="md">
            <DialogTitle sx={{fontWeight: 800}}>{item ? 'Nomenklaturanı redaktə et' : 'Yeni nomenklatura'}</DialogTitle>
            <DialogContent>
                <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2, mt: 1}}>
                    <CatalogAutocomplete kind="operation-types" label="Əməliyyat növü" required canCreate
                                         value={form.operation_type}
                                         onChange={(v) => setForm((p) => ({...p, operation_type: v}))}/>
                    <CatalogAutocomplete kind="categories" label="Kateqoriya" required canCreate
                                         value={form.category}
                                         onChange={(v) => setForm((p) => ({...p, category: v, subcategory: null}))}/>
                    <CatalogAutocomplete kind="subcategories" label="Alt kateqoriya" canCreate
                                         category={form.category?.id}
                                         value={form.subcategory}
                                         onChange={(v) => setForm((p) => ({...p, subcategory: v}))}/>
                    <Autocomplete
                        size="small" freeSolo options={UNITS} value={form.unit}
                        onInputChange={(_, v) => setForm((p) => ({...p, unit: v}))}
                        renderInput={(p) => <TextField {...p} label="Ölçü vahidi"/>}
                    />
                    <TextField size="small" label="Məhsulun adı" required value={form.name}
                               onChange={(e) => setForm((p) => ({...p, name: e.target.value}))}
                               sx={{gridColumn: {sm: '1 / -1'}}}/>
                    <Autocomplete
                        multiple size="small" options={orgOptions || []} value={form.organizations}
                        getOptionLabel={(o) => o.full_name || ''}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        onChange={(_, v) => setForm((p) => ({...p, organizations: v}))}
                        noOptionsText="Təşkilat tapılmadı"
                        renderInput={(p) => <TextField {...p} label="Təyin olunan təşkilatlar"/>}
                        sx={{gridColumn: {sm: '1 / -1'}}}
                    />
                    <TextField size="small" label="Qeyd" multiline minRows={2} value={form.note}
                               onChange={(e) => setForm((p) => ({...p, note: e.target.value}))}
                               sx={{gridColumn: {sm: '1 / -1'}}}/>
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

"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";
import {SimpleTable} from "./shared";

const EMPTY = {name: '', voen: '', address: '', director_name: ''};

function errorText(e) {
    const data = e?.response?.data;
    if (data && typeof data === 'object' && !data.detail) {
        const first = Object.values(data)[0];
        return Array.isArray(first) ? first[0] : String(first);
    }
    return handleError(e);
}

/** Təşkilata tabe qurumlar. Əlavə/redaktə/silmə - yalnız həmin təşkilatın admini. */
export default function SubordinatesTab({orgId, onChanged}) {
    const {enqueueSnackbar} = useSnackbar();
    const [rows, setRows] = useState([]);
    const [canManage, setCanManage] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.SUBORDINATES(orgId));
            setRows(res.data?.results || []);
            setCanManage(Boolean(res.data?.can_manage));
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [orgId]);

    const set = (k) => (e) => setForm((p) => ({...p, [k]: e.target.value}));
    const openNew = () => { setForm(EMPTY); setErrors({}); setEditing('new'); };
    const openEdit = (r) => {
        setForm({name: r.name, voen: r.voen, address: r.address || '', director_name: r.director_name || ''});
        setErrors({}); setEditing(r);
    };

    const submit = async () => {
        const next = {};
        if (!form.name.trim()) next.name = 'Ad məcburidir';
        if (!form.voen.trim()) next.voen = 'VÖEN məcburidir';
        setErrors(next);
        if (Object.keys(next).length) return;
        setSaving(true);
        try {
            if (editing === 'new') {
                await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.SUBORDINATES(orgId), form);
                enqueueSnackbar('Tabeli qurum əlavə olundu.', {variant: 'success'});
            } else {
                await service_api.patch(NEXT_API_ENDPOINTS.ORGANIZATIONS.SUBORDINATE(editing.id), form);
                enqueueSnackbar('Dəyişikliklər yadda saxlanıldı.', {variant: 'success'});
            }
            setEditing(null);
            await load();
            onChanged && onChanged();
        } catch (e) {
            const d = e?.response?.data;
            if (d && typeof d === 'object' && d.voen) setErrors({voen: Array.isArray(d.voen) ? d.voen[0] : d.voen});
            else enqueueSnackbar(errorText(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    };

    const remove = async (r) => {
        if (!window.confirm(`"${r.name}" tabeli qurumlardan silinsin?`)) return;
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.ORGANIZATIONS.SUBORDINATE(r.id));
            setRows((prev) => prev.filter((x) => x.id !== r.id));
            onChanged && onChanged();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        }
    };

    const columns = [
        {label: 'ADI', width: '2.2fr', render: (r) => <b>{r.name}</b>},
        {label: 'VÖEN', width: '1fr', render: (r) => r.voen},
        {label: 'ÜNVAN', width: '2fr', render: (r) => r.address || '—'},
        {label: 'DİREKTOR', width: '1.4fr', render: (r) => r.director_name || '—'},
        ...(canManage ? [{
            label: '', width: '1fr', render: (r) => (
                <Box sx={{display: 'flex', gap: 2}}>
                    <Link component="button" onClick={() => openEdit(r)} sx={{fontSize: 12.5, fontWeight: 600, color: GOV.navySoft, textDecoration: 'none'}}>Redaktə</Link>
                    <Link component="button" onClick={() => remove(r)} sx={{fontSize: 12.5, fontWeight: 600, color: '#B0374D', textDecoration: 'none'}}>Sil</Link>
                </Box>
            ),
        }] : []),
    ];

    return (
        <Box>
            {canManage && (
                <Box sx={{display: 'flex', justifyContent: 'flex-end', mb: 2}}>
                    <Button
                        variant="contained" startIcon={<AddIcon/>} onClick={openNew}
                        sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13, '&:hover': {backgroundColor: GOV.navyMid}}}
                    >
                        Tabeli qurum əlavə et
                    </Button>
                </Box>
            )}

            {loading ? (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 5}}><CircularProgress size={22}/></Box>
            ) : (
                <SimpleTable columns={columns} rows={rows} empty="Tabeli qurum əlavə olunmayıb."/>
            )}

            <Dialog open={Boolean(editing)} onClose={() => !saving && setEditing(null)} fullWidth maxWidth="sm">
                <DialogTitle sx={{fontWeight: 800}}>{editing === 'new' ? 'Yeni tabeli qurum' : 'Tabeli quruma düzəliş'}</DialogTitle>
                <DialogContent>
                    <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2, mt: 1}}>
                        <TextField size="small" required label="Adı" value={form.name} onChange={set('name')}
                                   error={!!errors.name} helperText={errors.name} sx={{gridColumn: {sm: '1 / -1'}}}/>
                        <TextField size="small" required label="VÖEN" value={form.voen} onChange={set('voen')}
                                   error={!!errors.voen} helperText={errors.voen}/>
                        <TextField size="small" label="Direktor" value={form.director_name} onChange={set('director_name')}/>
                        <TextField size="small" label="Ünvan" value={form.address} onChange={set('address')} sx={{gridColumn: {sm: '1 / -1'}}}/>
                    </Box>
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2}}>
                    <Button onClick={() => setEditing(null)} disabled={saving} sx={{textTransform: 'none'}}>Ləğv et</Button>
                    <Button
                        variant="contained" onClick={submit} disabled={saving}
                        sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, '&:hover': {backgroundColor: GOV.navyMid}}}
                    >
                        {saving ? 'Yadda saxlanır...' : 'Yadda saxla'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

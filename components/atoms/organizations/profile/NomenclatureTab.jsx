"use client"
import React, {useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Link from '@mui/material/Link';
import InputAdornment from '@mui/material/InputAdornment';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";
import {SimpleTable, normalizeAz} from "./shared";

// Bax backend: organizations.models.OrganizationNomenclature.CATEGORY_CHOICES
export const NOMENCLATURE_CATEGORIES = [
    {key: 'herbi_texnika', label: 'Hərbi texnika'},
    {key: 'herbi_silah', label: 'Hərbi silah'},
    {key: 'doyus_sursati', label: 'Döyüş sursatı'},
    {key: 'avadanliq', label: 'Avadanlıq'},
    {key: 'diger', label: 'Digər'},
];
const UNITS = ['ədəd', 'komplekt', 'kq', 'ton', 'litr', 'metr', 'm²', 'm³'];
const EMPTY = {name: '', code: '', category: 'avadanliq', unit: 'ədəd', note: ''};

function errorText(e) {
    const data = e?.response?.data;
    if (data && typeof data === 'object' && !data.detail) {
        const first = Object.values(data)[0];
        return Array.isArray(first) ? first[0] : String(first);
    }
    return handleError(e);
}

/** Təşkilatın nomenklaturası (məhsul/avadanlıq siyahısı). canCreate - əlavə et, canEdit - dəyiş/sil. */
export default function NomenclatureTab({orgId, canCreate, canEdit, canDelete, onChanged}) {
    const {enqueueSnackbar} = useSnackbar();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [editing, setEditing] = useState(null); // null | 'new' | sətir
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURE(orgId));
            setRows(Array.isArray(res.data) ? res.data : (res.data?.results || []));
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [orgId]);

    const visible = useMemo(() => {
        const q = normalizeAz(search.trim());
        return rows.filter((r) => (!category || r.category === category)
            && (!q || normalizeAz(`${r.name} ${r.code}`).includes(q)));
    }, [rows, search, category]);

    const set = (k) => (e) => setForm((p) => ({...p, [k]: e.target.value}));
    const openNew = () => { setForm(EMPTY); setError(''); setEditing('new'); };
    const openEdit = (r) => {
        setForm({name: r.name, code: r.code || '', category: r.category, unit: r.unit || '', note: r.note || ''});
        setError(''); setEditing(r);
    };
    const close = () => !saving && setEditing(null);

    const submit = async () => {
        setError('');
        if (!form.name.trim()) return setError('Adı yazın.');
        setSaving(true);
        try {
            if (editing === 'new') {
                await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURE(orgId), form);
                enqueueSnackbar('Nomenklatura mövqeyi əlavə olundu.', {variant: 'success'});
            } else {
                await service_api.patch(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURE_ITEM(editing.id), form);
                enqueueSnackbar('Dəyişikliklər yadda saxlanıldı.', {variant: 'success'});
            }
            setEditing(null);
            await load();
            onChanged && onChanged();
        } catch (e) {
            setError(errorText(e));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (r) => {
        if (!window.confirm(`"${r.name}" nomenklaturadan silinsin?`)) return;
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURE_ITEM(r.id));
            setRows((prev) => prev.filter((x) => x.id !== r.id));
            onChanged && onChanged();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        }
    };

    const columns = [
        {label: 'KOD', width: '0.9fr', render: (r) => <b>{r.code || '—'}</b>},
        {label: 'ADI', width: '2.4fr', render: (r) => (
            <Box>{r.name}{r.note && <Typography component="span" sx={{display: 'block', fontSize: 11.5, color: GOV.textMuted}}>{r.note}</Typography>}</Box>
        )},
        {label: 'KATEQORİYA', width: '1.2fr', render: (r) => r.category_label},
        {label: 'ÖLÇÜ VAHİDİ', width: '0.8fr', render: (r) => r.unit || '—'},
        ...(canEdit || canDelete ? [{
            label: '', width: '1fr', render: (r) => (
                <Box sx={{display: 'flex', gap: 2}}>
                    {canEdit && <Link component="button" onClick={() => openEdit(r)} sx={{fontSize: 12.5, fontWeight: 600, color: GOV.navySoft, textDecoration: 'none'}}>Redaktə</Link>}
                    {canDelete && <Link component="button" onClick={() => remove(r)} sx={{fontSize: 12.5, fontWeight: 600, color: '#B0374D', textDecoration: 'none'}}>Sil</Link>}
                </Box>
            ),
        }] : []),
    ];

    return (
        <Box>
            <Box sx={{display: 'flex', gap: 1.5, alignItems: 'center', mb: 2, flexWrap: 'wrap'}}>
                <TextField
                    size="small" placeholder="Ad və ya kod üzrə axtar..." value={search}
                    onChange={(e) => setSearch(e.target.value)} sx={{flex: '1 1 260px', backgroundColor: '#fff'}}
                    InputProps={{startAdornment: <InputAdornment position="start"><SearchIcon sx={{fontSize: 20, color: GOV.textMuted}}/></InputAdornment>}}
                />
                <TextField size="small" select value={category} onChange={(e) => setCategory(e.target.value)}
                           sx={{minWidth: 200, backgroundColor: '#fff'}} SelectProps={{displayEmpty: true}}>
                    <MenuItem value="">Bütün kateqoriyalar</MenuItem>
                    {NOMENCLATURE_CATEGORIES.map((c) => <MenuItem key={c.key} value={c.key}>{c.label}</MenuItem>)}
                </TextField>
                {canCreate && (
                    <Button
                        variant="contained" startIcon={<AddIcon/>} onClick={openNew}
                        sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13, '&:hover': {backgroundColor: GOV.navyMid}}}
                    >
                        Yeni mövqe
                    </Button>
                )}
            </Box>

            {loading ? (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 5}}><CircularProgress size={22}/></Box>
            ) : (
                <SimpleTable
                    columns={columns} rows={visible}
                    empty={rows.length === 0 ? 'Bu təşkilatın nomenklaturası hələ boşdur.' : 'Axtarışa uyğun mövqe tapılmadı.'}
                />
            )}

            <Dialog open={Boolean(editing)} onClose={close} fullWidth maxWidth="sm">
                <DialogTitle sx={{fontWeight: 800}}>{editing === 'new' ? 'Yeni nomenklatura mövqeyi' : 'Mövqeni redaktə et'}</DialogTitle>
                <DialogContent>
                    <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2, mt: 1}}>
                        <TextField size="small" label="Adı *" value={form.name} onChange={set('name')} sx={{gridColumn: {sm: '1 / -1'}}}/>
                        <TextField size="small" label="Nomenklatura kodu" value={form.code} onChange={set('code')}/>
                        <TextField size="small" select label="Kateqoriya" value={form.category} onChange={set('category')}>
                            {NOMENCLATURE_CATEGORIES.map((c) => <MenuItem key={c.key} value={c.key}>{c.label}</MenuItem>)}
                        </TextField>
                        <TextField size="small" select label="Ölçü vahidi" value={form.unit} onChange={set('unit')}>
                            <MenuItem value="">—</MenuItem>
                            {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                        </TextField>
                        <TextField size="small" label="Qeyd" value={form.note} onChange={set('note')} multiline minRows={2} sx={{gridColumn: {sm: '1 / -1'}}}/>
                    </Box>
                    {error && <Typography sx={{fontSize: 12.5, color: '#d32f2f', mt: 2}}>{error}</Typography>}
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2}}>
                    <Button onClick={close} disabled={saving} sx={{textTransform: 'none'}}>Ləğv et</Button>
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

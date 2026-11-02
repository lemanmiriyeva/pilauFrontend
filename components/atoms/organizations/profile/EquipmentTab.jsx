"use client"
import React, {useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Link from '@mui/material/Link';
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
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

const EMPTY = {name: '', inventory_code: '', group: '', note: '', codes: '', prefix: '', start: '', end: ''};

function errorText(e) {
    const data = e?.response?.data;
    if (data && typeof data === 'object' && !data.detail) {
        const first = Object.values(data)[0];
        return Array.isArray(first) ? first[0] : String(first);
    }
    return handleError(e);
}

/** Əsas avadanlıqlar: ad + inventar kodu. Qrup halında (bir neçə kod) və ya aralıqla əlavə etmək olar. */
export default function EquipmentTab({orgId, canCreate, canEdit, canDelete, onChanged}) {
    const {enqueueSnackbar} = useSnackbar();
    const [rows, setRows] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [group, setGroup] = useState('');
    const [editing, setEditing] = useState(null);
    const [mode, setMode] = useState('single'); // single | codes | range
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.EQUIPMENT(orgId));
            setRows(res.data?.results || []);
            setGroups(res.data?.groups || []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [orgId]);

    const visible = useMemo(() => {
        const q = normalizeAz(search.trim());
        return rows.filter((r) => (!group || (group === '__none__' ? !r.group : r.group === group))
            && (!q || normalizeAz(`${r.name} ${r.inventory_code} ${r.group}`).includes(q)));
    }, [rows, search, group]);

    const set = (k) => (e) => setForm((p) => ({...p, [k]: e.target.value}));
    const openNew = () => { setForm({...EMPTY, group: group && group !== '__none__' ? group : ''}); setMode('single'); setError(''); setEditing('new'); };
    const openEdit = (r) => {
        setForm({...EMPTY, name: r.name, inventory_code: r.inventory_code, group: r.group || '', note: r.note || ''});
        setMode('single'); setError(''); setEditing(r);
    };

    const submit = async () => {
        setError('');
        if (!form.name.trim()) return setError('Avadanlığın adını yazın.');
        let payload = {name: form.name, group: form.group, note: form.note};
        if (editing !== 'new' || mode === 'single') {
            if (!form.inventory_code.trim()) return setError('İnventar kodunu yazın.');
            payload.inventory_code = form.inventory_code;
        } else if (mode === 'codes') {
            if (!form.codes.trim()) return setError('İnventar kodlarını yazın (hər sətirdə bir kod və ya vergüllə).');
            payload.inventory_codes = form.codes;
        } else {
            if (!form.start || !form.end) return setError('Aralığın başlanğıc və son rəqəmini yazın.');
            payload = {...payload, prefix: form.prefix, start: form.start, end: form.end};
        }
        setSaving(true);
        try {
            if (editing === 'new') {
                const res = await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.EQUIPMENT(orgId), payload);
                const d = res.data || {};
                enqueueSnackbar(d.created !== undefined
                    ? `${d.created} avadanlıq əlavə olundu${d.skipped ? `, ${d.skipped} kod artıq mövcud idi` : ''}.`
                    : 'Avadanlıq əlavə olundu.', {variant: 'success'});
            } else {
                await service_api.patch(NEXT_API_ENDPOINTS.ORGANIZATIONS.EQUIPMENT_ITEM(editing.id), payload);
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
        if (!window.confirm(`"${r.name}" (${r.inventory_code}) silinsin?`)) return;
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.ORGANIZATIONS.EQUIPMENT_ITEM(r.id));
            setRows((prev) => prev.filter((x) => x.id !== r.id));
            onChanged && onChanged();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        }
    };

    const removeGroup = async () => {
        const isNone = group === '__none__';
        if (!window.confirm(`${isNone ? 'Qrupsuz' : `"${group}" qrupundakı`} bütün avadanlıqlar silinsin?`)) return;
        try {
            await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.EQUIPMENT_BULK_DELETE(orgId), {group: isNone ? '' : group});
            setGroup('');
            await load();
            onChanged && onChanged();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        }
    };

    const columns = [
        {label: 'AVADANLIĞIN ADI', width: '2.4fr', render: (r) => (
            <Box>{r.name}{r.note && <Typography component="span" sx={{display: 'block', fontSize: 11.5, color: GOV.textMuted}}>{r.note}</Typography>}</Box>
        )},
        {label: 'İNVENTAR KODU', width: '1.2fr', render: (r) => <b>{r.inventory_code}</b>},
        {label: 'QRUP', width: '1.2fr', render: (r) => r.group || '—'},
        ...(canEdit || canDelete ? [{
            label: '', width: '1fr', render: (r) => (
                <Box sx={{display: 'flex', gap: 2}}>
                    {canEdit && <Link component="button" onClick={() => openEdit(r)} sx={{fontSize: 12.5, fontWeight: 600, color: GOV.navySoft, textDecoration: 'none'}}>Redaktə</Link>}
                    {canDelete && <Link component="button" onClick={() => remove(r)} sx={{fontSize: 12.5, fontWeight: 600, color: '#B0374D', textDecoration: 'none'}}>Sil</Link>}
                </Box>
            ),
        }] : []),
    ];

    const isNew = editing === 'new';

    return (
        <Box>
            <Box sx={{display: 'flex', gap: 1.5, alignItems: 'center', mb: 2, flexWrap: 'wrap'}}>
                <TextField
                    size="small" placeholder="Ad, inventar kodu və ya qrup üzrə axtar..." value={search}
                    onChange={(e) => setSearch(e.target.value)} sx={{flex: '1 1 260px', backgroundColor: '#fff'}}
                    InputProps={{startAdornment: <InputAdornment position="start"><SearchIcon sx={{fontSize: 20, color: GOV.textMuted}}/></InputAdornment>}}
                />
                <TextField size="small" select value={group} onChange={(e) => setGroup(e.target.value)}
                           sx={{minWidth: 200, backgroundColor: '#fff'}} SelectProps={{displayEmpty: true}}>
                    <MenuItem value="">Bütün qruplar</MenuItem>
                    {groups.map((g) => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                    <MenuItem value="__none__">Qrupsuz</MenuItem>
                </TextField>
                {canDelete && group && (
                    <Button color="error" onClick={removeGroup} sx={{textTransform: 'none', fontWeight: 600, fontSize: 12.5}}>
                        Qrupu sil
                    </Button>
                )}
                {canCreate && (
                    <Button
                        variant="contained" startIcon={<AddIcon/>} onClick={openNew}
                        sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13, '&:hover': {backgroundColor: GOV.navyMid}}}
                    >
                        Avadanlıq əlavə et
                    </Button>
                )}
            </Box>

            {loading ? (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 5}}><CircularProgress size={22}/></Box>
            ) : (
                <SimpleTable
                    columns={columns} rows={visible}
                    empty={rows.length === 0 ? 'Əsas avadanlıq əlavə olunmayıb.' : 'Axtarışa uyğun avadanlıq tapılmadı.'}
                />
            )}

            <Dialog open={Boolean(editing)} onClose={() => !saving && setEditing(null)} fullWidth maxWidth="sm">
                <DialogTitle sx={{fontWeight: 800}}>{isNew ? 'Əsas avadanlıq əlavə et' : 'Avadanlığa düzəliş'}</DialogTitle>
                <DialogContent>
                    {isNew && (
                        <ToggleButtonGroup
                            exclusive size="small" value={mode} onChange={(_, v) => v && setMode(v)} sx={{mt: 1, mb: 1}}
                        >
                            <ToggleButton value="single" sx={{textTransform: 'none'}}>Tək kod</ToggleButton>
                            <ToggleButton value="codes" sx={{textTransform: 'none'}}>Qrup (bir neçə kod)</ToggleButton>
                            <ToggleButton value="range" sx={{textTransform: 'none'}}>Aralıq</ToggleButton>
                        </ToggleButtonGroup>
                    )}
                    <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2, mt: 1}}>
                        <TextField size="small" required label="Avadanlığın adı" value={form.name} onChange={set('name')} sx={{gridColumn: {sm: '1 / -1'}}}/>
                        <Autocomplete
                            freeSolo size="small" options={groups} value={form.group}
                            onInputChange={(_, v) => setForm((p) => ({...p, group: v}))}
                            renderInput={(params) => <TextField {...params} label="Qrup (könüllü)" helperText="Mövcud qrupu seçin və ya yeni ad yazın"/>}
                            sx={{gridColumn: {sm: '1 / -1'}}}
                        />
                        {(!isNew || mode === 'single') && (
                            <TextField size="small" required label="İnventar kodu" value={form.inventory_code} onChange={set('inventory_code')} sx={{gridColumn: {sm: '1 / -1'}}}/>
                        )}
                        {isNew && mode === 'codes' && (
                            <TextField
                                size="small" required multiline minRows={4} label="İnventar kodları" InputLabelProps={{shrink: true}}
                                placeholder={'INV-001\nINV-002\nINV-003'}
                                helperText="Hər sətirdə bir kod və ya vergüllə ayırın. Hər kod ayrıca avadanlıq kimi yaranacaq."
                                value={form.codes} onChange={set('codes')} sx={{gridColumn: {sm: '1 / -1'}}}
                            />
                        )}
                        {isNew && mode === 'range' && (
                            <>
                                <TextField size="small" label="Prefiks" placeholder="INV-" value={form.prefix} onChange={set('prefix')} sx={{gridColumn: {sm: '1 / -1'}}}/>
                                <TextField size="small" required label="Başlanğıc" placeholder="001" value={form.start} onChange={set('start')}/>
                                <TextField size="small" required label="Son" placeholder="020" value={form.end} onChange={set('end')}
                                           helperText="Məsələn INV-001 … INV-020"/>
                            </>
                        )}
                        <TextField size="small" label="Qeyd" value={form.note} onChange={set('note')} multiline minRows={2} sx={{gridColumn: {sm: '1 / -1'}}}/>
                    </Box>
                    {error && <Typography sx={{fontSize: 12.5, color: '#d32f2f', mt: 2}}>{error}</Typography>}
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

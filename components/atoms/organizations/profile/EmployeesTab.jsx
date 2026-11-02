"use client"
import React, {useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Link from '@mui/material/Link';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";
import {SimpleTable} from "./shared";

const EMPTY = {first_name: '', last_name: '', username: '', email: '', phone: '', department: '', position: '', is_active: true};

function errorText(e) {
    const data = e?.response?.data;
    if (data && typeof data === 'object' && !data.detail) {
        const first = Object.values(data)[0];
        return Array.isArray(first) ? first[0] : String(first);
    }
    return handleError(e);
}

const asList = (d) => (Array.isArray(d) ? d : (d?.results || []));

/** canCreate: yeni işçi əlavə et; canEdit: mövcud işçini redaktə et (bax backend can_org_action). */
export default function EmployeesTab({orgId, canCreate, canEdit, onChanged}) {
    const {enqueueSnackbar} = useSnackbar();
    const [rows, setRows] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(null);   // null | 'new' | işçi sətri
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.EMPLOYEES(orgId));
            setRows(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [orgId]);

    // Departament və vəzifə siyahıları yalnız redaktə/əlavə hüququ olanlara lazımdır
    useEffect(() => {
        if (!(canCreate || canEdit)) return;
        (async () => {
            try {
                const [d, p] = await Promise.all([
                    service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.DEPARTMENTS(orgId)),
                    service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.POSITIONS(orgId)),
                ]);
                setDepartments(asList(d.data));
                setPositions(asList(p.data));
            } catch (e) {
                /* siyahılar boş qalır - seçim məcburi deyil */
            }
        })();
    }, [orgId, canCreate, canEdit]);

    const positionOptions = useMemo(() => {
        if (!form.department) return positions;
        return positions.filter((p) => !p.department || String(p.department) === String(form.department));
    }, [positions, form.department]);

    const openNew = () => { setForm(EMPTY); setError(''); setEditing('new'); };
    const openEdit = (row) => {
        setForm({
            first_name: row.first_name || '', last_name: row.last_name || '', username: row.username,
            email: row.email || '', phone: row.phone || '',
            department: row.department_id || '', position: row.position_id || '', is_active: row.is_active,
        });
        setError('');
        setEditing(row);
    };
    const close = () => !saving && setEditing(null);
    const set = (k) => (e) => setForm((p) => ({...p, [k]: e.target.value}));

    const submit = async () => {
        setError('');
        const isNew = editing === 'new';
        if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || (isNew && !form.username.trim())) {
            setError(isNew ? 'Ad, soyad, istifadəçi adı və e-poçt mütləqdir.' : 'Ad, soyad və e-poçt mütləqdir.');
            return;
        }
        const payload = {
            first_name: form.first_name.trim(), last_name: form.last_name.trim(), email: form.email.trim(),
            phone: form.phone, department: form.department || null, position: form.position || null,
        };
        setSaving(true);
        try {
            if (isNew) {
                await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.EMPLOYEES(orgId), {...payload, username: form.username.trim()});
                enqueueSnackbar('İşçi əlavə olundu. İlkin şifrə: AA123456!', {variant: 'success'});
            } else {
                await service_api.patch(NEXT_API_ENDPOINTS.ORGANIZATIONS.EMPLOYEE(orgId, editing.id), {...payload, is_active: form.is_active});
                enqueueSnackbar('İşçinin məlumatları yadda saxlanıldı.', {variant: 'success'});
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

    const columns = [
        {label: 'AD, SOYAD', width: '1.5fr', render: (r) => <b>{r.full_name}</b>},
        {label: 'İSTİFADƏÇİ ADI', width: '1fr', render: (r) => r.username},
        {label: 'DEPARTAMENT', width: '1.1fr', render: (r) => r.department || '—'},
        {label: 'VƏZİFƏ', width: '1.1fr', render: (r) => r.position || '—'},
        {label: 'E-POÇT / TELEFON', width: '1.7fr', render: (r) => (
            <Box>{r.email || '—'}<Typography component="span" sx={{display: 'block', fontSize: 11.5, color: GOV.textMuted}}>{r.phone || ''}</Typography></Box>
        )},
        {label: 'STATUS', width: '0.8fr', render: (r) => (r.is_active ? 'Aktiv' : <span style={{color: '#B0374D'}}>Deaktiv</span>)},
        ...(canEdit ? [{
            label: '', width: '0.7fr', render: (r) => (
                <Link component="button" onClick={() => openEdit(r)}
                      sx={{fontSize: 12.5, fontWeight: 600, color: GOV.navySoft, textDecoration: 'none'}}>
                    Redaktə
                </Link>
            ),
        }] : []),
    ];

    const isNew = editing === 'new';

    return (
        <Box>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap'}}>
                <Typography sx={{fontSize: 13, color: GOV.textMuted}}>
                    Sistemdə bu təşkilata bağlı istifadəçilər.
                </Typography>
                {canCreate && (
                    <Button
                        variant="contained" startIcon={<PersonAddAlt1Icon/>} onClick={openNew}
                        sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13, '&:hover': {backgroundColor: GOV.navyMid}}}
                    >
                        İşçi əlavə et
                    </Button>
                )}
            </Box>

            {loading ? (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 5}}><CircularProgress size={22}/></Box>
            ) : (
                <SimpleTable columns={columns} rows={rows} empty="Bu təşkilatda hələ işçi yoxdur."/>
            )}

            <Dialog open={Boolean(editing)} onClose={close} fullWidth maxWidth="sm">
                <DialogTitle sx={{fontWeight: 800}}>{isNew ? 'Yeni işçi' : 'İşçini redaktə et'}</DialogTitle>
                <DialogContent>
                    {isNew && (
                        <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 2}}>
                            İşçi üçün ilkin şifrə <b>AA123456!</b> təyin olunur. İlk girişdə 2FA qurub öz şifrəsini yaradacaq.
                        </Typography>
                    )}
                    <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2, mt: isNew ? 0 : 1}}>
                        <TextField size="small" label="Ad *" value={form.first_name} onChange={set('first_name')}/>
                        <TextField size="small" label="Soyad *" value={form.last_name} onChange={set('last_name')}/>
                        <TextField size="small" label="İstifadəçi adı *" value={form.username} onChange={set('username')} disabled={!isNew}/>
                        <TextField size="small" label="E-poçt *" type="email" value={form.email} onChange={set('email')}/>
                        <TextField size="small" select label="Departament" value={form.department}
                                   onChange={(e) => setForm((p) => ({...p, department: e.target.value, position: ''}))}>
                            <MenuItem value="">— seçilməyib —</MenuItem>
                            {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
                        </TextField>
                        <TextField size="small" select label="Vəzifə" value={form.position} onChange={set('position')}>
                            <MenuItem value="">— seçilməyib —</MenuItem>
                            {positionOptions.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
                        </TextField>
                        <TextField size="small" label="Telefon" value={form.phone} onChange={set('phone')} sx={{gridColumn: {sm: '1 / -1'}}}/>
                        {!isNew && (
                            <FormControlLabel
                                sx={{gridColumn: {sm: '1 / -1'}}}
                                control={<Switch checked={form.is_active} onChange={(e) => setForm((p) => ({...p, is_active: e.target.checked}))}/>}
                                label={<Typography sx={{fontSize: 13}}>Hesab aktivdir (sistemə giriş edə bilər)</Typography>}
                            />
                        )}
                    </Box>
                    {error && <Typography sx={{fontSize: 12.5, color: '#d32f2f', mt: 2}}>{error}</Typography>}
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2}}>
                    <Button onClick={close} disabled={saving} sx={{textTransform: 'none'}}>Ləğv et</Button>
                    <Button
                        variant="contained" onClick={submit} disabled={saving}
                        sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, '&:hover': {backgroundColor: GOV.navyMid}}}
                    >
                        {saving ? 'Yadda saxlanır...' : (isNew ? 'Əlavə et' : 'Yadda saxla')}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

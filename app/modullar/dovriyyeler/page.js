"use client"
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import {SimpleTable} from "@/components/atoms/organizations/profile/shared";
import {
    CURRENCIES, DIRECTION_LABELS, SCOPE_LABELS, fmtAmount, fmtDate, fmtQuantity,
} from "@/components/atoms/turnover/shared";

const EMPTY_FILTERS = {organization: null, scope: '', direction: '', date_from: '', date_to: '', q: ''};
const todayStr = () => new Date().toISOString().slice(0, 10);
const EMPTY_FORM = {
    organization: null, scope: 'xarici', direction: 'idxal', date: todayStr(), document_number: '',
    product: '', quantity: '', unit: '', amount: '', currency: 'AZN', note: '',
};

function SummaryCard({title, data}) {
    return (
        <Box sx={{flex: '1 1 240px', backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: 2.25}}>
            <Typography sx={{fontSize: 12, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.5, mb: 1}}>{title.toUpperCase()}</Typography>
            <Typography sx={{fontSize: 26, fontWeight: 800, color: GOV.textPrimary, lineHeight: 1.1}}>
                {data?.count ?? 0}
                <Typography component="span" sx={{fontSize: 12.5, fontWeight: 600, color: GOV.textMuted, ml: 0.75}}>qeyd</Typography>
            </Typography>
            <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mt: 1}}>
                İdxal: <b>{data?.idxal ?? 0}</b> · İxrac: <b>{data?.ixrac ?? 0}</b>
            </Typography>
        </Box>
    );
}

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [data, setData] = useState(null);
    const [filters, setFilters] = useState(EMPTY_FILTERS);
    const [debouncedQ, setDebouncedQ] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const orgsRef = useRef([]);

    // Axtarış sahəsi üçün debounce
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(filters.q), 350);
        return () => clearTimeout(t);
    }, [filters.q]);

    const load = useCallback(async () => {
        const params = new URLSearchParams();
        if (filters.organization) params.set('organization', filters.organization.id);
        if (filters.scope) params.set('scope', filters.scope);
        if (filters.direction) params.set('direction', filters.direction);
        if (filters.date_from) params.set('date_from', filters.date_from);
        if (filters.date_to) params.set('date_to', filters.date_to);
        if (debouncedQ.trim()) params.set('q', debouncedQ.trim());
        try {
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.ORGANIZATIONS.TURNOVER_LIST}?${params.toString()}`);
            orgsRef.current = res.data?.organizations || [];
            setData(res.data);
        } catch (e) {
            enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
            setData((prev) => prev || {permissions: {}, organizations: [], summary: {}, results: []});
        }
    }, [filters.organization, filters.scope, filters.direction, filters.date_from, filters.date_to, debouncedQ]);

    useEffect(() => {
        load();
    }, [load]);

    const canCreate = !!data?.permissions?.can_create;
    const canEdit = !!data?.permissions?.can_edit;
    const organizations = data?.organizations || orgsRef.current;
    const rows = data?.results || [];
    const hasFilters = useMemo(
        () => Object.entries(filters).some(([k, v]) => (k === 'organization' ? !!v : String(v).trim() !== '')),
        [filters]
    );

    const setF = (k) => (e) => setFilters((p) => ({...p, [k]: e.target.value}));
    const setForm_ = (k) => (e) => setForm((p) => ({...p, [k]: e.target.value}));

    const openCreate = () => {
        setEditingId(null);
        setForm({...EMPTY_FORM, date: todayStr()});
        setDialogOpen(true);
    };

    const openEdit = (row) => {
        setEditingId(row.id);
        setForm({
            organization: organizations.find((o) => o.id === row.organization_id) || {id: row.organization_id, name: row.organization_name},
            scope: row.scope, direction: row.direction, date: row.date || todayStr(),
            document_number: row.document_number || '', product: row.product || '',
            quantity: row.quantity ?? '', unit: row.unit || '', amount: row.amount ?? '',
            currency: row.currency || 'AZN', note: row.note || '',
        });
        setDialogOpen(true);
    };

    const save = async () => {
        if (!form.organization) {
            enqueueSnackbar('Təşkilat seçin.', {variant: 'warning'});
            return;
        }
        if (!form.product.trim() || form.quantity === '') {
            enqueueSnackbar('Məhsul (nə) və miqdar daxil edilməlidir.', {variant: 'warning'});
            return;
        }
        const payload = {
            organization: form.organization.id, scope: form.scope, direction: form.direction, date: form.date,
            document_number: form.document_number.trim(), product: form.product.trim(),
            quantity: form.quantity, unit: form.unit.trim(), currency: form.currency, note: form.note.trim(),
            amount: form.amount === '' ? null : form.amount,
        };
        setSaving(true);
        try {
            if (editingId) {
                await service_api.patch(NEXT_API_ENDPOINTS.ORGANIZATIONS.TURNOVER_ITEM(editingId), payload);
                enqueueSnackbar('Dövriyyə yeniləndi.', {variant: 'success', autoHideDuration: 2500});
            } else {
                await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.TURNOVER_LIST, payload);
                enqueueSnackbar('Dövriyyə əlavə olundu.', {variant: 'success', autoHideDuration: 2500});
            }
            setDialogOpen(false);
            await load();
        } catch (e) {
            const d = e?.response?.data;
            const fieldError = d && typeof d === 'object' ? Object.values(d).flat().find((v) => typeof v === 'string') : null;
            enqueueSnackbar(d?.detail || fieldError || handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        {label: 'TARİX', width: '0.8fr', render: (r) => fmtDate(r.date)},
        {label: 'TƏŞKİLAT', width: '1.6fr', render: (r) => <b>{r.organization_name}</b>},
        {label: 'TƏYİNAT', width: '0.7fr', render: (r) => SCOPE_LABELS[r.scope]},
        {label: 'NÖV', width: '0.7fr', render: (r) => DIRECTION_LABELS[r.direction]},
        {label: 'SƏNƏD №', width: '0.9fr', render: (r) => r.document_number || '—'},
        {label: 'NƏ (MƏHSUL)', width: '1.4fr', render: (r) => r.product},
        {label: 'MİQDAR', width: '0.9fr', render: (r) => fmtQuantity(r)},
        {label: 'MƏBLƏĞ', width: '0.9fr', render: (r) => fmtAmount(r)},
        ...(canEdit ? [{
            label: '', width: '0.7fr',
            render: (r) => (
                <Button size="small" onClick={(e) => { e.stopPropagation(); openEdit(r); }}
                        sx={{textTransform: 'none', fontWeight: 700, fontSize: 12.5, color: GOV.navySoft}}>
                    Redaktə
                </Button>
            ),
        }] : []),
    ];

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>Ana səhifə</Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Dövriyyələr</span>
                </Typography>

                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 3}}>
                    <Box>
                        <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>Dövriyyələr</Typography>
                        <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5}}>
                            Bütün təşkilatların xarici və yerli idxal-ixrac dövriyyələri: nə və nə qədər.
                        </Typography>
                    </Box>
                    {canCreate && (
                        <Button variant="contained" onClick={openCreate}
                                sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, '&:hover': {backgroundColor: GOV.navyMid}}}>
                            + Dövriyyə əlavə et
                        </Button>
                    )}
                </Box>

                {data && !canCreate && !canEdit && (
                    <Box sx={{p: 2, mb: 3, borderRadius: 2, backgroundColor: '#E7EEFA', border: '1px solid #A9C0EA'}}>
                        <Typography sx={{fontSize: 13, color: '#1F4E9A', fontWeight: 700}}>
                            Yalnız baxış rejimindəsiniz. Əlavə və redaktə modul admini üçündür.
                        </Typography>
                    </Box>
                )}

                <Box sx={{display: 'flex', gap: 2, flexWrap: 'wrap', mb: 3}}>
                    <SummaryCard title="Xarici dövriyyə" data={data?.summary?.xarici}/>
                    <SummaryCard title="Yerli dövriyyə" data={data?.summary?.yerli}/>
                </Box>

                {/* Filterlər */}
                <Box sx={{
                    display: 'grid', gap: 1.5, p: 2, mb: 2.5, borderRadius: 2, backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`,
                    gridTemplateColumns: {xs: '1fr', md: '1.6fr 1fr 1fr 1fr 1fr'},
                }}>
                    <Autocomplete
                        size="small" options={organizations} value={filters.organization}
                        getOptionLabel={(o) => o?.name || ''} isOptionEqualToValue={(a, b) => a.id === b.id}
                        onChange={(e, v) => setFilters((p) => ({...p, organization: v}))}
                        renderInput={(params) => <TextField {...params} label="Təşkilat"/>}
                        noOptionsText="Təşkilat tapılmadı"
                    />
                    <TextField select size="small" label="Təyinat" value={filters.scope} onChange={setF('scope')}>
                        <MenuItem value="">Hamısı</MenuItem>
                        <MenuItem value="xarici">Xarici</MenuItem>
                        <MenuItem value="yerli">Yerli</MenuItem>
                    </TextField>
                    <TextField select size="small" label="Növ" value={filters.direction} onChange={setF('direction')}>
                        <MenuItem value="">İdxal + İxrac</MenuItem>
                        <MenuItem value="idxal">İdxal</MenuItem>
                        <MenuItem value="ixrac">İxrac</MenuItem>
                    </TextField>
                    <TextField size="small" type="date" label="Tarixdən" value={filters.date_from} onChange={setF('date_from')} InputLabelProps={{shrink: true}}/>
                    <TextField size="small" type="date" label="Tarixə qədər" value={filters.date_to} onChange={setF('date_to')} InputLabelProps={{shrink: true}}/>
                    <TextField size="small" label="Məhsul və ya sənəd № üzrə axtar" value={filters.q} onChange={setF('q')}
                               sx={{gridColumn: {md: 'span 4'}}}/>
                    <Button disabled={!hasFilters} onClick={() => setFilters(EMPTY_FILTERS)} sx={{textTransform: 'none', fontWeight: 700}}>
                        Filterləri təmizlə
                    </Button>
                </Box>

                {!data ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}><CircularProgress size={26}/></Box>
                ) : (
                    <>
                        <SimpleTable columns={columns} rows={rows} empty="Seçilmiş filterlərə uyğun dövriyyə qeydi tapılmadı."/>
                        <Typography sx={{fontSize: 11.5, color: GOV.textMuted, mt: 1.5}}>
                            Cəmi {rows.length} qeyd göstərilir.
                        </Typography>
                    </>
                )}
            </Box>

            {/* Əlavə / redaktə */}
            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{fontSize: 16, fontWeight: 700}}>
                    {editingId ? 'Dövriyyəni redaktə et' : 'Yeni dövriyyə'}
                </DialogTitle>
                <DialogContent>
                    <Box sx={{display: 'grid', gap: 2, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, pt: 1}}>
                        <Autocomplete
                            size="small" options={organizations} value={form.organization} sx={{gridColumn: {sm: 'span 2'}}}
                            getOptionLabel={(o) => o?.name || ''} isOptionEqualToValue={(a, b) => a.id === b.id}
                            onChange={(e, v) => setForm((p) => ({...p, organization: v}))}
                            renderInput={(params) => <TextField {...params} label="Təşkilat *"/>}
                        />
                        <TextField select size="small" label="Təyinat *" value={form.scope} onChange={setForm_('scope')}>
                            <MenuItem value="xarici">Xarici</MenuItem>
                            <MenuItem value="yerli">Yerli</MenuItem>
                        </TextField>
                        <TextField select size="small" label="Növ *" value={form.direction} onChange={setForm_('direction')}>
                            <MenuItem value="idxal">İdxal</MenuItem>
                            <MenuItem value="ixrac">İxrac</MenuItem>
                        </TextField>
                        <TextField size="small" type="date" label="Tarix *" value={form.date} onChange={setForm_('date')} InputLabelProps={{shrink: true}}/>
                        <TextField size="small" label="Sənəd №" value={form.document_number} onChange={setForm_('document_number')}/>
                        <TextField size="small" label="Nə (məhsul) *" value={form.product} onChange={setForm_('product')} sx={{gridColumn: {sm: 'span 2'}}}/>
                        <TextField size="small" type="number" label="Miqdar *" value={form.quantity} onChange={setForm_('quantity')} inputProps={{min: 0, step: 'any'}}/>
                        <TextField size="small" label="Ölçü vahidi (kq, ton, ədəd...)" value={form.unit} onChange={setForm_('unit')}/>
                        <TextField size="small" type="number" label="Məbləğ" value={form.amount} onChange={setForm_('amount')} inputProps={{min: 0, step: 'any'}}/>
                        <TextField select size="small" label="Valyuta" value={form.currency} onChange={setForm_('currency')}>
                            {CURRENCIES.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </TextField>
                        <TextField size="small" label="Qeyd" value={form.note} onChange={setForm_('note')} multiline minRows={2} sx={{gridColumn: {sm: 'span 2'}}}/>
                    </Box>
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2.5}}>
                    <Button onClick={() => setDialogOpen(false)} sx={{textTransform: 'none'}}>Ləğv et</Button>
                    <Button variant="contained" disabled={saving} onClick={save}
                            sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, '&:hover': {backgroundColor: GOV.navyMid}}}>
                        {saving ? 'Saxlanılır...' : 'Yadda saxla'}
                    </Button>
                </DialogActions>
            </Dialog>
        </AppShell>
    );
}
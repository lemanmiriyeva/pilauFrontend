"use client"
import React, {useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Link from '@mui/material/Link';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";
import {SimpleTable, normalizeAz} from "./shared";

/**
 * Təşkilatın nomenklaturası - YALNIZ bu təşkilata təyin olunmuş mövqelər.
 * Nomenklaturanın özü "Nomenklatura" səhifəsində yaradılır; Nazirlik admini (canAssign) burada
 * mövcud mövqeləri təşkilata təyin edə və ya götürə bilər.
 */
export default function NomenclatureTab({orgId, canAssign, onChanged}) {
    const {enqueueSnackbar} = useSnackbar();
    const router = useRouter();
    const [rows, setRows] = useState([]);
    const [all, setAll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [picked, setPicked] = useState([]);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURE(orgId));
            setRows(Array.isArray(res.data) ? res.data : []);
            if (canAssign) {
                const a = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURES);
                setAll(Array.isArray(a.data) ? a.data : []);
            }
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [orgId, canAssign]);

    const available = useMemo(() => {
        const have = new Set(rows.map((r) => r.id));
        return all.filter((n) => !have.has(n.id));
    }, [all, rows]);

    const visible = useMemo(() => {
        const q = normalizeAz(search.trim());
        return rows.filter((r) => !q || normalizeAz(`${r.name} ${r.category_name} ${r.subcategory_name} ${r.operation_type_name}`).includes(q));
    }, [rows, search]);

    const assign = async () => {
        if (!picked.length) return;
        setSaving(true);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURE(orgId), {nomenclature_ids: picked.map((p) => p.id)});
            enqueueSnackbar('Nomenklatura təşkilata təyin olundu.', {variant: 'success'});
            setPicked([]);
            await load();
            onChanged && onChanged();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    };

    const unassign = async (r) => {
        if (!window.confirm(`"${r.name}" bu təşkilatdan götürülsün?`)) return;
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURE_UNASSIGN(orgId, r.id));
            setRows((prev) => prev.filter((x) => x.id !== r.id));
            onChanged && onChanged();
            load();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        }
    };

    const columns = [
        {label: 'ƏMƏLİYYAT NÖVÜ', width: '1.1fr', render: (r) => <b>{r.operation_type_name}</b>},
        {label: 'KATEQORİYA', width: '1.5fr', render: (r) => (
            <Box>{r.category_name}{r.subcategory_name && <Typography component="span" sx={{display: 'block', fontSize: 11.5, color: GOV.textMuted}}>{r.subcategory_name}</Typography>}</Box>
        )},
        {label: 'MƏHSULUN ADI', width: '1.8fr', render: (r) => r.name},
        {label: 'ÖLÇÜ VAHİDİ', width: '0.8fr', render: (r) => r.unit || '—'},
        {label: 'QEYD', width: '1.6fr', render: (r) => r.note || '—'},
        ...(canAssign ? [{
            label: '', width: '0.8fr', render: (r) => (
                <Link component="button" onClick={() => unassign(r)} sx={{fontSize: 12.5, fontWeight: 600, color: '#B0374D', textDecoration: 'none'}}>Götür</Link>
            ),
        }] : []),
    ];

    return (
        <Box>
            <Box sx={{display: 'flex', gap: 1.5, alignItems: 'center', mb: 2, flexWrap: 'wrap'}}>
                <TextField
                    size="small" placeholder="Ad, kateqoriya və ya əməliyyat növü üzrə axtar..." value={search}
                    onChange={(e) => setSearch(e.target.value)} sx={{flex: '1 1 260px', backgroundColor: '#fff'}}
                    InputProps={{startAdornment: <InputAdornment position="start"><SearchIcon sx={{fontSize: 20, color: GOV.textMuted}}/></InputAdornment>}}
                />
                <Button onClick={() => router.push(APP_ROUTES.NOMENKLATURA)} sx={{textTransform: 'none', fontWeight: 600, color: GOV.navySoft}}>
                    Bütün nomenklatura →
                </Button>
            </Box>

            {canAssign && (
                <Box sx={{display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 2, flexWrap: 'wrap'}}>
                    <Autocomplete
                        multiple size="small" options={available} value={picked}
                        getOptionLabel={(o) => `${o.name} · ${o.category_name}${o.subcategory_name ? ' / ' + o.subcategory_name : ''} · ${o.operation_type_name}`}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        onChange={(_, v) => setPicked(v)}
                        noOptionsText="Təyin ediləcək nomenklatura yoxdur"
                        renderInput={(p) => <TextField {...p} label="Nomenklatura təyin et"/>}
                        sx={{flex: '1 1 360px', backgroundColor: '#fff'}}
                    />
                    <Button variant="contained" onClick={assign} disabled={saving || !picked.length}
                            sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, '&:hover': {backgroundColor: GOV.navyMid}}}>
                        Təyin et
                    </Button>
                </Box>
            )}

            {loading ? (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 5}}><CircularProgress size={22}/></Box>
            ) : (
                <SimpleTable
                    columns={columns} rows={visible}
                    empty={rows.length === 0 ? 'Bu təşkilata hələ nomenklatura təyin olunmayıb.' : 'Axtarışa uyğun mövqe tapılmadı.'}
                />
            )}
        </Box>
    );
}

"use client"
import React, {useCallback, useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Link from '@mui/material/Link';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";
import CatalogAutocomplete from "./CatalogAutocomplete";

const TABS = [
    {kind: 'operation-types', label: 'Əməliyyat növləri', placeholder: 'Yeni əməliyyat növü'},
    {kind: 'categories', label: 'Kateqoriyalar', placeholder: 'Yeni kateqoriya'},
    {kind: 'subcategories', label: 'Alt kateqoriyalar', placeholder: 'Yeni alt kateqoriya'},
];

function errText(e) {
    const d = e?.response?.data;
    if (d && typeof d === 'object') {
        const first = d.detail || Object.values(d)[0];
        return Array.isArray(first) ? first[0] : String(first);
    }
    return handleError(e);
}

/** Əməliyyat növü, kateqoriya və alt kateqoriyanı əvvəlcədən yaratmaq / silmək (yalnız admin). */
export default function CatalogManagerDialog({open, onClose}) {
    const {enqueueSnackbar} = useSnackbar();
    const [tab, setTab] = useState(0);
    const [items, setItems] = useState([]);
    const [name, setName] = useState('');
    const [category, setCategory] = useState(null);
    const [busy, setBusy] = useState(false);
    const cfg = TABS[tab];
    const isSub = cfg.kind === 'subcategories';

    const load = useCallback(async () => {
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURE_CATALOG(cfg.kind));
            setItems(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            enqueueSnackbar(errText(e), {variant: 'error'});
        }
    }, [cfg.kind]);

    useEffect(() => { if (open) { setName(''); load(); } }, [open, load]);

    const add = async () => {
        if (!name.trim()) return;
        if (isSub && !category) return enqueueSnackbar('Əvvəlcə kateqoriyanı seçin.', {variant: 'warning'});
        setBusy(true);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURE_CATALOG(cfg.kind),
                isSub ? {name: name.trim(), category: category.id} : {name: name.trim()});
            setName('');
            await load();
        } catch (e) {
            enqueueSnackbar(errText(e), {variant: 'error'});
        } finally {
            setBusy(false);
        }
    };

    const remove = async (it) => {
        if (!window.confirm(`"${it.name}" silinsin?`)) return;
        try {
            await service_api.delete(`${NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURE_CATALOG(cfg.kind)}/${it.id}`);
            setItems((prev) => prev.filter((x) => x.id !== it.id));
        } catch (e) {
            enqueueSnackbar(errText(e), {variant: 'error'});
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle sx={{fontWeight: 800}}>Kataloqlar</DialogTitle>
            <DialogContent>
                <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{mb: 2}}>
                    {TABS.map((t) => <Tab key={t.kind} label={t.label} sx={{textTransform: 'none', fontWeight: 600}}/>)}
                </Tabs>

                <Box sx={{display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap'}}>
                    {isSub && (
                        <Box sx={{flex: '1 1 200px'}}>
                            <CatalogAutocomplete kind="categories" label="Kateqoriya" value={category} onChange={setCategory}/>
                        </Box>
                    )}
                    <TextField size="small" placeholder={cfg.placeholder} value={name}
                               onChange={(e) => setName(e.target.value)}
                               onKeyDown={(e) => e.key === 'Enter' && add()} sx={{flex: '1 1 200px'}}/>
                    <Button variant="contained" onClick={add} disabled={busy || !name.trim()}
                            sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, '&:hover': {backgroundColor: GOV.navyMid}}}>
                        Əlavə et
                    </Button>
                </Box>

                <Box sx={{border: `1px solid ${GOV.cardBorder}`, borderRadius: 1.5, maxHeight: 320, overflowY: 'auto'}}>
                    {items.length === 0 ? (
                        <Typography sx={{p: 2, fontSize: 13, color: GOV.textMuted}}>Siyahı boşdur.</Typography>
                    ) : items.map((it) => (
                        <Box key={it.id} sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, py: 1, borderBottom: `1px solid ${GOV.cardBorder}`, '&:last-of-type': {borderBottom: 'none'}}}>
                            <Typography sx={{fontSize: 13}}>
                                {it.name}
                                {it.category_name && <Typography component="span" sx={{fontSize: 11.5, color: GOV.textMuted, ml: 1}}>{it.category_name}</Typography>}
                            </Typography>
                            <Link component="button" onClick={() => remove(it)} sx={{fontSize: 12.5, fontWeight: 600, color: '#B0374D', textDecoration: 'none'}}>Sil</Link>
                        </Box>
                    ))}
                </Box>
            </DialogContent>
            <DialogActions sx={{px: 3, pb: 2}}>
                <Button onClick={onClose} sx={{textTransform: 'none'}}>Bağla</Button>
            </DialogActions>
        </Dialog>
    );
}

"use client"
import React, {useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";
import {SimpleTable} from "./shared";

/** Təşkilatın partnyor şirkətləri. Nazirlik admini (canAssign) mövcud partnyoru təyin edə/götürə bilər. */
export default function PartnersTab({orgId, canAssign, onChanged}) {
    const {enqueueSnackbar} = useSnackbar();
    const router = useRouter();
    const [rows, setRows] = useState([]);
    const [all, setAll] = useState([]);
    const [loading, setLoading] = useState(true);
    const [picked, setPicked] = useState([]);
    const [saving, setSaving] = useState(false);

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.ORG_PARTNERS(orgId));
            setRows(Array.isArray(res.data) ? res.data : []);
            if (canAssign) {
                const a = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.PARTNERS);
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
        return all.filter((p) => !have.has(p.id));
    }, [all, rows]);

    const assign = async () => {
        if (!picked.length) return;
        setSaving(true);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.ORG_PARTNERS(orgId), {partner_ids: picked.map((p) => p.id)});
            enqueueSnackbar('Partnyor şirkət təşkilata təyin olundu.', {variant: 'success'});
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
            await service_api.delete(NEXT_API_ENDPOINTS.ORGANIZATIONS.ORG_PARTNER_ITEM(orgId, r.id));
            await load();
            onChanged && onChanged();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        }
    };

    const columns = [
        {label: 'ŞİRKƏT', width: '2fr', render: (r) => (
            <Box><b>{r.name}</b>{!r.is_active && <Chip size="small" label="Passiv" sx={{ml: 1}}/>}
                {r.voen && <Typography component="span" sx={{display: 'block', fontSize: 11.5, color: GOV.textMuted}}>VÖEN: {r.voen}</Typography>}</Box>
        )},
        {label: 'ÖLKƏ', width: '1fr', render: (r) => r.country || '—'},
        {label: 'ƏLAQƏ', width: '1.6fr', render: (r) => (
            <Box>{r.contact_person || '—'}
                {(r.phone || r.email) && <Typography component="span" sx={{display: 'block', fontSize: 11.5, color: GOV.textMuted}}>{[r.phone, r.email].filter(Boolean).join(' · ')}</Typography>}</Box>
        )},
        {label: 'QEYD', width: '1.4fr', render: (r) => r.note || '—'},
        ...(canAssign ? [{
            label: '', width: '0.8fr', render: (r) => (
                <Link component="button" onClick={() => unassign(r)} sx={{fontSize: 12.5, fontWeight: 600, color: '#B0374D', textDecoration: 'none'}}>Götür</Link>
            ),
        }] : []),
    ];

    return (
        <Box>
            <Box sx={{display: 'flex', justifyContent: 'flex-end', mb: 1}}>
                <Button onClick={() => router.push(APP_ROUTES.PARTNYORLAR)} sx={{textTransform: 'none', fontWeight: 600, color: GOV.navySoft}}>
                    Bütün partnyor şirkətlər →
                </Button>
            </Box>
            {canAssign && (
                <Box sx={{display: 'flex', gap: 1.5, alignItems: 'flex-start', mb: 2, flexWrap: 'wrap'}}>
                    <Autocomplete
                        multiple size="small" options={available} value={picked}
                        getOptionLabel={(o) => `${o.name}${o.voen ? ' · ' + o.voen : ''}`}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        onChange={(_, v) => setPicked(v)}
                        noOptionsText="Təyin ediləcək partnyor şirkət yoxdur"
                        renderInput={(p) => <TextField {...p} label="Partnyor şirkət təyin et"/>}
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
                <SimpleTable columns={columns} rows={rows} empty="Bu təşkilata hələ partnyor şirkət təyin olunmayıb."/>
            )}
        </Box>
    );
}

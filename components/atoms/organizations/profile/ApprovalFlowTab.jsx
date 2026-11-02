"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";


/** "Təsdiq axını": hər sənəd növü üçün qurum yoxlaması edəcək şəxslərin (çoxlu) seçimi. */
export default function ApprovalFlowTab({orgId}) {
    const {enqueueSnackbar} = useSnackbar();
    const [data, setData] = useState(null);
    const [rows, setRows] = useState({});
    const [savingKey, setSavingKey] = useState(null);

    const apply = (d) => {
        setData(d);
        const map = {};
        d.doc_types.forEach((t) => { map[t.doc_type] = t.reviewer_ids; });
        setRows(map);
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.APPROVAL_FLOW(orgId));
                apply(res.data);
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
            }
        })();
    }, [orgId]);

    if (!data) return <Box sx={{py: 6, textAlign: 'center'}}><CircularProgress size={28}/></Box>;

    const canEdit = data.can_edit;

    const isDirty = (t) => {
        const a = [...(rows[t.doc_type] || [])].sort().join(',');
        const b = [...t.reviewer_ids].sort().join(',');
        return a !== b;
    };

    const save = async (t) => {
        setSavingKey(t.doc_type);
        try {
            const res = await service_api.put(NEXT_API_ENDPOINTS.ORGANIZATIONS.APPROVAL_FLOW(orgId), {
                doc_types: [{doc_type: t.doc_type, reviewer_ids: rows[t.doc_type] || []}],
            });
            apply(res.data);
            enqueueSnackbar(`${t.label}: yadda saxlanıldı.`, {variant: 'success'});
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSavingKey(null);
        }
    };

    return (
        <Box sx={{display: 'grid', gap: 2, gridTemplateColumns: {xs: '1fr', lg: '1fr 1fr'}}}>
            {data.doc_types.map((t) => {
                const ids = rows[t.doc_type] || [];
                const selected = t.candidates.filter((u) => ids.includes(u.id));
                return (
                    <Box key={t.doc_type} sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: 2.5}}>
                        <Typography sx={{fontWeight: 800, fontSize: 15, color: GOV.textPrimary, mb: 1.5}}>{t.label}</Typography>
                        <Autocomplete
                            multiple size="small" options={t.candidates} disableCloseOnSelect disabled={!canEdit}
                            noOptionsText="Təsdiq icazəsi olan işçi yoxdur"
                            getOptionLabel={(u) => u.full_name} isOptionEqualToValue={(a, b) => a.id === b.id}
                            value={selected}
                            onChange={(_, v) => setRows((p) => ({...p, [t.doc_type]: v.map((u) => u.id)}))}
                            renderInput={(params) => <TextField {...params} label="Qurum yoxlaması" placeholder={selected.length ? '' : 'Şəxs seçin'}/>}
                            renderOption={(props, u) => (
                                <li {...props} key={u.id}>
                                    <Box>
                                        <Typography sx={{fontSize: 13}}>{u.full_name}</Typography>
                                        <Typography sx={{fontSize: 11.5, color: GOV.textMuted}}>{[u.position, u.department].filter(Boolean).join(' · ')}</Typography>
                                    </Box>
                                </li>
                            )}
                        />
                        {canEdit && (
                            <Box sx={{mt: 1.5, display: 'flex', justifyContent: 'flex-end'}}>
                                <Button size="small" variant="contained" disabled={!isDirty(t) || savingKey === t.doc_type} onClick={() => save(t)}
                                        sx={{textTransform: 'none', fontWeight: 700, backgroundColor: GOV.navy, '&:hover': {backgroundColor: GOV.navy}}}>
                                    {savingKey === t.doc_type ? 'Saxlanılır...' : 'Yadda saxla'}
                                </Button>
                            </Box>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}

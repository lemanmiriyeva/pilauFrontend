"use client"
import React, {useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";
import {EmptyState} from "./shared";

/**
 * "Modul icazələri" tabı: təşkilata hansı modulların açıq olduğunu göstərir.
 * Nazirlik admini dəyişə bilər; qurum admini yalnız görür (öz işçilərinə bu modullar daxilində icazə verir).
 */
export default function ModulesTab({orgId}) {
    const {enqueueSnackbar} = useSnackbar();
    const [data, setData] = useState(null);
    const [selected, setSelected] = useState(new Set());
    const [saving, setSaving] = useState(false);
    const [dirty, setDirty] = useState(false);

    const apply = (d) => {
        setData(d);
        setSelected(new Set(d.modules.filter((m) => m.enabled).map((m) => m.id)));
        setDirty(false);
    };

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.MODULE_ACCESS(orgId));
                apply(res.data);
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
            }
        })();
    }, [orgId]);

    const groups = useMemo(() => {
        if (!data) return [];
        const top = data.modules.filter((m) => !m.parent);
        return top.map((t) => ({...t, children: data.modules.filter((m) => m.parent === t.id)}));
    }, [data]);

    if (!data) return <Box sx={{py: 6, textAlign: 'center'}}><CircularProgress size={28}/></Box>;

    const canEdit = data.can_edit;

    const toggle = (group, child) => {
        setSelected((prev) => {
            const next = new Set(prev);
            if (child) {
                next.has(child.id) ? next.delete(child.id) : next.add(child.id);
                // alt modul seçilibsə valideyn də açıq olmalıdır
                if (next.has(child.id)) next.add(group.id);
            } else {
                const ids = [group.id, ...group.children.map((c) => c.id)];
                if (next.has(group.id)) ids.forEach((i) => next.delete(i)); else ids.forEach((i) => next.add(i));
            }
            return next;
        });
        setDirty(true);
    };

    const save = async () => {
        setSaving(true);
        try {
            const res = await service_api.put(NEXT_API_ENDPOINTS.ORGANIZATIONS.MODULE_ACCESS(orgId), {module_ids: [...selected]});
            apply(res.data);
            enqueueSnackbar('Modul icazələri yadda saxlanıldı.', {variant: 'success'});
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    };

    const visibleGroups = canEdit ? groups : groups.filter((g) => selected.has(g.id) || g.children.some((c) => selected.has(c.id)));

    return (
        <Box>
            <Typography sx={{fontSize: 13, color: GOV.textMuted, mb: 2, maxWidth: 760}}>
                {canEdit
                    ? 'Bu təşkilatın hansı modullardan istifadə edə biləcəyini seçin. Təşkilatın admini yalnız burada açıq olan modulları görür və işçilərinə yalnız bu modullar üzrə icazə verə bilir.'
                    : 'Təşkilatınıza Nazirlik tərəfindən açılmış modullar. İşçilərinizə icazələri İnzibatçı paneli → İcazələr bölməsindən bu modullar daxilində verə bilərsiniz.'}
            </Typography>

            {visibleGroups.length === 0 && <EmptyState text="Bu təşkilata hələ modul açılmayıb."/>}

            <Box sx={{display: 'grid', gap: 2, gridTemplateColumns: {xs: '1fr', md: '1fr 1fr'}}}>
                {visibleGroups.map((g) => (
                    <Box key={g.id} sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: 2}}>
                        {canEdit ? (
                            <FormControlLabel
                                control={<Checkbox checked={selected.has(g.id)} onChange={() => toggle(g)} size="small"/>}
                                label={<Typography sx={{fontWeight: 800, fontSize: 14, color: GOV.textPrimary}}>{g.title}</Typography>}
                            />
                        ) : (
                            <Typography sx={{fontWeight: 800, fontSize: 14, color: GOV.textPrimary}}>{g.title}</Typography>
                        )}
                        <Box sx={{pl: canEdit ? 3.5 : 0, mt: 0.5, display: 'flex', flexDirection: canEdit ? 'column' : 'row', flexWrap: 'wrap', gap: canEdit ? 0 : 0.75}}>
                            {g.children.map((c) => canEdit ? (
                                <FormControlLabel
                                    key={c.id}
                                    control={<Checkbox checked={selected.has(c.id)} onChange={() => toggle(g, c)} size="small"/>}
                                    label={<Typography sx={{fontSize: 13}}>{c.title}</Typography>}
                                />
                            ) : selected.has(c.id) && (
                                <Chip key={c.id} size="small" label={c.title} sx={{fontSize: 12}}/>
                            ))}
                        </Box>
                    </Box>
                ))}
            </Box>

            {canEdit && (
                <Box sx={{mt: 3, display: 'flex', gap: 1.5}}>
                    <Button variant="contained" onClick={save} disabled={!dirty || saving}
                            sx={{textTransform: 'none', fontWeight: 700, backgroundColor: GOV.navy, '&:hover': {backgroundColor: GOV.navy}}}>
                        {saving ? 'Saxlanılır...' : 'Yadda saxla'}
                    </Button>
                    {dirty && <Button onClick={() => apply(data)} sx={{textTransform: 'none'}}>Ləğv et</Button>}
                </Box>
            )}
        </Box>
    );
}

"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {GOV} from "@/components/theme/govColors";

const STATUS_FIELDS = [
    {key: 'can_view', label: 'BAXIŞ'},
    {key: 'can_edit', label: 'REDAKTƏ'},
    {key: 'can_approve', label: 'TƏSDİQ'},
];

/**
 * initialModules: [{module, can_view, can_edit, can_approve}, ...] - redaktə rejimi üçün ilkin dəyərlər.
 * onChange(modulesPayload): hər dəyişiklikdə seçilmiş (aktiv) modulların siyahısını ötürür.
 */
export default function ModulePermissionsPicker({initialModules = [], onChange}) {
    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState({});
    const [status, setStatus] = useState({can_view: true, can_edit: false, can_approve: false});

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.PERMISSIONS.MODULES);
                const topLevel = (res.data || [])
                    .filter((m) => !m.parent)
                    .sort((a, b) => a.order - b.order);
                setModules(topLevel);

                if (initialModules.length) {
                    const enabledMap = {};
                    initialModules.forEach((p) => {
                        enabledMap[p.module] = true;
                    });
                    setEnabled(enabledMap);
                    const first = initialModules[0];
                    setStatus({
                        can_view: !!first.can_view,
                        can_edit: !!first.can_edit,
                        can_approve: !!first.can_approve,
                    });
                }
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (loading) return;
        const payload = Object.keys(enabled)
            .filter((id) => enabled[id])
            .map((id) => ({module: Number(id), ...status}));
        onChange && onChange(payload);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, status, loading]);

    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 3}}>
                <CircularProgress size={20}/>
            </Box>
        );
    }

    return (
        <Box>
            <Typography sx={{fontSize: 11.5, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.5, mb: 1}}>
                İCAZƏ VERİLƏCƏK MODULLARI SEÇİN
            </Typography>
            <Box sx={{border: `1px solid ${GOV.cardBorder}`, borderRadius: 1.5, overflow: 'hidden', mb: 3}}>
                {modules.map((m, i) => (
                    <Box
                        key={m.id}
                        sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            px: 2, py: 1.25,
                            borderTop: i === 0 ? 'none' : `1px solid ${GOV.cardBorder}`,
                            backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FAFAFC',
                        }}
                    >
                        <Typography sx={{fontSize: 13, color: GOV.textPrimary}}>{m.title}</Typography>
                        <Switch
                            size="small" checked={!!enabled[m.id]}
                            onChange={(e) => setEnabled((prev) => ({...prev, [m.id]: e.target.checked}))}
                        />
                    </Box>
                ))}
                {modules.length === 0 && (
                    <Typography sx={{fontSize: 12.5, color: GOV.textMuted, px: 2, py: 2}}>
                        Modul tapılmadı.
                    </Typography>
                )}
            </Box>

            <Typography sx={{fontSize: 11.5, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.5, mb: 1}}>
                STATUS
            </Typography>
            <Box sx={{border: `1px solid ${GOV.cardBorder}`, borderRadius: 1.5, overflow: 'hidden'}}>
                {STATUS_FIELDS.map((f, i) => (
                    <Box
                        key={f.key}
                        sx={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            px: 2, py: 1.25,
                            borderTop: i === 0 ? 'none' : `1px solid ${GOV.cardBorder}`,
                            backgroundColor: i % 2 === 0 ? '#FFFFFF' : '#FAFAFC',
                        }}
                    >
                        <Typography sx={{fontSize: 13, color: GOV.textPrimary}}>{f.label}</Typography>
                        <Switch
                            size="small" checked={!!status[f.key]}
                            onChange={(e) => setStatus((prev) => ({...prev, [f.key]: e.target.checked}))}
                        />
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
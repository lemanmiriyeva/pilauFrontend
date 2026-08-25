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
    {key: 'can_create', label: 'YARATMA'},
    {key: 'can_edit', label: 'REDAKTƏ'},
    {key: 'can_approve', label: 'TƏSDİQ'},
];

export default function ModulePermissionsPicker({initialModules = [], onChange}) {
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState({});
    const [status, setStatus] = useState({can_view: true, can_create: false, can_edit: false, can_approve: false});

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.PERMISSIONS.MODULES);
                const all = (res.data || []).slice().sort((a, b) => a.order - b.order);

                const byParent = {};
                all.forEach((m) => {
                    const key = m.parent || null;
                    if (!byParent[key]) byParent[key] = [];
                    byParent[key].push(m);
                });
                const buildTree = (parentId) =>
                    (byParent[parentId] || []).map((m) => ({...m, children: buildTree(m.id)}));
                setTree(buildTree(null));

                if (initialModules.length) {
                    const enabledMap = {};
                    // Tutaq ki, ilk elementdən statusu götürürük və ya hər modulun öz statusu gəlir
                    initialModules.forEach((p) => {
                        enabledMap[p.module] = true;
                    });
                    setEnabled(enabledMap);

                    const first = initialModules[0];
                    if (first) {
                        setStatus({
                            can_view: !!first.can_view,
                            can_create: !!first.can_create,
                            can_edit: !!first.can_edit,
                            can_approve: !!first.can_approve,
                        });
                    }
                }
            } finally {
                setLoading(false);
            }
        })();
    }, [initialModules]);
    useEffect(() => {
        if (loading) return;
        const payload = Object.keys(enabled)
            .filter((id) => enabled[id])
            .map((id) => ({module: Number(id), ...status}));
        onChange && onChange(payload);
    }, [enabled, status, loading]);

    const renderRows = (nodes, depth = 0, path = {i: 0}) => {
        const rows = [];
        nodes.forEach((m) => {
            const idx = path.i++;
            rows.push(
                <Box
                    key={m.id}
                    sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        pl: 2 + depth * 3, pr: 2, py: 1.25,
                        borderTop: idx === 0 ? 'none' : `1px solid ${GOV.cardBorder}`,
                        backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFAFC',
                    }}
                >
                    <Typography sx={{fontSize: 13, color: depth ? GOV.textMuted : GOV.textPrimary}}>
                        {depth > 0 ? '— ' : ''}{m.title}
                    </Typography>
                    <Switch
                        size="small" checked={!!enabled[m.id]}
                        onChange={(e) => setEnabled((prev) => ({...prev, [m.id]: e.target.checked}))}
                    />
                </Box>
            );
            if (m.children && m.children.length) {
                rows.push(...renderRows(m.children, depth + 1, path));
            }
        });
        return rows;
    };

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
                {renderRows(tree)}
                {tree.length === 0 && (
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
"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {GOV} from "@/components/theme/govColors";
import {LICENSE_STATUS_LABELS} from "@/components/constants";

/** Axtarışda Azərbaycan hərflərinin fərqini yox sayır: "iqlim" = "İqlim", "senaye" = "Sənaye". */
export function normalizeAz(value) {
    return String(value ?? '')
        .replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i')
        .replace(/Ə/g, 'e').replace(/ə/g, 'e')
        .replace(/Ö/g, 'o').replace(/ö/g, 'o')
        .replace(/Ü/g, 'u').replace(/ü/g, 'u')
        .replace(/Ş/g, 's').replace(/ş/g, 's')
        .replace(/Ç/g, 'c').replace(/ç/g, 'c')
        .replace(/Ğ/g, 'g').replace(/ğ/g, 'g')
        .toLowerCase();
}

export function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    const pad = (n) => String(n).padStart(2, '0');
    return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}

const STATUS_COLORS = {
    aktiv: {bg: '#E7F5EC', fg: '#1E7D32'},
    gozleyir: {bg: '#FFF4DB', fg: '#9A6700'},
    bitmis: {bg: '#FDEBD3', fg: '#B45309'},
    legv: {bg: '#FBE5E8', fg: '#B0374D'},
    dayandirilib: {bg: '#FBE5E8', fg: '#B0374D'},
    qaralama: {bg: '#EEEFF3', fg: '#5A5F70'},
    yoxlamada: {bg: '#E7EEFA', fg: '#1F4E9A'},
};

export function StatusChip({status}) {
    const c = STATUS_COLORS[status] || {bg: GOV.pageBg, fg: GOV.textMuted};
    return (
        <Box sx={{
            display: 'inline-block', px: 1.25, py: 0.35, borderRadius: 4, fontSize: 11.5, fontWeight: 700,
            backgroundColor: c.bg, color: c.fg, whiteSpace: 'nowrap',
        }}>
            {LICENSE_STATUS_LABELS[status] || status}
        </Box>
    );
}

export function EmptyState({text}) {
    return (
        <Box sx={{textAlign: 'center', py: 6}}>
            <Typography sx={{fontSize: 13, color: GOV.textMuted}}>{text}</Typography>
        </Box>
    );
}

/** Sadə cədvəl: columns = [{label, width, render(row)}] */
export function SimpleTable({columns, rows, onRowClick, empty}) {
    const template = columns.map((c) => c.width || '1fr').join(' ');
    return (
        <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
            <Box sx={{overflowX: 'auto'}}>
                <Box sx={{minWidth: 720}}>
                    <Box sx={{
                        display: 'grid', gridTemplateColumns: template, px: 2.5, py: 1.25, columnGap: 2,
                        borderBottom: `1px solid ${GOV.cardBorder}`, backgroundColor: '#FAFAFC',
                    }}>
                        {columns.map((c) => (
                            <Typography key={c.label} sx={{fontSize: 11, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.5}}>
                                {c.label}
                            </Typography>
                        ))}
                    </Box>
                    {rows.length === 0 ? <EmptyState text={empty}/> : rows.map((row) => (
                        <Box
                            key={row.id}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            sx={{
                                display: 'grid', gridTemplateColumns: template, px: 2.5, py: 1.5, columnGap: 2,
                                alignItems: 'center', borderBottom: `1px solid ${GOV.cardBorder}`,
                                cursor: onRowClick ? 'pointer' : 'default',
                                '&:last-of-type': {borderBottom: 'none'},
                                '&:hover': onRowClick ? {backgroundColor: '#FAFAFC'} : {},
                            }}
                        >
                            {columns.map((c) => (
                                <Box key={c.label} sx={{fontSize: 13, color: GOV.textPrimary, minWidth: 0, wordBreak: 'break-word'}}>
                                    {c.render(row)}
                                </Box>
                            ))}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}

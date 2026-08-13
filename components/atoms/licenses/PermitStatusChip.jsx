"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

export const STATUS_META = {
    aktiv: {label: 'Aktiv', color: '#1E7A46', bg: '#E6F4EC'},
    gozleyir: {label: 'Gözlənilir', color: '#9A6A00', bg: '#FCF0D8'},
    bitmis: {label: 'Bitmiş', color: '#B3261E', bg: '#FBE7E5'},
    legv: {label: 'Ləğv edilib', color: '#5A5F70', bg: '#EEEFF3'},
    dayandirilib: {label: 'Dayandırılıb', color: '#B3261E', bg: '#FBE7E5'},
};

export default function PermitStatusChip({status}) {
    const meta = STATUS_META[status] || {label: status, color: '#5A5F70', bg: '#EEEFF3'};
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.6,
            backgroundColor: meta.bg, color: meta.color,
            px: 1, py: 0.4, borderRadius: 4, fontSize: 12, fontWeight: 700,
        }}>
            <Box sx={{width: 6, height: 6, borderRadius: '50%', backgroundColor: meta.color}}/>
            {meta.label}
        </Box>
    );
}
"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {GOV} from "@/components/theme/govColors";

export default function MetricCard({label, value, tone = GOV.navy, icon}) {
    return (
        <Box sx={{
            flex: '1 1 160px', minWidth: 160,
            backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2,
            px: 2.25, py: 2,
        }}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 0.75}}>
                {icon && (
                    <Box sx={{
                        width: 26, height: 26, borderRadius: 1.25,
                        backgroundColor: `${tone}14`, color: tone,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        {icon}
                    </Box>
                )}
                <Typography sx={{fontSize: 11.5, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.3}}>
                    {label}
                </Typography>
            </Box>
            <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>
                {value}
            </Typography>
        </Box>
    );
}
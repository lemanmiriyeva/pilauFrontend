"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {GOV} from "@/components/theme/govColors";
import {getModuleIcon} from "@/components/theme/moduleIcons";

export default function ModuleCard({module, variant = 'home', onClick}) {
    const Icon = getModuleIcon(module.icon);
    const subtitle = variant === 'home' ? module.description : module.meta;

    return (
        <Box
            onClick={onClick}
            sx={{
                backgroundColor: '#FFFFFF', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2,
                p: 2.5, cursor: 'pointer', transition: 'box-shadow .15s, transform .15s',
                display: 'flex', flexDirection: 'column', height: '100%',
                '&:hover': {boxShadow: '0 8px 24px rgba(20, 27, 51, 0.10)', transform: 'translateY(-1px)'},
            }}
        >
            <Box sx={{
                width: 34, height: 34, borderRadius: 1, backgroundColor: GOV.navySoft,
                display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5,
            }}>
                <Icon sx={{fontSize: 18, color: GOV.textOnNavy}}/>
            </Box>

            <Typography sx={{fontSize: 14.5, fontWeight: 700, color: GOV.textPrimary, mb: 0.5}}>
                {module.title}
            </Typography>

            {subtitle ? (
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, lineHeight: 1.5, flexGrow: 1}}>
                    {subtitle}
                </Typography>
            ) : (
                <Box sx={{flexGrow: 1}}/>
            )}

            <Box sx={{display: 'flex', justifyContent: 'flex-end', mt: 1.5}}>
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 0.5, fontSize: 12.5,
                    fontWeight: 600, color: GOV.textPrimary,
                }}>
                    {variant === 'home' && <span>AÇ</span>}
                    <ArrowForwardIcon sx={{fontSize: 15}}/>
                </Box>
            </Box>
        </Box>
    );
}
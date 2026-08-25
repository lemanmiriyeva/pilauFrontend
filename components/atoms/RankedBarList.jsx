"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';
import {GOV} from "@/components/theme/govColors";

// Sıralanmış üfüqi çubuq siyahısı - "hansı təşkilat/hansı növ neçə sənəd yaradıb" bölgüsü üçün.
// Sətrin üzərinə gələndə (hover) tam faiz + say tooltip-də görünür. items: [{label, count, onClick?}]
export default function RankedBarList({items, barColor = GOV.navy, emptyText = "Məlumat yoxdur.", maxItems = 12}) {
    if (!items || items.length === 0) {
        return (
            <Typography sx={{fontSize: 13, color: GOV.textMuted, textAlign: 'center', py: 3}}>
                {emptyText}
            </Typography>
        );
    }

    const visible = items.slice(0, maxItems);
    const total = items.reduce((s, i) => s + i.count, 0) || 1;
    const maxCount = Math.max(1, ...items.map((i) => i.count));

    return (
        <Box>
            {visible.map((item, idx) => {
                const pct = Math.round((item.count / total) * 1000) / 10;
                const widthPct = Math.max(2, (item.count / maxCount) * 100);
                const row = (
                    <Box
                        key={idx}
                        onClick={item.onClick}
                        sx={{
                            display: 'flex', alignItems: 'center', gap: 1.5,
                            py: 1, cursor: item.onClick ? 'pointer' : 'default',
                            '&:hover .barfill': {backgroundColor: GOV.gold},
                        }}
                    >
                        <Typography sx={{
                            fontSize: 12.5, fontWeight: 600, color: GOV.textPrimary,
                            width: 190, flexShrink: 0,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {item.label}
                        </Typography>
                        <Box sx={{flex: 1, height: 10, borderRadius: 5, backgroundColor: GOV.pageBg, overflow: 'hidden'}}>
                            <Box
                                className="barfill"
                                sx={{
                                    width: `${widthPct}%`, height: '100%', borderRadius: 5,
                                    backgroundColor: barColor, transition: 'width .2s, background-color .15s',
                                }}
                            />
                        </Box>
                        <Typography sx={{fontSize: 12.5, fontWeight: 700, color: GOV.textPrimary, width: 34, textAlign: 'right', flexShrink: 0}}>
                            {item.count}
                        </Typography>
                    </Box>
                );
                return (
                    <Tooltip key={idx} title={`${item.label} · ${item.count} sənəd (ümumi sayın ${pct}%-i)`} placement="top" arrow>
                        {row}
                    </Tooltip>
                );
            })}
            {items.length > maxItems && (
                <Typography sx={{fontSize: 11.5, color: GOV.textMuted, mt: 1}}>
                    + daha {items.length - maxItems} təşkilat
                </Typography>
            )}
        </Box>
    );
}
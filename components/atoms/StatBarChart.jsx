"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {GOV} from "@/components/theme/govColors";

const VIEW_W = 960;
const VIEW_H = 220;
const PAD_L = 8;
const PAD_R = 8;
const PAD_TOP = 18;
const PAD_BOTTOM = 34;

// Asılılıqsız (kitabxanasız) SVG sütun diaqramı. data: [{label, value}]. Sütun üzərinə
// gələndə (hover) həm masaüstü, həm mobil (touch) üçün dəyəri göstərən tooltip açılır.
export default function StatBarChart({data, barColor = GOV.navy, emptyText = "Bu aralıqda məlumat yoxdur."}) {
    const [hoverIndex, setHoverIndex] = useState(null);

    if (!data || data.length === 0) {
        return (
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                height: 160, color: GOV.textMuted, fontSize: 13,
            }}>
                {emptyText}
            </Box>
        );
    }

    const maxValue = Math.max(1, ...data.map((d) => d.value));
    const plotW = VIEW_W - PAD_L - PAD_R;
    const plotH = VIEW_H - PAD_TOP - PAD_BOTTOM;
    const n = data.length;
    const gap = n > 40 ? 1 : n > 20 ? 2 : 6;
    const barW = Math.max(1, (plotW - gap * (n - 1)) / n);
    const showLabels = n <= 24;

    const hovered = hoverIndex != null ? data[hoverIndex] : null;
    const hoverLeftPct = hoverIndex != null
        ? ((PAD_L + hoverIndex * (barW + gap) + barW / 2) / VIEW_W) * 100
        : 0;

    return (
        <Box sx={{position: 'relative'}}>
            {hovered && (
                <Box sx={{
                    position: 'absolute', top: 0, left: `${hoverLeftPct}%`, transform: 'translate(-50%, -100%)',
                    backgroundColor: GOV.navy, color: '#fff', borderRadius: 1.25,
                    px: 1.25, py: 0.75, fontSize: 12, whiteSpace: 'nowrap', pointerEvents: 'none',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.18)', zIndex: 2,
                }}>
                    <Typography sx={{fontSize: 11, color: GOV.textOnNavyMuted, mb: 0.25}}>
                        {hovered.label}
                    </Typography>
                    <Typography sx={{fontSize: 13.5, fontWeight: 700, color: '#fff'}}>
                        {hovered.value} sənəd
                    </Typography>
                </Box>
            )}
            <svg
                viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
                style={{width: '100%', height: 220, display: 'block', overflow: 'visible'}}
                preserveAspectRatio="none"
            >
                <line x1={PAD_L} y1={VIEW_H - PAD_BOTTOM} x2={VIEW_W - PAD_R} y2={VIEW_H - PAD_BOTTOM} stroke={GOV.cardBorder} strokeWidth={1}/>
                {data.map((d, i) => {
                    const h = maxValue > 0 ? (d.value / maxValue) * plotH : 0;
                    const x = PAD_L + i * (barW + gap);
                    const y = VIEW_H - PAD_BOTTOM - h;
                    const isHover = hoverIndex === i;
                    return (
                        <g key={i}>
                            <rect
                                x={x} y={y} width={barW} height={Math.max(h, d.value > 0 ? 2 : 0)}
                                rx={Math.min(3, barW / 3)}
                                fill={isHover ? GOV.gold : barColor}
                                opacity={isHover ? 1 : 0.85}
                                style={{transition: 'fill .1s, opacity .1s'}}
                            />
                            <rect
                                x={x} y={PAD_TOP} width={barW} height={plotH}
                                fill="transparent"
                                onMouseEnter={() => setHoverIndex(i)}
                                onMouseLeave={() => setHoverIndex(null)}
                                onTouchStart={() => setHoverIndex(i)}
                                style={{cursor: 'pointer'}}
                            />
                            {showLabels && (
                                <text
                                    x={x + barW / 2} y={VIEW_H - PAD_BOTTOM + 16}
                                    textAnchor="middle" fontSize={11} fill={GOV.textMuted}
                                >
                                    {d.label}
                                </text>
                            )}
                        </g>
                    );
                })}
            </svg>
        </Box>
    );
}
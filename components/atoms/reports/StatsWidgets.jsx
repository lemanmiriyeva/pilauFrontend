"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
    ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
    BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts';
import {GOV} from "@/components/theme/govColors";
import {STATUS_META} from "@/components/atoms/licenses/PermitStatusChip";

const DOC_TYPE_COLORS = [GOV.navy, GOV.gold, '#2488FF', '#1E7A46', '#9A6A00', '#B3261E'];

export function StatCard({label, value}) {
    return (
        <Box sx={{
            backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2,
            p: 2.5, flex: 1, minWidth: 140,
        }}>
            <Typography sx={{
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: 0.4,
                color: GOV.textMuted,
                textTransform: 'uppercase',
                mb: 0.75
            }}>
                {label}
            </Typography>
            <Typography sx={{fontSize: 26, fontWeight: 800, color: GOV.textPrimary}}>
                {value}
            </Typography>
        </Box>
    );
}

export function SectionCard({title, children, sx}) {
    return (
        <Box sx={{
            backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2,
            p: 2.5, ...sx,
        }}>
            {title && (
                <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary, mb: 2}}>
                    {title}
                </Typography>
            )}
            {children}
        </Box>
    );
}

function formatPeriodLabel(period, granularity) {
    if (!period) return '';
    if (granularity === 'day') return period.slice(5); // MM-DD
    if (granularity === 'year') return period.slice(0, 4);
    return period.slice(0, 7); // YYYY-MM
}

export function TimeSeriesChart({series, granularity}) {
    const data = (series || []).map((row) => ({
        ...row, label: formatPeriodLabel(row.period, granularity),
    }));

    if (data.length === 0) {
        return (
            <Typography sx={{fontSize: 13, color: GOV.textMuted, textAlign: 'center', py: 4}}>
                Bu aralıqda məlumat yoxdur.
            </Typography>
        );
    }

    return (
        <Box sx={{height: 260}}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{top: 8, right: 12, left: -20, bottom: 0}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GOV.cardBorder}/>
                    <XAxis dataKey="label" tick={{fontSize: 11, fill: GOV.textMuted}}/>
                    <YAxis allowDecimals={false} tick={{fontSize: 11, fill: GOV.textMuted}}/>
                    <Tooltip
                        contentStyle={{fontSize: 12.5, borderRadius: 8, border: `1px solid ${GOV.cardBorder}`}}
                        labelStyle={{fontWeight: 700}}
                    />
                    <Line type="monotone" dataKey="count" name="Sənəd sayı" stroke={GOV.navy} strokeWidth={2}
                          dot={{r: 3}}/>
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
}

export function StatusBreakdownBars({statusBreakdown}) {
    const entries = Object.entries(statusBreakdown || {});
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    if (entries.length === 0) {
        return (
            <Typography sx={{fontSize: 13, color: GOV.textMuted, textAlign: 'center', py: 3}}>
                Məlumat yoxdur.
            </Typography>
        );
    }

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.5}}>
            {entries.map(([status, count]) => {
                const meta = STATUS_META[status] || {label: status, color: GOV.textMuted, bg: GOV.pageBg};
                const pct = total ? Math.round((count / total) * 100) : 0;
                return (
                    <Box key={status}>
                        <Box sx={{display: 'flex', justifyContent: 'space-between', mb: 0.5}}>
                            <Typography sx={{fontSize: 12.5, fontWeight: 600, color: GOV.textPrimary}}>
                                {meta.label}
                            </Typography>
                            <Typography sx={{fontSize: 12.5, color: GOV.textMuted}}>
                                {count} · {pct}%
                            </Typography>
                        </Box>
                        <Box sx={{height: 6, borderRadius: 3, backgroundColor: GOV.pageBg, overflow: 'hidden'}}>
                            <Box sx={{height: '100%', width: `${pct}%`, backgroundColor: meta.color, borderRadius: 3}}/>
                        </Box>
                    </Box>
                );
            })}
        </Box>
    );
}

export function DocTypePieChart({byDocType}) {
    const data = byDocType || [];
    if (data.length === 0) {
        return (
            <Typography sx={{fontSize: 13, color: GOV.textMuted, textAlign: 'center', py: 3}}>
                Məlumat yoxdur.
            </Typography>
        );
    }

    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap'}}>
            <Box sx={{width: 180, height: 180, flexShrink: 0}}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data} dataKey="count" nameKey="label"
                            innerRadius={45} outerRadius={80} paddingAngle={2}
                        >
                            {data.map((entry, i) => (
                                <Cell key={entry.doc_type} fill={DOC_TYPE_COLORS[i % DOC_TYPE_COLORS.length]}/>
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{fontSize: 12.5, borderRadius: 8, border: `1px solid ${GOV.cardBorder}`}}/>
                    </PieChart>
                </ResponsiveContainer>
            </Box>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1, minWidth: 160}}>
                {data.map((row, i) => (
                    <Box key={row.doc_type} sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <Box sx={{
                            width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
                            backgroundColor: DOC_TYPE_COLORS[i % DOC_TYPE_COLORS.length],
                        }}/>
                        <Typography sx={{fontSize: 12.5, color: GOV.textPrimary, flexGrow: 1}}>
                            {row.label}
                        </Typography>
                        <Typography sx={{fontSize: 12.5, fontWeight: 700, color: GOV.textMuted}}>
                            {row.count}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

export function ByOrganizationBarChart({byOrganization}) {
    const data = (byOrganization || []).slice(0, 8);
    if (data.length === 0) {
        return (
            <Typography sx={{fontSize: 13, color: GOV.textMuted, textAlign: 'center', py: 3}}>
                Məlumat yoxdur.
            </Typography>
        );
    }

    return (
        <Box sx={{height: Math.max(220, data.length * 38)}}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{top: 4, right: 20, left: 8, bottom: 4}}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GOV.cardBorder} horizontal={false}/>
                    <XAxis type="number" allowDecimals={false} tick={{fontSize: 11, fill: GOV.textMuted}}/>
                    <YAxis
                        type="category" dataKey="organization_name" width={140}
                        tick={{fontSize: 11.5, fill: GOV.textPrimary}}
                    />
                    <Tooltip contentStyle={{fontSize: 12.5, borderRadius: 8, border: `1px solid ${GOV.cardBorder}`}}/>
                    <Bar dataKey="count" name="Sənəd sayı" fill={GOV.navy} radius={[0, 4, 4, 0]}/>
                </BarChart>
            </ResponsiveContainer>
        </Box>
    );
}
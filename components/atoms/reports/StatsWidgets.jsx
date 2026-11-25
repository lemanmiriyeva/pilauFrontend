"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import {GOV} from "@/components/theme/govColors";
import {STATUS_META} from "@/components/atoms/licenses/PermitStatusChip";

/*
 * Statistika vidcetləri. Vahid rəng sistemi: sidebar-ın bənövşəyi/göy tonlarına uyğun,
 * bir-birindən aydın seçilən kateqoriya rəngləri; statuslar üçün ayrıca mənalı rənglər.
 */
export const PALETTE = ['#6D5BD0', '#2E90FA', '#12B5A6', '#F79009', '#EE5A8A', '#7A8BFF', '#8FBF3F', '#98A2B3'];
const STATUS_COLORS = {
    aktiv: '#12B76A', gozleyir: '#F79009', yoxlamada: '#2E90FA', qaralama: '#98A2B3',
    bitmis: '#F04438', dayandirilib: '#B42318', legv: '#667085',
};
const TOOLTIP_STYLE = {
    fontSize: 12.5, borderRadius: 10, border: `1px solid ${GOV.cardBorder}`,
    boxShadow: '0 8px 24px rgba(16,24,40,0.12)',
};
const AXIS_TICK = {fontSize: 11.5, fill: GOV.textMuted};

function Empty({py = 4}) {
    return (
        <Typography sx={{fontSize: 13, color: GOV.textMuted, textAlign: 'center', py}}>
            Məlumat yoxdur.
        </Typography>
    );
}

export function StatCard({label, value, hint, accent = PALETTE[0]}) {
    return (
        <Box sx={{
            position: 'relative', overflow: 'hidden', backgroundColor: '#fff',
            border: `1px solid ${GOV.cardBorder}`, borderRadius: '16px',
            p: 2.5, flex: '1 1 200px', minWidth: 180,
        }}>
            <Box sx={{position: 'absolute', left: 0, top: 18, bottom: 18, width: 4, borderRadius: '0 4px 4px 0', backgroundColor: accent}}/>
            <Typography sx={{
                fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.textMuted,
                textTransform: 'uppercase', mb: 0.75,
            }}>
                {label}
            </Typography>
            <Typography sx={{fontSize: 30, fontWeight: 800, color: GOV.textPrimary, lineHeight: 1.1}}>
                {value}
            </Typography>
            {hint && (
                <Typography sx={{fontSize: 12, color: GOV.textMuted, mt: 0.75}}>{hint}</Typography>
            )}
        </Box>
    );
}

export function SectionCard({title, subtitle, children, sx}) {
    return (
        <Box sx={{
            backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: '16px',
            p: 2.5, display: 'flex', flexDirection: 'column', minWidth: 0, ...sx,
        }}>
            {title && (
                <Box sx={{mb: 2}}>
                    <Typography sx={{fontSize: 14.5, fontWeight: 700, color: GOV.textPrimary}}>{title}</Typography>
                    {subtitle && (
                        <Typography sx={{fontSize: 12, color: GOV.textMuted, mt: 0.25}}>{subtitle}</Typography>
                    )}
                </Box>
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
    if (data.length === 0) return <Empty/>;

    return (
        <Box sx={{height: 280}}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{top: 8, right: 8, left: -18, bottom: 0}}>
                    <defs>
                        <linearGradient id="seriesFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={PALETTE[0]} stopOpacity={0.35}/>
                            <stop offset="100%" stopColor={PALETTE[0]} stopOpacity={0.02}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 4" stroke="#EDEFF5" vertical={false}/>
                    <XAxis dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} tickMargin={8}/>
                    <YAxis allowDecimals={false} tick={AXIS_TICK} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{fontWeight: 700}} cursor={{stroke: '#D0D5E2'}}/>
                    <Area
                        type="monotone" dataKey="count" name="Sənəd sayı" stroke={PALETTE[0]} strokeWidth={2.5}
                        fill="url(#seriesFill)" dot={{r: 3, strokeWidth: 2, fill: '#fff'}} activeDot={{r: 5}}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </Box>
    );
}

/** Status bölgüsü: ortasında cəmi olan halqa + sağda/altda aydın legend. */
export function StatusBreakdownBars({statusBreakdown}) {
    const entries = Object.entries(statusBreakdown || {}).filter(([, count]) => count > 0);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);
    if (entries.length === 0) return <Empty py={3}/>;

    const rows = entries.map(([status, count]) => ({
        status, count,
        label: (STATUS_META[status] || {label: status}).label,
        color: STATUS_COLORS[status] || '#98A2B3',
        pct: total ? Math.round((count / total) * 100) : 0,
    }));

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
            <Box sx={{position: 'relative', width: 190, height: 190}}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={rows} dataKey="count" nameKey="label" innerRadius={62} outerRadius={88}
                             paddingAngle={rows.length > 1 ? 3 : 0} cornerRadius={6} stroke="none">
                            {rows.map((r) => <Cell key={r.status} fill={r.color}/>)}
                        </Pie>
                        <Tooltip contentStyle={TOOLTIP_STYLE}/>
                    </PieChart>
                </ResponsiveContainer>
                <Box sx={{
                    position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', pointerEvents: 'none',
                }}>
                    <Typography sx={{fontSize: 26, fontWeight: 800, color: GOV.textPrimary, lineHeight: 1}}>{total}</Typography>
                    <Typography sx={{fontSize: 11.5, color: GOV.textMuted}}>cəmi</Typography>
                </Box>
            </Box>
            <Box sx={{display: 'flex', flexDirection: 'column', gap: 1, width: '100%'}}>
                {rows.map((r) => (
                    <Box key={r.status} sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                        <Box sx={{width: 10, height: 10, borderRadius: '3px', backgroundColor: r.color, flexShrink: 0}}/>
                        <Typography sx={{fontSize: 12.5, color: GOV.textPrimary, flexGrow: 1}}>{r.label}</Typography>
                        <Typography sx={{fontSize: 12.5, fontWeight: 700, color: GOV.textPrimary}}>{r.count}</Typography>
                        <Typography sx={{fontSize: 12, color: GOV.textMuted, width: 38, textAlign: 'right'}}>{r.pct}%</Typography>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}

/** Ortaq sıralanmış üfüqi zolaqlar: ad solda, say sağda, zolaq altda. */
function RankedBars({rows}) {
    const max = Math.max(...rows.map((r) => r.count), 1);
    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 1.75}}>
            {rows.map((r) => (
                <Box key={r.key}>
                    <Box sx={{display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.6}}>
                        <Typography noWrap title={r.label} sx={{fontSize: 12.5, fontWeight: 600, color: GOV.textPrimary, flexGrow: 1, minWidth: 0}}>
                            {r.label}
                        </Typography>
                        <Typography sx={{fontSize: 12.5, fontWeight: 800, color: GOV.textPrimary}}>{r.count}</Typography>
                    </Box>
                    <Box sx={{height: 8, borderRadius: 4, backgroundColor: '#F0F2F8', overflow: 'hidden'}}>
                        <Box sx={{height: '100%', width: `${Math.max(3, (r.count / max) * 100)}%`, borderRadius: 4, backgroundColor: r.color}}/>
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

/** Kateqoriya bölgüsü - hər kateqoriya öz rəngində. */
export function DocTypePieChart({byDocType}) {
    const data = byDocType || [];
    if (data.length === 0) return <Empty py={3}/>;
    return (
        <RankedBars rows={data.map((row, i) => ({
            key: row.doc_type, label: row.label, count: row.count, color: PALETTE[i % PALETTE.length],
        }))}/>
    );
}

/** Təşkilat bölgüsü (ilk 8) - bir ton, azalan sıra. */
export function ByOrganizationBarChart({byOrganization}) {
    const data = (byOrganization || []).slice(0, 8);
    if (data.length === 0) return <Empty py={3}/>;
    return (
        <RankedBars rows={data.map((row, i) => ({
            key: `${row.organization_name}-${i}`, label: row.organization_name, count: row.count,
            color: PALETTE[0], 
        }))}/>
    );
}

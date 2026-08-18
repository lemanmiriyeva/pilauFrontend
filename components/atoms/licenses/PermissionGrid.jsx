"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {GOV} from "@/components/theme/govColors";

/**
 * Hər sətir bir istifadəçi, hər sütun bir lisenziya kateqoriyasıdır. Xanaya klikləyəndə dərhal
 * (auto-save) həmin (user, doc_type) icazəsi backend-ə göndərilir - ayrıca "Yadda saxla"
 * düyməsi yoxdur, çünki hər dəyişiklik özü bir sorğudur (Stage1/Stage2PermissionsView.post).
 */
export default function PermissionGrid({loading, docTypes, users, pendingKey, onToggle, emptyText}) {
    if (loading) {
        return (
            <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                <CircularProgress size={26}/>
            </Box>
        );
    }

    if (!users || users.length === 0) {
        return (
            <Box sx={{textAlign: 'center', py: 6}}>
                <InfoOutlinedIcon sx={{fontSize: 28, color: GOV.textMuted, mb: 1}}/>
                <Typography sx={{fontSize: 14, color: GOV.textMuted}}>
                    {emptyText || 'İstifadəçi tapılmadı.'}
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{overflowX: 'auto'}}>
            <Box component="table" sx={{width: '100%', borderCollapse: 'collapse', minWidth: 640}}>
                <Box component="thead">
                    <Box component="tr" sx={{borderBottom: `1px solid ${GOV.cardBorder}`}}>
                        <Box component="th" sx={{
                            textAlign: 'left', fontSize: 11, fontWeight: 700, color: GOV.textMuted,
                            textTransform: 'uppercase', letterSpacing: 0.4, px: 2.5, py: 1.5,
                            position: 'sticky', left: 0, backgroundColor: '#fff',
                        }}>
                            İstifadəçi
                        </Box>
                        {docTypes.map((dt) => (
                            <Box component="th" key={dt.key} sx={{
                                textAlign: 'center', fontSize: 11, fontWeight: 700, color: GOV.textMuted,
                                textTransform: 'uppercase', letterSpacing: 0.4, px: 1.5, py: 1.5, minWidth: 110,
                            }}>
                                {dt.label}
                            </Box>
                        ))}
                    </Box>
                </Box>
                <Box component="tbody">
                    {users.map((u) => (
                        <Box component="tr" key={u.id} sx={{
                            borderBottom: `1px solid ${GOV.cardBorder}`,
                            '&:last-of-type': {borderBottom: 'none'},
                        }}>
                            <Box component="td" sx={{
                                px: 2.5, py: 1.5, position: 'sticky', left: 0, backgroundColor: '#fff',
                            }}>
                                <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>
                                    {u.full_name}
                                </Typography>
                                <Typography sx={{fontSize: 11.5, color: GOV.textMuted}}>
                                    {[u.department, u.position].filter(Boolean).join(' · ') || u.username}
                                </Typography>
                            </Box>
                            {docTypes.map((dt) => {
                                const key = `${u.id}:${dt.key}`;
                                return (
                                    <Box component="td" key={dt.key} sx={{textAlign: 'center', px: 1.5, py: 1}}>
                                        <Switch
                                            size="small"
                                            checked={!!u.permissions?.[dt.key]}
                                            disabled={pendingKey === key}
                                            onChange={(e) => onToggle(u.id, dt.key, e.target.checked)}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {color: GOV.navy},
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: GOV.navySoft,
                                                },
                                            }}
                                        />
                                    </Box>
                                );
                            })}
                        </Box>
                    ))}
                </Box>
            </Box>
        </Box>
    );
}
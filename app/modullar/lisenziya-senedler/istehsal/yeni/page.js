"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import ArticleIcon from '@mui/icons-material/Article';
import {useRouter} from "next/navigation";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";

/*
 * "İstehsal lisenziyası" bundan sonra "Lisenziya" adı altında, idxal/ixrac
 * seçim səhifəsi kimi 2 yerə bölünüb: Xüsusi Lisenziya / Ümumi Lisenziya.
 * Hər ikisinin sahələri hələlik köhnə "istehsal" sxeminin eyni surətidir
 * (bax backend licenses/field_schema.py) - sonra ayrı-ayrı redaktə olunacaq.
 */
const OPTIONS = [
    {
        type: 'xususi', title: 'Xüsusi Lisenziya',
        icon: WorkspacePremiumIcon,
        info: 'Xüsusi fəaliyyət növləri üçün tələb olunan lisenziya.',
        infoDetails: [
            'Hərbi texnika, döyüş təyinatlı məhsul və ya silah sənayesi ilə bağlı xüsusi fəaliyyət növləri üçün tələb olunur.',
            'Müəssisə haqqında təsis, VÖEN və fəaliyyət sənədləri təqdim olunmalıdır.',
        ],
    },
    {
        type: 'umumi', title: 'Ümumi Lisenziya',
        icon: ArticleIcon,
        info: 'Ümumi istehsal fəaliyyəti üçün tələb olunan lisenziya.',
        infoDetails: [
            'Müəssisənin ümumi istehsal fəaliyyəti üçün tələb olunur.',
            'Müəssisə haqqında təsis, VÖEN və fəaliyyət sənədləri təqdim olunmalıdır.',
        ],
    },
];

export default function Page() {
    const router = useRouter();
    const [hovered, setHovered] = useState('xususi');
    const [infoType, setInfoType] = useState(null);
    const activeInfo = OPTIONS.find((o) => o.type === infoType);

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Ana səhifə
                    </Link>
                    {' / '}
                    <Link component="button" onClick={() => router.push(APP_ROUTES.ISTEHSAL)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Lisenziya
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Yeni lisenziya</span>
                </Typography>

                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mb: 3}}>
                    Lisenziya yarat
                </Typography>

                <Box sx={{display: 'grid', gap: 2, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}}}>
                    {OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const active = hovered === opt.type;
                        return (
                            <Box
                                key={opt.type}
                                onClick={() => router.push(`${APP_ROUTES.ISTEHSAL_YENI}/${opt.type}`)}
                                onMouseEnter={() => setHovered(opt.type)}
                                sx={{
                                    position: 'relative', cursor: 'pointer', borderRadius: 2,
                                    backgroundColor: '#fff', p: 4, minHeight: 140,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    gap: 1.5, textAlign: 'center',
                                    border: `1.5px solid ${active ? GOV.navySoft : GOV.cardBorder}`,
                                    boxShadow: active ? '0 8px 24px rgba(20, 27, 51, 0.10)' : 'none',
                                    transition: 'all .15s',
                                    '&:hover': {borderColor: GOV.navySoft, boxShadow: '0 8px 24px rgba(20, 27, 51, 0.10)'},
                                }}
                            >
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setInfoType(opt.type);
                                    }}
                                    sx={{position: 'absolute', top: 8, right: 8}}
                                >
                                    <InfoOutlinedIcon sx={{fontSize: 17, color: GOV.textMuted}}/>
                                </IconButton>
                                <Box sx={{
                                    width: 44, height: 44, borderRadius: '50%', backgroundColor: GOV.navySoft,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Icon sx={{fontSize: 22, color: GOV.textOnNavy}}/>
                                </Box>
                                <Typography sx={{fontSize: 16, fontWeight: 800, color: GOV.textPrimary}}>
                                    {opt.title}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            </Box>

            <Dialog open={!!activeInfo} onClose={() => setInfoType(null)} maxWidth="xs" fullWidth>
                {activeInfo && (
                    <>
                        <DialogTitle sx={{fontSize: 16, fontWeight: 800, color: GOV.textPrimary}}>
                            {activeInfo.title} haqqında
                        </DialogTitle>
                        <DialogContent>
                            <Typography sx={{fontSize: 13, color: GOV.textPrimary, mb: 1.5}}>
                                {activeInfo.info}
                            </Typography>
                            <Box component="ul" sx={{m: 0, pl: 2.5, display: 'grid', gap: 0.75}}>
                                {activeInfo.infoDetails.map((line, i) => (
                                    <Typography key={i} component="li" sx={{fontSize: 12.5, color: GOV.textMuted}}>
                                        {line}
                                    </Typography>
                                ))}
                            </Box>
                        </DialogContent>
                        <DialogActions sx={{px: 3, pb: 2.5}}>
                            <Button
                                onClick={() => setInfoType(null)}
                                sx={{textTransform: 'none', fontWeight: 600, fontSize: 13, color: GOV.textMuted}}
                            >
                                Bağla
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() => router.push(`${APP_ROUTES.ISTEHSAL_YENI}/${activeInfo.type}`)}
                                sx={{
                                    backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13,
                                    '&:hover': {backgroundColor: GOV.navyMid},
                                }}
                            >
                                {activeInfo.title} yarat
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </AppShell>
    );
}
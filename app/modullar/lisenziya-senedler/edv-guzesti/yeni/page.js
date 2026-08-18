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
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import {useRouter} from "next/navigation";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";

const OPTIONS = [
    {
        type: 'gomrukden_azadolma', title: 'Gömrükdən Azadolma',
        icon: LocalShippingIcon,
        info: 'Gömrük rüsumlarından azadolma üçün icazə sənədi.',
        infoDetails: [
            'Gömrük rüsumlarından azadolma tələb edən mallar üçün istifadə olunur.',
            'Müraciətçi müəssisə haqqında məlumatlar və müqavilənin surəti təqdim olunmalıdır.',
            'Məxfi lisenziyalar üçün sənəd yükləmə mərhələsi könüllüdür, adi (açıq) lisenziyalarda isə məcburidir.',
        ],
    },
    {
        type: 'edvden_azadolma', title: 'ƏDV-dən Azadolma',
        icon: ReceiptLongIcon,
        info: 'Əlavə Dəyər Vergisindən (ƏDV) azadolma üçün icazə sənədi.',
        infoDetails: [
            'ƏDV-dən azadolma tələb edən mallar üçün istifadə olunur.',
            'Müraciətçi müəssisə haqqında məlumatlar və müqavilənin surəti təqdim olunmalıdır.',
            'Məxfi lisenziyalar üçün sənəd yükləmə mərhələsi könüllüdür, adi (açıq) lisenziyalarda isə məcburidir.',
        ],
    },
];

export default function Page() {
    const router = useRouter();
    const [hovered, setHovered] = useState('gomrukden_azadolma');
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
                    <Link component="button" onClick={() => router.push(APP_ROUTES.EDV_GUZESTI)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        ƏDV güzəşt icazə sənədi
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Yeni icazə sənədi</span>
                </Typography>

                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mb: 3}}>
                    İcazə sənədi yarat
                </Typography>

                <Box sx={{display: 'grid', gap: 2, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}}}>
                    {OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        const active = hovered === opt.type;
                        return (
                            <Box
                                key={opt.type}
                                onClick={() => router.push(`${APP_ROUTES.EDV_GUZESTI_YENI}/${opt.type}`)}
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
                            {activeInfo.title} icazə sənədi haqqında
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
                                onClick={() => router.push(`${APP_ROUTES.EDV_GUZESTI_YENI}/${activeInfo.type}`)}
                                sx={{
                                    backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13,
                                    '&:hover': {backgroundColor: GOV.navyMid},
                                }}
                            >
                                {activeInfo.title} sənədi yarat
                            </Button>
                        </DialogActions>
                    </>
                )}
            </Dialog>
        </AppShell>
    );
}
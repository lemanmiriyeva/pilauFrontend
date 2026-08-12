"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AdminShell from "@/components/atoms/admin/AdminShell";

export default function Page() {
    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.SUMMARY);
                setOrgs(Array.isArray(res.data) ? res.data : []);
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
            } finally {
                setLoading(false);
            }
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AdminShell>
            <Box sx={{maxWidth: 1080, mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Giriş nəzarəti
                    </Link>
                </Typography>

                <Box sx={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3}}>
                    <Box>
                        <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary}}>
                            İcazələrin idarə edilməsi
                        </Typography>
                        <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5}}>
                            Modullara giriş icazələrinin verilməsi.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained" startIcon={<AddIcon/>}
                        onClick={() => router.push(`${APP_ROUTES.INZIBATCI_ICAZELER}/yeni`)}
                        sx={{
                            backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13,
                            '&:hover': {backgroundColor: GOV.navyMid},
                        }}
                    >
                        Yeni icazə
                    </Button>
                </Box>

                <Box sx={{backgroundColor: '#FFFFFF', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                    <Box sx={{
                        display: 'grid', gridTemplateColumns: '1fr 60px', px: 2.5, py: 1.25,
                        borderBottom: `1px solid ${GOV.cardBorder}`, backgroundColor: '#FAFAFC',
                    }}>
                        <Typography sx={{fontSize: 11, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.5}}>
                            TƏŞKİLATIN ADI
                        </Typography>
                        <Typography sx={{fontSize: 11, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.5, textAlign: 'right'}}>
                            ƏTRAFLI
                        </Typography>
                    </Box>

                    {loading ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', py: 5}}>
                            <CircularProgress size={22}/>
                        </Box>
                    ) : orgs.length === 0 ? (
                        <Typography sx={{fontSize: 13, color: GOV.textMuted, textAlign: 'center', py: 5}}>
                            Hələ heç bir təşkilat yoxdur.
                        </Typography>
                    ) : (
                        orgs.map((o) => (
                            <Box
                                key={o.id}
                                onClick={() => router.push(`${APP_ROUTES.INZIBATCI_ICAZELER}/yeni?organization=${o.id}`)}
                                sx={{
                                    display: 'grid', gridTemplateColumns: '1fr 60px', alignItems: 'center',
                                    px: 2.5, py: 1.75, cursor: 'pointer',
                                    borderBottom: `1px solid ${GOV.cardBorder}`,
                                    '&:last-of-type': {borderBottom: 'none'},
                                    '&:hover': {backgroundColor: '#FAFAFC'},
                                }}
                            >
                                <Box>
                                    <Typography sx={{fontSize: 13.5, fontWeight: 600, color: GOV.textPrimary}}>
                                        {o.full_name}
                                    </Typography>
                                    <Typography sx={{fontSize: 12, color: GOV.textMuted, mt: 0.25}}>
                                        {o.user_count} istifadəçi
                                    </Typography>
                                </Box>
                                <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                                    <ArrowForwardIcon sx={{fontSize: 17, color: GOV.textPrimary}}/>
                                </Box>
                            </Box>
                        ))
                    )}
                </Box>
            </Box>
        </AdminShell>
    );
}
"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";

function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('az-AZ');
}

function CertStatusChip({status}) {
    const done = status === 'tamamlandi';
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.6, px: 1.25, py: 0.4,
            borderRadius: 5, fontSize: 12, fontWeight: 700,
            backgroundColor: done ? '#E8F5EC' : '#FFF6E5',
            color: done ? '#1E7A3C' : '#9A6A00',
        }}>
            <Box sx={{width: 6, height: 6, borderRadius: '50%', backgroundColor: done ? '#1E7A3C' : '#C9982B'}}/>
            {done ? 'Tamamlandı' : 'Qaralama'}
        </Box>
    );
}

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            setLoading(true);
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.LICENSES.CERTIFICATE_LIST);
                setRows(Array.isArray(res.data) ? res.data : (res.data?.results || []));
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Ana səhifə
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Sənədlərim</span>
                </Typography>

                <Typography sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5}}>
                    LİSENZİYA VƏ SƏNƏDLƏR
                </Typography>
                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>
                    Sənədlərim
                </Typography>
                <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5, mb: 3}}>
                    Tam təsdiqlənmiş lisenziyalarınız üzrə yaranan rəsmi sənədlər.
                </Typography>

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                    {loading ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                            <CircularProgress size={26}/>
                        </Box>
                    ) : rows.length === 0 ? (
                        <Box sx={{textAlign: 'center', py: 6}}>
                            <InfoOutlinedIcon sx={{fontSize: 28, color: GOV.textMuted, mb: 1}}/>
                            <Typography sx={{fontSize: 14, color: GOV.textMuted}}>
                                Hələ heç bir sənəd yaranmayıb. Lisenziya müraciətiniz hər iki mərhələdən
                                keçəndə sənəd burada avtomatik görünəcək.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{overflowX: 'auto'}}>
                            <Box component="table" sx={{width: '100%', borderCollapse: 'collapse'}}>
                                <Box component="thead">
                                    <Box component="tr" sx={{borderBottom: `1px solid ${GOV.cardBorder}`}}>
                                        {['Sənəd', 'Kateqoriya', 'Verilmə tarixi', 'Status', ''].map((h) => (
                                            <Box component="th" key={h} sx={{
                                                textAlign: 'left', fontSize: 11, fontWeight: 700, color: GOV.textMuted,
                                                textTransform: 'uppercase', letterSpacing: 0.4, px: 2.5, py: 1.5,
                                            }}>
                                                {h}
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                                <Box component="tbody">
                                    {rows.map((row) => (
                                        <Box component="tr" key={row.id} sx={{
                                            borderBottom: `1px solid ${GOV.cardBorder}`,
                                            '&:last-of-type': {borderBottom: 'none'},
                                            '&:hover': {backgroundColor: GOV.pageBg},
                                        }}>
                                            <Box component="td" sx={{px: 2.5, py: 1.75}}>
                                                <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>
                                                    {row.number}
                                                </Typography>
                                                <Typography sx={{fontSize: 11.5, color: GOV.textMuted}}>
                                                    Müraciət: {row.permit_number}
                                                </Typography>
                                            </Box>
                                            <Box component="td" sx={{px: 2.5, py: 1.75, fontSize: 13, color: GOV.textPrimary}}>
                                                {row.category}
                                            </Box>
                                            <Box component="td" sx={{px: 2.5, py: 1.75, fontSize: 13, color: GOV.textPrimary}}>
                                                {formatDate(row.issue_date)}
                                            </Box>
                                            <Box component="td" sx={{px: 2.5, py: 1.75}}>
                                                <CertStatusChip status={row.status}/>
                                            </Box>
                                            <Box component="td" sx={{px: 2.5, py: 1.75, textAlign: 'right'}}>
                                                <Button
                                                    size="small" endIcon={<ArrowForwardIcon sx={{fontSize: 14}}/>}
                                                    onClick={() => router.push(APP_ROUTES.SENED(row.id))}
                                                    sx={{
                                                        textTransform: 'none', fontWeight: 700, fontSize: 12.5,
                                                        color: GOV.textPrimary, border: `1px solid ${GOV.cardBorder}`,
                                                        px: 1.5,
                                                    }}
                                                >
                                                    Bax
                                                </Button>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Box>
                    )}
                    {rows.length > 0 && (
                        <Box sx={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            px: 2.5, py: 1.5, borderTop: `1px solid ${GOV.cardBorder}`,
                        }}>
                            <Typography sx={{fontSize: 12, color: GOV.textMuted}}>
                                {rows.length} nəticədən 1-{rows.length} göstərir
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </AppShell>
    );
}
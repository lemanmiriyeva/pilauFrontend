"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CircularProgress from '@mui/material/CircularProgress';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import PermitStatusChip, {STATUS_META} from "@/components/atoms/licenses/PermitStatusChip";

const DOC_TYPE = 'xususi_satis';

function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '-';
    return d.toLocaleDateString('az-AZ');
}

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');

    useEffect(() => {
        const timeout = setTimeout(() => {
            (async () => {
                setLoading(true);
                try {
                    const params = new URLSearchParams();
                    params.set('doc_type', DOC_TYPE);
                    if (search) params.set('search', search);
                    if (status) params.set('status', status);
                    const res = await service_api.get(
                        `${NEXT_API_ENDPOINTS.LICENSES.PERMIT_LIST}?${params.toString()}`
                    );
                    setRows(Array.isArray(res.data) ? res.data : (res.data?.results || []));
                } catch (e) {
                    enqueueSnackbar(handleError(e), {variant: 'error'});
                } finally {
                    setLoading(false);
                }
            })();
        }, 300);
        return () => clearTimeout(timeout);
    }, [search, status]);

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Ana səhifə
                    </Link>
                    {' / '}
                    <span>Lisenziya və sənədlər</span>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Xüsusi satış icazə sənədi</span>
                </Typography>

                <Typography sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5}}>
                    LİSENZİYA VƏ SƏNƏDLƏR
                </Typography>

                <Box sx={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3}}>
                    <Box>
                        <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>
                            Xüsusi satış icazə sənədi
                        </Typography>
                        <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5}}>
                            Müəssisənizə aid bütün xüsusi satış icazə sənədlərini idarə və izləyin.
                        </Typography>
                    </Box>
                    <Button
                        variant="contained" startIcon={<AddIcon/>}
                        onClick={() => router.push(APP_ROUTES.XUSUSI_SATIS_YENI)}
                        sx={{
                            backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13,
                            px: 2.5, '&:hover': {backgroundColor: GOV.navyMid},
                        }}
                    >
                        + Sənəd yarat
                    </Button>
                </Box>

                <Box sx={{display: 'flex', gap: 1.5, mb: 2.5, flexWrap: 'wrap'}}>
                    <TextField
                        size="small" placeholder="Sənəd axtar..." value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{flexGrow: 1, minWidth: 240, backgroundColor: '#fff'}}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{fontSize: 18, color: GOV.textMuted}}/>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        select size="small" value={status} onChange={(e) => setStatus(e.target.value)}
                        sx={{minWidth: 180, backgroundColor: '#fff'}}
                    >
                        <MenuItem value="">Bütün statuslar</MenuItem>
                        {Object.entries(STATUS_META).map(([key, meta]) => (
                            <MenuItem key={key} value={key}>{meta.label}</MenuItem>
                        ))}
                    </TextField>
                </Box>

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                    {loading ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                            <CircularProgress size={26}/>
                        </Box>
                    ) : rows.length === 0 ? (
                        <Box sx={{textAlign: 'center', py: 6}}>
                            <InfoOutlinedIcon sx={{fontSize: 28, color: GOV.textMuted, mb: 1}}/>
                            <Typography sx={{fontSize: 14, color: GOV.textMuted}}>
                                Heç bir sənəd tapılmadı.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{overflowX: 'auto'}}>
                            <Box component="table" sx={{width: '100%', borderCollapse: 'collapse'}}>
                                <Box component="thead">
                                    <Box component="tr" sx={{borderBottom: `1px solid ${GOV.cardBorder}`}}>
                                        {['Lisenziya başlığı', 'Kateqoriya', 'Verilmə tarixi', 'Təşkilat', 'Status', ''].map((h) => (
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
                                                    {row.title || row.category}
                                                </Typography>
                                                <Typography sx={{fontSize: 11.5, color: GOV.textMuted}}>
                                                    {row.number}
                                                </Typography>
                                            </Box>
                                            <Box component="td" sx={{px: 2.5, py: 1.75, fontSize: 13, color: GOV.textPrimary}}>
                                                {row.category}
                                            </Box>
                                            <Box component="td" sx={{px: 2.5, py: 1.75, fontSize: 13, color: GOV.textPrimary}}>
                                                {formatDate(row.issue_date)}
                                            </Box>
                                            <Box component="td" sx={{px: 2.5, py: 1.75, fontSize: 13, color: GOV.textPrimary}}>
                                                {row.applicant_name || '-'}
                                            </Box>
                                            <Box component="td" sx={{px: 2.5, py: 1.75}}>
                                                <PermitStatusChip status={row.status}/>
                                            </Box>
                                            <Box component="td" sx={{px: 2.5, py: 1.75, textAlign: 'right'}}>
                                                <Button
                                                    size="small" endIcon={<ArrowForwardIcon sx={{fontSize: 14}}/>}
                                                    onClick={() => router.push(`${APP_ROUTES.XUSUSI_SATIS}/${row.id}`)}
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
                            <Typography sx={{fontSize: 12, color: GOV.textMuted}}>
                                Səhifə 1/1
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </AppShell>
    );
}
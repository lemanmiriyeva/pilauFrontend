"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";

function OrgCard({org, onClick}) {
    return (<Box
            onClick={onClick}
            sx={{
                backgroundColor: '#fff',
                border: `1px solid ${GOV.cardBorder}`,
                borderRadius: 2,
                p: 2.5,
                cursor: 'pointer',
                transition: 'box-shadow .15s, transform .15s',
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                '&:hover': {boxShadow: '0 8px 24px rgba(20, 27, 51, 0.10)', transform: 'translateY(-1px)'},
            }}
        >
            <Box sx={{
                width: 34,
                height: 34,
                borderRadius: 1,
                backgroundColor: GOV.navySoft,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 1.5,
            }}>
                <ApartmentOutlinedIcon sx={{fontSize: 18, color: GOV.textOnNavy}}/>
            </Box>

            <Typography sx={{fontSize: 14.5, fontWeight: 700, color: GOV.textPrimary, mb: 0.5}}>
                {org.full_name}
            </Typography>
            {org.voen && (<Typography sx={{fontSize: 12, color: GOV.textMuted, mb: 1.5}}>
                    VÖEN: {org.voen}
                </Typography>)}

            <Box sx={{flexGrow: 1}}/>

            <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1}}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.6, color: GOV.textMuted}}>
                    <DescriptionOutlinedIcon sx={{fontSize: 16}}/>
                    <Typography sx={{fontSize: 12.5, fontWeight: 600}}>
                        {org.license_count} sənəd
                    </Typography>
                </Box>
                <Box sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: GOV.textPrimary,
                }}>
                    <span>DASHBOARD</span>
                    <ArrowForwardIcon sx={{fontSize: 15}}/>
                </Box>
            </Box>
        </Box>);
}

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [orgs, setOrgs] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const timeout = setTimeout(() => {
            (async () => {
                setLoading(true);
                try {
                    const params = new URLSearchParams();
                    if (search) params.set('search', search);
                    const res = await service_api.get(`${NEXT_API_ENDPOINTS.ORGANIZATIONS.REPORT_CARDS}?${params.toString()}`);
                    setOrgs(Array.isArray(res.data) ? res.data : (res.data?.results || []));
                } catch (e) {
                    enqueueSnackbar(handleError(e), {variant: 'error'});
                } finally {
                    setLoading(false);
                }
            })();
        }, 300);
        return () => clearTimeout(timeout);
    }, [search]);

    return (<AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HESABATLAR)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Hesabatlar
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Təşkilatlar</span>
                </Typography>

                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mb: 0.5}}>
                    Təşkilatlar
                </Typography>
                <Typography sx={{fontSize: 13, color: GOV.textMuted, mb: 3}}>
                    Statistik dashboard-a keçmək üçün təşkilata klikləyin.
                </Typography>

                <TextField
                    size="small" placeholder="Təşkilat axtar..." value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{mb: 3, minWidth: 280, backgroundColor: '#fff'}}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start">
                                <SearchIcon sx={{fontSize: 18, color: GOV.textMuted}}/>
                            </InputAdornment>),
                    }}
                />

                {loading && orgs === null ? (<Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                        <CircularProgress size={26}/>
                    </Box>) : !orgs || orgs.length === 0 ? (<Box sx={{textAlign: 'center', py: 6}}>
                        <InfoOutlinedIcon sx={{fontSize: 28, color: GOV.textMuted, mb: 1}}/>
                        <Typography sx={{fontSize: 14, color: GOV.textMuted}}>
                            Təşkilat tapılmadı.
                        </Typography>
                    </Box>) : (<Box sx={{
                        display: 'grid', gap: 2, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr'},
                    }}>
                        {orgs.map((org) => (<OrgCard
                                key={org.id} org={org}
                                onClick={() => router.push(APP_ROUTES.HESABATLAR_TESKILAT_DETAL(org.id))}
                            />))}
                    </Box>)}
            </Box>
        </AppShell>);
}
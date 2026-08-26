"use client"

import React, {useEffect, useMemo, useState} from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';

import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";

import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";


export default function Page() {

    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();

    const [orgs, setOrgs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);

    const [search, setSearch] = useState('');


    /*
    |--------------------------------------------------------------------------
    | LOAD ORGANIZATIONS
    |--------------------------------------------------------------------------
    */

    const load = async () => {

        setLoading(true);

        try {

            const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.TABLE);

            const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);

            setOrgs(data);

        } catch (e) {

            enqueueSnackbar(handleError(e), {
                variant: 'error'
            });

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {
        load();
    }, []);


    /*
    |--------------------------------------------------------------------------
    | SEARCH
    |--------------------------------------------------------------------------
    */

    const filteredOrganizations = useMemo(() => {

        const query = search
            .trim()
            .toLocaleLowerCase('az-AZ');

        if (!query) {
            return orgs;
        }

        return orgs.filter((org) => {

            const searchableText = [org.full_name, org.code, org.voen, org.state_reg_number, org.email, org.phone,]
                .filter(Boolean)
                .join(' ')
                .toLocaleLowerCase('az-AZ');

            return searchableText.includes(query);
        });

    }, [orgs, search]);


    /*
    |--------------------------------------------------------------------------
    | CLEAR SEARCH
    |--------------------------------------------------------------------------
    */

    const clearSearch = () => {
        setSearch('');
    };


    /*
    |--------------------------------------------------------------------------
    | TOGGLE STATUS
    |--------------------------------------------------------------------------
    */

    const toggleStatus = async (org) => {

        setBusyId(org.id);

        try {

            await service_api.patch(NEXT_API_ENDPOINTS.ORGANIZATIONS.DETAIL(org.id), {
                is_active: !org.is_active,
            });


            setOrgs((prev) => prev.map((o) => o.id === org.id ? {
                ...o, is_active: !o.is_active
            } : o));


            enqueueSnackbar(!org.is_active ? 'Təşkilat aktivləşdirildi.' : 'Təşkilat deaktiv edildi.', {
                variant: 'success'
            });

        } catch (e) {

            enqueueSnackbar(handleError(e), {
                variant: 'error'
            });

        } finally {

            setBusyId(null);
        }
    };


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (

        <AppShell>

            <Box
                sx={{
                    maxWidth: "90%", mx: 'auto', px: {
                        xs: 2, md: 4
                    }, py: {
                        xs: 4, md: 6
                    }
                }}
            >

                {/* PAGE LABEL */}

                <Typography
                    sx={{
                        fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5
                    }}
                >
                    HÜQUQİ ŞƏXSLƏR
                </Typography>


                {/* HEADER */}

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 2,
                        mb: 3
                    }}
                >

                    <Box>

                        <Typography
                            sx={{
                                fontSize: 24, fontWeight: 800, color: GOV.textPrimary
                            }}
                        >
                            Təşkilatlar
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: 13, color: GOV.textMuted, mt: 0.5
                            }}
                        >
                            Sistemə giriş hüququ olan
                            təşkilatların siyahısı.
                        </Typography>

                    </Box>


                    <Button
                        variant="contained"
                        startIcon={<AddIcon/>}
                        onClick={() => router.push(APP_ROUTES.TESKILATLAR_YENI)}
                        sx={{
                            backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13, px: 2.5,

                            '&:hover': {
                                backgroundColor: GOV.navyMid
                            }
                        }}
                    >
                        Yeni təşkilat
                    </Button>

                </Box>


                {/* SEARCH */}

                <Box
                    sx={{
                        backgroundColor: '#FFFFFF', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: 2, mb: 2,

                        display: 'flex', alignItems: 'center', gap: 1.5
                    }}
                >

                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Təşkilat adı, kod, VÖEN..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (<InputAdornment
                                    position="start"
                                >
                                    <SearchIcon
                                        sx={{
                                            fontSize: 20, color: GOV.textMuted
                                        }}
                                    />
                                </InputAdornment>)
                        }}
                        sx={{
                            '& .MuiOutlinedInput-root': {
                                backgroundColor: '#FAFAFC'
                            }
                        }}
                    />


                    <Button
                        onClick={clearSearch}
                        disabled={!search}
                        sx={{
                            height: 40,
                            px: 2,
                            flexShrink: 0,
                            textTransform: 'none',
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: GOV.navySoft,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Təmizlə
                    </Button>

                </Box>


                {/* RESULT COUNT */}

                {!loading && (

                    <Box
                        sx={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 0.5
                        }}
                    >

                        <Typography
                            sx={{
                                fontSize: 12, color: GOV.textMuted
                            }}
                        >
                            {filteredOrganizations.length}
                            {' '}
                            təşkilat göstərilir
                        </Typography>


                        {search && (

                            <Typography
                                sx={{
                                    fontSize: 12, color: GOV.textMuted
                                }}
                            >
                                Ümumi: {orgs.length}
                            </Typography>

                        )}

                    </Box>

                )}


                {/* TABLE */}

                <Box
                    sx={{
                        backgroundColor: '#fff',
                        border: `1px solid ${GOV.cardBorder}`,
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >

                    {/* TABLE HEADER */}

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '2fr 1fr 0.8fr 1.2fr',
                            px: 2.5,
                            py: 1.25,
                            borderBottom: `1px solid ${GOV.cardBorder}`,
                            backgroundColor: '#FAFAFC'
                        }}
                    >

                        {['TƏŞKİLATIN ADI', 'SİSTEMDƏKİ İŞÇİ SAYI', 'STATUS', ''].map((h) => (

                            <Typography
                                key={h}
                                sx={{
                                    fontSize: 11, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.5
                                }}
                            >
                                {h}
                            </Typography>

                        ))}

                    </Box>


                    {/* LOADING */}

                    {loading ? (

                        <Box
                            sx={{
                                display: 'flex', justifyContent: 'center', py: 5
                            }}
                        >
                            <CircularProgress size={22}/>
                        </Box>

                    ) : filteredOrganizations.length === 0 ? (

                        /* EMPTY / NO RESULT */

                        <Box
                            sx={{
                                textAlign: 'center', py: 5
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize: 13, color: GOV.textMuted, mb: 1
                                }}
                            >
                                {orgs.length === 0 ? 'Hələ heç bir təşkilat yoxdur.' : 'Axtarışa uyğun təşkilat tapılmadı.'}
                            </Typography>


                            {orgs.length > 0 && (

                                <Button
                                    onClick={clearSearch}
                                    sx={{
                                        textTransform: 'none', fontSize: 12.5
                                    }}
                                >
                                    Axtarışı təmizlə
                                </Button>

                            )}

                        </Box>

                    ) : (

                        /* ORGANIZATIONS */

                        filteredOrganizations.map((o) => (

                            <Box
                                key={o.id}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '2fr 1fr 0.8fr 1.2fr',
                                    alignItems: 'center',
                                    px: 2.5,
                                    py: 1.75,
                                    borderBottom: `1px solid ${GOV.cardBorder}`,

                                    '&:last-of-type': {
                                        borderBottom: 'none'
                                    }
                                }}
                            >

                                {/* ORGANIZATION NAME */}

                                <Typography
                                    sx={{
                                        fontSize: 13.5, fontWeight: 600, color: GOV.textPrimary
                                    }}
                                >
                                    {o.full_name}
                                </Typography>


                                {/* USER COUNT */}

                                <Box>

                                    <Box
                                        sx={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: 0.5,
                                            fontSize: 12,
                                            color: GOV.textMuted,
                                            backgroundColor: GOV.pageBg,
                                            borderRadius: 4,
                                            px: 1.25,
                                            py: 0.4
                                        }}
                                    >

                                        {o.user_count ?? 0}
                                        {' '}
                                        nəfər

                                    </Box>

                                </Box>


                                {/* STATUS */}

                                <Box
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 0.75
                                    }}
                                >

                                    <Box
                                        sx={{
                                            width: 6,
                                            height: 6,
                                            borderRadius: '50%',
                                            backgroundColor: o.is_active ? '#2E9E5B' : '#B0374D'
                                        }}
                                    />

                                    <Typography
                                        sx={{
                                            fontSize: 12.5, fontWeight: 600, color: GOV.textPrimary
                                        }}
                                    >
                                        {o.is_active ? 'Aktiv' : 'Deaktiv'}
                                    </Typography>

                                </Box>


                                {/* ACTIONS */}

                                <Box
                                    sx={{
                                        display: 'flex', gap: 2
                                    }}
                                >

                                    <Link
                                        component="button"
                                        onClick={() => router.push(`${APP_ROUTES.TESKILATLAR}/${o.id}`)}
                                        sx={{
                                            fontSize: 12.5, fontWeight: 600, color: GOV.navySoft, textDecoration: 'none'
                                        }}
                                    >
                                        Redaktə
                                    </Link>


                                    <Link
                                        component="button"
                                        disabled={busyId === o.id}
                                        onClick={() => toggleStatus(o)}
                                        sx={{
                                            fontSize: 12.5,
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            color: o.is_active ? '#B0374D' : '#2E9E5B',
                                            opacity: busyId === o.id ? 0.5 : 1
                                        }}
                                    >
                                        {o.is_active ? 'Deaktiv et' : 'Aktiv et'}
                                    </Link>

                                </Box>

                            </Box>

                        ))

                    )}

                </Box>

            </Box>

        </AppShell>);
}
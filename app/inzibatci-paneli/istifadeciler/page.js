"use client"

import React, {useEffect, useMemo, useState} from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SearchIcon from '@mui/icons-material/Search';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";

import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";


/*
|--------------------------------------------------------------------------
| INITIALS
|--------------------------------------------------------------------------
*/

function initialsOf(u) {
    const a = (u.first_name || '')[0] || '';
    const b = (u.last_name || '')[0] || '';

    return (a + b).toUpperCase() || (u.username || '?')[0].toUpperCase();
}


/*
|--------------------------------------------------------------------------
| PAGE
|--------------------------------------------------------------------------
*/

export default function Page() {

    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();


    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [users, setUsers] = useState([]);

    const [loading, setLoading] = useState(true);

    const [busyId, setBusyId] = useState(null);

    const [search, setSearch] = useState('');

    const [organizationFilter, setOrganizationFilter] = useState('all');


    /*
    |--------------------------------------------------------------------------
    | LOAD USERS
    |--------------------------------------------------------------------------
    */

    const load = async () => {

        setLoading(true);

        try {

            const res = await service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.ADMIN_USERS_LIST);

            const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);

            setUsers(data);

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
    | ORGANIZATIONS
    |--------------------------------------------------------------------------
    |
    | User list-dən unikal təşkilatları çıxarırıq.
    |
    */

    const organizations = useMemo(() => {

        const map = new Map();

        users.forEach((user) => {

            if (!user.organization) {
                return;
            }

            const id = typeof user.organization === 'object' ? user.organization.id : user.organization;

            const name = user.organization_name || user.organization_detail?.full_name || 'Adsız təşkilat';

            if (!map.has(String(id))) {

                map.set(String(id), {
                    id, name
                });

            }

        });

        return Array.from(map.values())
            .sort((a, b) => a.name.localeCompare(b.name, 'az'));

    }, [users]);


    /*
    |--------------------------------------------------------------------------
    | FILTERED USERS
    |--------------------------------------------------------------------------
    */

    const filteredUsers = useMemo(() => {

        const query = search
            .trim()
            .toLocaleLowerCase('az-AZ');

        return users.filter((user) => {

            /*
            |--------------------------------------------------------------
            | SEARCH
            |--------------------------------------------------------------
            */

            const fullName = user.full_name || `${user.first_name || ''} ${user.last_name || ''}`;

            const searchableText = [fullName, user.first_name, user.last_name, user.username, user.email, user.phone, user.fin_kod, user.organization_name,]
                .filter(Boolean)
                .join(' ')
                .toLocaleLowerCase('az-AZ');


            const matchesSearch = !query || searchableText.includes(query);


            /*
            |--------------------------------------------------------------
            | ORGANIZATION FILTER
            |--------------------------------------------------------------
            */

            const userOrganizationId = typeof user.organization === 'object' ? user.organization?.id : user.organization;


            const matchesOrganization = organizationFilter === 'all' || String(userOrganizationId) === String(organizationFilter);


            return (matchesSearch && matchesOrganization);

        });

    }, [users, search, organizationFilter]);


    /*
    |--------------------------------------------------------------------------
    | TOGGLE STATUS
    |--------------------------------------------------------------------------
    */

    const toggleStatus = async (user) => {

        setBusyId(user.id);

        try {

            await service_api.patch(NEXT_API_ENDPOINTS
                .AUTHENTICATION
                .ADMIN_USER_DETAIL(user.id), {
                is_active: !user.is_active,
            });


            setUsers((prev) => prev.map((u) => u.id === user.id ? {
                ...u, is_active: !u.is_active
            } : u));


            enqueueSnackbar(!user.is_active ? 'İstifadəçi aktivləşdirildi.' : 'İstifadəçi deaktiv edildi.', {
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
    | CLEAR FILTERS
    |--------------------------------------------------------------------------
    */

    const clearFilters = () => {

        setSearch('');
        setOrganizationFilter('all');

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

                {/* BREADCRUMB */}

                <Typography
                    sx={{
                        fontSize: 12.5, color: GOV.textMuted, mb: 3
                    }}
                >

                    <Link
                        component="button"
                        onClick={() => router.push(APP_ROUTES.INZIBATCI)}
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'
                        }}
                    >
                        Giriş nəzarəti
                    </Link>

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
                                fontSize: 22, fontWeight: 800, color: GOV.textPrimary
                            }}
                        >
                            İstifadəçilər
                        </Typography>

                        <Typography
                            sx={{
                                fontSize: 13, color: GOV.textMuted, mt: 0.5
                            }}
                        >
                            Sistemə giriş hüququ olan
                            istifadəçilərin siyahısı.
                        </Typography>

                    </Box>


                    <Button
                        variant="contained"
                        startIcon={<AddIcon/>}
                        onClick={() => router.push(`${APP_ROUTES.INZIBATCI_ISTIFADECILER}/istifadeci-yarat`)}
                        sx={{
                            backgroundColor: GOV.navy,
                            textTransform: 'none',
                            fontWeight: 700,
                            fontSize: 13,
                            '&:hover': {
                                backgroundColor: GOV.navyMid
                            }
                        }}
                    >
                        Yeni istifadəçi
                    </Button>

                </Box>


                {/* FILTER PANEL */}

                <Box
                    sx={{
                        backgroundColor: '#FFFFFF',
                        border: `1px solid ${GOV.cardBorder}`,
                        borderRadius: 2,
                        p: 2,
                        mb: 2.5,

                        display: 'grid',
                        gridTemplateColumns: {
                            xs: '1fr', md: '1.5fr 1fr auto'
                        },
                        gap: 1.5,
                        alignItems: 'center'
                    }}
                >

                    {/* SEARCH */}

                    <TextField
                        size="small"
                        fullWidth
                        placeholder="Ad, soyad, istifadəçi adı, e-poçt..."
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


                    {/* ORGANIZATION */}

                    <FormControl
                        size="small"
                        fullWidth
                    >

                        <InputLabel>
                            Təşkilat
                        </InputLabel>

                        <Select
                            value={organizationFilter}
                            label="Təşkilat"
                            onChange={(e) => setOrganizationFilter(e.target.value)}
                            sx={{
                                backgroundColor: '#FAFAFC'
                            }}
                        >

                            <MenuItem value="all">
                                Bütün təşkilatlar
                            </MenuItem>


                            {organizations.map((organization) => (

                                <MenuItem
                                    key={organization.id}
                                    value={organization.id}
                                >
                                    {organization.name}
                                </MenuItem>

                            ))}

                        </Select>

                    </FormControl>


                    {/* CLEAR */}

                    <Button
                        onClick={clearFilters}
                        disabled={!search && organizationFilter === 'all'}
                        sx={{
                            height: 40,
                            px: 2,
                            textTransform: 'none',
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: GOV.navySoft,
                            whiteSpace: 'nowrap'
                        }}
                    >
                        Filtrləri təmizlə
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
                            {filteredUsers.length}
                            {' '}
                            istifadəçi göstərilir
                        </Typography>

                        {(search || organizationFilter !== 'all') && (

                            <Typography
                                sx={{
                                    fontSize: 12, color: GOV.textMuted
                                }}
                            >
                                Ümumi: {users.length}
                            </Typography>

                        )}

                    </Box>

                )}


                {/* TABLE */}

                <Box
                    sx={{
                        backgroundColor: '#FFFFFF',
                        border: `1px solid ${GOV.cardBorder}`,
                        borderRadius: 2,
                        overflow: 'hidden'
                    }}
                >

                    {/* TABLE HEADER */}

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: '2.2fr 1.4fr 0.9fr 1.2fr',
                            px: 2.5,
                            py: 1.25,
                            borderBottom: `1px solid ${GOV.cardBorder}`,
                            backgroundColor: '#FAFAFC'
                        }}
                    >

                        {['İSTİFADƏÇİ', 'TƏŞKİLAT', 'STATUS', ''].map((h) => (

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
                            <CircularProgress
                                size={22}
                            />
                        </Box>

                    ) : filteredUsers.length === 0 ? (

                        /* NO RESULT */

                        <Box
                            sx={{
                                textAlign: 'center', py: 6
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize: 13, color: GOV.textMuted, mb: 1
                                }}
                            >
                                {users.length === 0 ? 'Hələ heç bir istifadəçi yoxdur.' : 'Axtarışa uyğun istifadəçi tapılmadı.'}
                            </Typography>


                            {users.length > 0 && (

                                <Button
                                    onClick={clearFilters}
                                    sx={{
                                        textTransform: 'none', fontSize: 12.5
                                    }}
                                >
                                    Filtrləri təmizlə
                                </Button>

                            )}

                        </Box>

                    ) : (

                        /* USERS */

                        filteredUsers.map((u) => (

                            <Box
                                key={u.id}
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: '2.2fr 1.4fr 0.9fr 1.2fr',
                                    alignItems: 'center',
                                    px: 2.5,
                                    py: 1.5,
                                    borderBottom: `1px solid ${GOV.cardBorder}`,
                                    '&:last-of-type': {
                                        borderBottom: 'none'
                                    }
                                }}
                            >

                                {/* USER */}

                                <Box
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 1.5
                                    }}
                                >

                                    <Avatar
                                        sx={{
                                            width: 30,
                                            height: 30,
                                            fontSize: 12,
                                            backgroundColor: GOV.navySoft,
                                            color: '#fff'
                                        }}
                                    >
                                        {initialsOf(u)}
                                    </Avatar>


                                    <Box>

                                        <Typography
                                            sx={{
                                                fontSize: 13, fontWeight: 600, color: GOV.textPrimary
                                            }}
                                        >
                                            {u.full_name}
                                        </Typography>

                                        <Typography
                                            sx={{
                                                fontSize: 12, color: GOV.textMuted
                                            }}
                                        >
                                            {u.email}
                                        </Typography>

                                    </Box>

                                </Box>


                                {/* ORGANIZATION */}

                                <Typography
                                    sx={{
                                        fontSize: 12.5, color: GOV.textPrimary, pr: 1
                                    }}
                                >
                                    {u.organization_name || '—'}
                                </Typography>


                                {/* STATUS */}

                                <Box
                                    sx={{
                                        display: 'flex', alignItems: 'center', gap: 0.75
                                    }}
                                >

                                    <FiberManualRecordIcon
                                        sx={{
                                            fontSize: 9, color: u.is_active ? '#2E9E5B' : '#B0374D'
                                        }}
                                    />

                                    <Typography
                                        sx={{
                                            fontSize: 12.5, fontWeight: 600, color: GOV.textPrimary
                                        }}
                                    >
                                        {u.is_active ? 'Aktiv' : 'Deaktiv'}
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
                                        onClick={() => router.push(`${APP_ROUTES.INZIBATCI_ISTIFADECILER}/${u.id}`)}
                                        sx={{
                                            fontSize: 12.5, fontWeight: 600, color: GOV.navySoft, textDecoration: 'none'
                                        }}
                                    >
                                        Redaktə
                                    </Link>


                                    <Link
                                        component="button"
                                        disabled={busyId === u.id}
                                        onClick={() => toggleStatus(u)}
                                        sx={{
                                            fontSize: 12.5,
                                            fontWeight: 600,
                                            textDecoration: 'none',
                                            color: u.is_active ? '#B0374D' : '#2E9E5B',
                                            opacity: busyId === u.id ? 0.5 : 1
                                        }}
                                    >
                                        {u.is_active ? 'Deaktiv et' : 'Aktiv et'}
                                    </Link>

                                </Box>

                            </Box>

                        ))

                    )}

                </Box>

            </Box>

        </AppShell>);
}
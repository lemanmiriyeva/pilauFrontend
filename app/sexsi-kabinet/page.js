"use client"

import React, {useEffect, useState} from 'react';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import Autocomplete from '@mui/material/Autocomplete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";

import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";


const fieldSx = {
    backgroundColor: '#fff'
};


/*
|--------------------------------------------------------------------------
| TEXT FIELD
|--------------------------------------------------------------------------
*/

function Field({
                   label, ...props
               }) {

    return (<Box>

            <Typography
                sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    color: GOV.textMuted,
                    textTransform: 'uppercase',
                    mb: 0.75,
                }}
            >
                {label}
            </Typography>

            <TextField
                size="small"
                fullWidth
                sx={fieldSx}
                {...props}
            />

        </Box>);
}


/*
|--------------------------------------------------------------------------
| SELECT FIELD
|--------------------------------------------------------------------------
*/

function SelectField({
                         label, value, onChange, options = [], disabled, emptyLabel
                     }) {

    return (<Box>

            <Typography
                sx={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    color: GOV.textMuted,
                    textTransform: 'uppercase',
                    mb: 0.75,
                }}
            >
                {label}
            </Typography>

            <FormControl
                size="small"
                fullWidth
            >

                <select
                    value={value ?? ''}
                    onChange={onChange}
                    disabled={disabled}
                    style={{
                        height: 40,
                        width: '100%',
                        border: `1px solid ${GOV.cardBorder}`,
                        borderRadius: 4,
                        padding: '0 12px',
                        fontSize: 13,
                        backgroundColor: disabled ? '#f5f5f5' : '#fff',
                        color: '#111827',
                        outline: 'none',
                    }}
                >

                    <option value="">
                        {emptyLabel || 'Seçin...'}
                    </option>

                    {options.map((o) => (

                        <option
                            key={o.id}
                            value={o.id}
                        >
                            {o.name}
                        </option>

                    ))}

                </select>

            </FormControl>

        </Box>);
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

    const [user, setUser] = useState(null);

    const [form, setForm] = useState(null);


    const [organizations, setOrganizations] = useState([]);


    const [selectedOrganization, setSelectedOrganization] = useState(null);


    const [orgOptions, setOrgOptions] = useState({
        departments: [], positions: []
    });


    const [loading, setLoading] = useState(true);


    const [loadingOrganizations, setLoadingOrganizations] = useState(false);


    const [loadingOrganizationData, setLoadingOrganizationData] = useState(false);


    const [saving, setSaving] = useState(false);


    const [orgOpen, setOrgOpen] = useState(true);


    /*
    |--------------------------------------------------------------------------
    | FETCH ORGANIZATIONS
    |--------------------------------------------------------------------------
    */

    const fetchOrganizations = async () => {

        setLoadingOrganizations(true);

        try {

            const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.TABLE);

            const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);

            setOrganizations(data);

        } catch (e) {

            console.error('Organizations load error:', e);

            enqueueSnackbar(handleError(e), {variant: 'error'});

        } finally {

            setLoadingOrganizations(false);

        }
    };


    /*
    |--------------------------------------------------------------------------
    | FETCH SELECTED ORGANIZATION DETAILS
    |--------------------------------------------------------------------------
    */

    const fetchOrganizationData = async (organizationId) => {

        if (!organizationId) {

            setOrgOptions({
                departments: [], positions: []
            });

            return;

        }

        setLoadingOrganizationData(true);

        try {

            /*
            | Təşkilatın əsas məlumatları
            */

            const organizationResponse = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.DETAIL(organizationId));


            /*
            | Departamentlər və vəzifələr
            */

            const [departmentsResponse, positionsResponse] = await Promise.all([

                service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.DEPARTMENTS(organizationId)),

                service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.POSITIONS(organizationId))

            ]);


            const organization = organizationResponse.data;


            const departments = Array.isArray(departmentsResponse.data) ? departmentsResponse.data : (departmentsResponse.data?.results || []);


            const positions = Array.isArray(positionsResponse.data) ? positionsResponse.data : (positionsResponse.data?.results || []);


            /*
            | Təşkilatı state-də saxlayırıq
            */

            setSelectedOrganization(organization);


            /*
            | Department / position options
            */

            setOrgOptions({
                departments, positions
            });


            /*
            | Əgər əvvəlki department bu təşkilata aid deyilsə,
            | təmizləyirik.
            */

            setForm((current) => {

                if (!current) {
                    return current;
                }

                const currentDepartment = current.department;

                const currentPosition = current.position;


                const departmentExists = departments.some((item) => String(item.id) === String(currentDepartment));


                const positionExists = positions.some((item) => String(item.id) === String(currentPosition));


                return {
                    ...current,

                    organization: organization.id,

                    department: departmentExists ? currentDepartment : '',

                    position: positionExists ? currentPosition : '',
                };

            });

        } catch (e) {

            console.error('Organization data load error:', e);

            enqueueSnackbar(handleError(e), {variant: 'error'});

            setOrgOptions({
                departments: [], positions: []
            });

        } finally {

            setLoadingOrganizationData(false);

        }
    };


    /*
    |--------------------------------------------------------------------------
    | INITIAL USER
    |--------------------------------------------------------------------------
    */

    const fetchUser = async () => {

        setLoading(true);

        try {

            const userRes = await service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.USER);


            const userData = userRes.data;


            setUser(userData);


            /*
            | Form
            */

            setForm({

                first_name: userData.first_name || '',

                last_name: userData.last_name || '',

                phone: userData.phone || '',

                email: userData.email || '',

                id_card_serial: userData.id_card_serial || '',

                organization: userData.organization || '',

                department: userData.department || '',

                position: userData.position || '',

            });


            /*
            |--------------------------------------------------------------------------
            | Əgər təşkilat artıq varsa
            |--------------------------------------------------------------------------
            */

            if (userData.organization && userData.organization_detail) {

                setSelectedOrganization(userData.organization_detail);


                /*
                | Öz təşkilatının department / position-larını
                | yükləyirik.
                */

                try {

                    const [departmentsResponse, positionsResponse] = await Promise.all([

                        service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.DEPARTMENTS(userData.organization)),

                        service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.POSITIONS(userData.organization))

                    ]);


                    const departments = Array.isArray(departmentsResponse.data) ? departmentsResponse.data : (departmentsResponse.data?.results || []);


                    const positions = Array.isArray(positionsResponse.data) ? positionsResponse.data : (positionsResponse.data?.results || []);


                    setOrgOptions({
                        departments, positions
                    });

                } catch (e) {

                    console.error('Organization options error:', e);

                }

            } else {

                /*
                |--------------------------------------------------------------------------
                | Təşkilat YOXDURSA
                |
                | bütün təşkilatları gətiririk.
                |--------------------------------------------------------------------------
                */

                await fetchOrganizations();

            }

        } catch (e) {

            enqueueSnackbar(handleError(e), {variant: 'error'});

        } finally {

            setLoading(false);

        }

    };


    /*
    |--------------------------------------------------------------------------
    | INITIAL LOAD
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        fetchUser();

        // eslint-disable-next-line react-hooks/exhaustive-deps

    }, []);


    /*
    |--------------------------------------------------------------------------
    | BASIC SET
    |--------------------------------------------------------------------------
    */

    const set = (key) => (e) => {

        setForm((current) => ({
            ...current, [key]: e.target.value
        }));

    };


    /*
    |--------------------------------------------------------------------------
    | ORGANIZATION CHANGE
    |--------------------------------------------------------------------------
    */

    const handleOrganizationChange = async (event, organization) => {

        setSelectedOrganization(organization);


        /*
        | Təşkilat silinirsə
        */

        if (!organization) {

            setForm((current) => ({
                ...current,

                organization: '', department: '', position: '',
            }));


            setOrgOptions({
                departments: [], positions: []
            });

            return;
        }


        /*
        | Əvvəlcə organization ID-ni yazırıq
        */

        setForm((current) => ({
            ...current,

            organization: organization.id,

            department: '', position: '',
        }));


        /*
        | Sonra tam məlumatları gətiririk
        */

        await fetchOrganizationData(organization.id);

    };


    /*
    |--------------------------------------------------------------------------
    | SAVE
    |--------------------------------------------------------------------------
    */

    const handleSave = async () => {

        setSaving(true);

        try {

            const payload = {

                ...form,

                organization: form.organization ? form.organization : null,

                department: form.department ? form.department : null,

                position: form.position ? form.position : null,

            };


            const res = await service_api.patch(NEXT_API_ENDPOINTS.AUTHENTICATION.USER, payload);


            setUser(res.data);


            /*
            | Backend yeni organization_detail qaytarırsa
            | onu da göstəririk.
            */

            if (res.data.organization_detail) {

                setSelectedOrganization(res.data.organization_detail);

            }


            enqueueSnackbar('Məlumatlarınız yadda saxlanıldı.', {
                variant: 'success'
            });

        } catch (e) {

            enqueueSnackbar(handleError(e), {
                variant: 'error'
            });

        } finally {

            setSaving(false);

        }

    };


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loading || !form) {

        return (

            <AppShell>

                <Box
                    sx={{
                        display: 'flex', justifyContent: 'center', py: 10
                    }}
                >

                    <CircularProgress
                        size={26}
                    />

                </Box>

            </AppShell>

        );

    }


    /*
    |--------------------------------------------------------------------------
    | ORGANIZATION
    |--------------------------------------------------------------------------
    */

    const organization = selectedOrganization || user?.organization_detail || null;


    /*
    |--------------------------------------------------------------------------
    | HAS ORGANIZATION
    |--------------------------------------------------------------------------
    */

    const hasOrganization = !!(user?.organization && user?.organization_detail);


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
                        fontSize: 12.5, color: GOV.textMuted, mb: 1
                    }}
                >

                    <Link
                        component="button"
                        onClick={() => router.push(APP_ROUTES.HOME)}
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'
                        }}
                    >
                        Ana səhifə
                    </Link>

                </Typography>


                {/* HEADER */}

                <Typography
                    sx={{
                        fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5
                    }}
                >
                    ŞƏXSİ KABİNET
                </Typography>


                <Typography
                    sx={{
                        fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mb: 3
                    }}
                >
                    Məlumatlarım
                </Typography>


                {/* CARD */}

                <Box
                    sx={{
                        backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: {
                            xs: 2.5, md: 4
                        }
                    }}
                >

                    {/* BASIC INFO */}

                    <Box
                        sx={{
                            display: 'grid', gap: 3, gridTemplateColumns: {
                                xs: '1fr', sm: '1fr 1fr 1fr'
                            }
                        }}
                    >

                        <Field
                            label="FİN kod"
                            value={user?.fin_kod || ''}
                            disabled
                        />


                        <Field
                            label="Ad"
                            value={form.first_name}
                            onChange={set('first_name')}
                        />


                        <Field
                            label="Soyad"
                            value={form.last_name}
                            onChange={set('last_name')}
                        />


                        <Field
                            label="Şəxsiyyət vəsiqəsinin seriya nömrəsi"
                            value={form.id_card_serial}
                            onChange={set('id_card_serial')}
                        />


                        <Field
                            label="Telefon nömrəsi"
                            value={form.phone}
                            onChange={set('phone')}
                        />


                        <Field
                            label="Elektron poçt ünvanı"
                            type="email"
                            value={form.email}
                            onChange={set('email')}
                        />

                    </Box>


                    {/* ORGANIZATION */}

                    <Box
                        sx={{
                            mt: 4
                        }}
                    >

                        {/* HEADER */}

                        <Box
                            onClick={() => setOrgOpen((o) => !o)}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                                cursor: 'pointer',
                                backgroundColor: GOV.pageBg,
                                border: `1px solid ${GOV.cardBorder}`,
                                borderRadius: 1.5,
                                px: 2,
                                py: 1.25,
                            }}
                        >

                            <ExpandMoreIcon
                                sx={{
                                    fontSize: 20,
                                    color: GOV.textMuted,
                                    transform: orgOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                                    transition: 'transform .15s',
                                }}
                            />

                            <Typography
                                sx={{
                                    fontSize: 12.5, fontWeight: 700, color: GOV.textPrimary, letterSpacing: 0.3
                                }}
                            >
                                TƏŞKİLAT
                            </Typography>

                        </Box>


                        {orgOpen && (

                            <Box
                                sx={{
                                    display: 'grid', gap: 3, gridTemplateColumns: {
                                        xs: '1fr', sm: '1fr 1fr 1fr'
                                    }, mt: 3
                                }}
                            >

                                {/*
                                |--------------------------------------------------------------------------
                                | TƏŞKİLAT SEÇİMİ
                                |
                                | Əgər artıq təşkilat varsa disabled.
                                | Yoxdursa Autocomplete.
                                |--------------------------------------------------------------------------
                                */}

                                {!hasOrganization ? (

                                    <Box
                                        sx={{
                                            gridColumn: {
                                                xs: '1', sm: '1 / -1'
                                            }
                                        }}
                                    >

                                        <Typography
                                            sx={{
                                                fontSize: 11,
                                                fontWeight: 700,
                                                letterSpacing: 0.4,
                                                color: GOV.textMuted,
                                                textTransform: 'uppercase',
                                                mb: 0.75
                                            }}
                                        >
                                            TƏŞKİLAT
                                        </Typography>


                                        <Autocomplete

                                            options={organizations}

                                            value={selectedOrganization}

                                            loading={loadingOrganizations || loadingOrganizationData}

                                            onChange={handleOrganizationChange}

                                            getOptionLabel={(option) => option?.full_name || option?.name || ''}

                                            isOptionEqualToValue={(option, value) => String(option?.id) === String(value?.id)}

                                            noOptionsText={loadingOrganizations ? 'Təşkilatlar yüklənir...' : 'Təşkilat tapılmadı'}

                                            loadingText={'Təşkilatlar yüklənir...'}

                                            renderInput={(params) => (

                                                <TextField
                                                    {...params}
                                                    size="small"
                                                    placeholder="Təşkilat axtarın..."
                                                    sx={fieldSx}
                                                    InputProps={{
                                                        ...params.InputProps,

                                                        endAdornment: (<>
                                                                {(loadingOrganizations || loadingOrganizationData) && (

                                                                    <CircularProgress
                                                                        color="inherit"
                                                                        size={18}
                                                                    />

                                                                )}

                                                                {params.InputProps.endAdornment}
                                                            </>)
                                                    }}
                                                />

                                            )}

                                        />

                                    </Box>

                                ) : null}


                                {/* TƏŞKİLATIN ADI */}

                                <Field
                                    label="Təşkilatın adı"
                                    value={organization?.full_name || organization?.name || ''}
                                    disabled
                                />


                                {/* VOEN */}

                                <Field
                                    label="Təşkilatın VÖENİ"
                                    value={organization?.voen || ''}
                                    disabled
                                />


                                {/* STATE REG */}

                                <Field
                                    label="Dövlət qeydiyyat nömrəsi"
                                    value={organization?.state_reg_number || ''}
                                    disabled
                                />


                                {/* EMAIL */}

                                <Field
                                    label="Təşkilatın elektron poçtu"
                                    value={organization?.email || ''}
                                    disabled
                                />


                                {/* PHONE */}

                                <Field
                                    label="Təşkilatın telefonu"
                                    value={organization?.phone || ''}
                                    disabled
                                />


                                {/* ADDRESS */}

                                <Field
                                    label="Ünvan"
                                    value={organization?.address || ''}
                                    disabled
                                />


                                {/* DEPARTMENT */}

                                <SelectField
                                    label="Departament / Şöbə"
                                    value={form.department}
                                    onChange={(e) => {

                                        setForm((current) => ({
                                            ...current, department: e.target.value, position: ''
                                        }));

                                    }}
                                    options={orgOptions.departments}
                                    disabled={!organization || loadingOrganizationData || orgOptions.departments.length === 0}
                                    emptyLabel={!organization ? 'Əvvəlcə təşkilat seçin' : orgOptions.departments.length === 0 ? 'Təşkilat üçün departament təyin olunmayıb' : 'Seçin...'}
                                />


                                {/* POSITION */}

                                <SelectField
                                    label="Vəzifə"
                                    value={form.position}
                                    onChange={set('position')}
                                    options={orgOptions.positions}
                                    disabled={!organization || loadingOrganizationData || orgOptions.positions.length === 0}
                                    emptyLabel={!organization ? 'Əvvəlcə təşkilat seçin' : orgOptions.positions.length === 0 ? 'Təşkilat üçün vəzifə təyin olunmayıb' : 'Seçin...'}
                                />

                            </Box>

                        )}

                    </Box>


                    {/* SAVE */}

                    <Box
                        sx={{
                            display: 'flex', justifyContent: 'flex-end', mt: 4
                        }}
                    >

                        <Button
                            variant="contained"
                            disabled={saving || loadingOrganizationData}
                            onClick={handleSave}
                            sx={{
                                backgroundColor: GOV.navy,
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: 13,
                                px: 3,
                                '&:hover': {
                                    backgroundColor: GOV.navyMid
                                }
                            }}
                        >
                            {saving ? 'Yadda saxlanılır...' : 'Yadda saxla'}
                        </Button>

                    </Box>

                </Box>

            </Box>

        </AppShell>

    );

}
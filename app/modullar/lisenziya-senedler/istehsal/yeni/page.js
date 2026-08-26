"use client"

import React, {useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';

import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";

import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import FileDropField from "@/components/atoms/licenses/FileDropField";
import GovAccordionSection from "@/components/atoms/organizations/GovAccordionSection";


const DOC_TYPE = 'istehsal';


export default function Page() {

    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();

    const [loadingSchema, setLoadingSchema] = useState(true);
    const [schema, setSchema] = useState(null);

    const [persons, setPersons] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    const [errors, setErrors] = useState({});

    const [isConfidential, setIsConfidential] = useState(false);

    const [expanded, setExpanded] = useState('applicant');

    const [touched, setTouched] = useState({
        applicant: false, anket: false, files: false
    });

    const [isMsn, setIsMsn] = useState(false);

    const [applicant, setApplicant] = useState({
        organization: null,
        applicant_name: '',
        voen: '',
        authorized_person: '',
        fin_kod: '',
        department: '',
        position: '',
        phone: '',
        email: '',
    });

    const [files, setFiles] = useState({});

    const [formValues, setFormValues] = useState({});


    /*
    |--------------------------------------------------------------------------
    | SCHEMA + APPLICANT INFO
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        const loadData = async () => {

            setLoadingSchema(true);

            try {

                const [schemaRes, applicantRes] = await Promise.all([

                    service_api.get(`${NEXT_API_ENDPOINTS.LICENSES.PERMIT_SCHEMA}?doc_type=${DOC_TYPE}`),

                    service_api.get(NEXT_API_ENDPOINTS.LICENSES.APPLICANT_INFO),

                ]);


                const receivedSchema = schemaRes.data;

                setSchema(receivedSchema);


                /*
                 * ============================================================
                 * AUTO FIELD VALUE-LARINI BURADA FORM-A YAZIRIQ
                 * ============================================================
                 *
                 * Backend:
                 *
                 * {
                 *   key: "istinad_maddesi",
                 *   auto: true,
                 *   value: "..."
                 * }
                 *
                 * Frontend:
                 *
                 * formValues["istinad_maddesi"] = "..."
                 *
                 * auto sahə disabled qalır.
                 */

                const initialFormValues = {};

                (receivedSchema?.form_fields || []).forEach((field) => {

                    if (field.value !== undefined && field.value !== null) {
                        initialFormValues[field.key] = field.value;
                    }

                });


                setFormValues(initialFormValues);


                /*
                 * ============================================================
                 * APPLICANT
                 * ============================================================
                 */

                const org = applicantRes.data?.organization;

                const personList = applicantRes.data?.authorized_persons || [];

                setPersons(personList);

                setIsMsn(org?.code === 'msn');


                const firstPerson = personList[0];


                setApplicant((prev) => ({
                    ...prev,

                    organization: org?.id || null,

                    applicant_name: org?.full_name || '',

                    voen: org?.voen || '',

                    authorized_person: firstPerson?.id || '',

                    fin_kod: firstPerson?.fin_kod || '',

                    department: firstPerson?.department || '',

                    position: firstPerson?.position || '',

                    phone: firstPerson?.phone || '',

                    email: firstPerson?.email || '',
                }));


                /*
                 * Subyekt adı avtomatik müəssisə adı olur.
                 */

                if (org?.full_name) {

                    setFormValues((prev) => ({
                        ...prev, subyekt_adi: org.full_name
                    }));

                }

            } catch (e) {

                enqueueSnackbar(handleError(e), {variant: 'error'});

            } finally {

                setLoadingSchema(false);

            }

        };


        loadData();

    }, [enqueueSnackbar]);


    /*
    |--------------------------------------------------------------------------
    | AUTHORIZED PERSON CHANGE
    |--------------------------------------------------------------------------
    */

    const handlePersonChange = (personId) => {

        const person = persons.find((p) => String(p.id) === String(personId));


        setApplicant((prev) => ({

            ...prev,

            authorized_person: personId,

            fin_kod: person?.fin_kod || '',

            department: person?.department || '',

            position: person?.position || '',

            phone: person?.phone || '',

            email: person?.email || '',

        }));

    };


    /*
    |--------------------------------------------------------------------------
    | COMPLETION
    |--------------------------------------------------------------------------
    */

    const applicantComplete = !!(applicant.applicant_name && applicant.voen);


    const anketComplete = useMemo(() => {

        if (!schema) return false;

        return schema.form_fields
            .filter((f) => f.required && !f.auto)
            .every((f) => String(formValues[f.key] ?? '').trim());

    }, [schema, formValues]);


    const filesComplete = useMemo(() => {

        if (!schema) return false;

        if (isConfidential) return true;

        return schema.file_fields
            .filter((f) => f.required)
            .every((f) => !!files[f.key]);

    }, [schema, files, isConfidential]);


    /*
    |--------------------------------------------------------------------------
    | AUTO OPEN ACCORDIONS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (applicantComplete && expanded === 'applicant' && !touched.anket) {

            setExpanded('anket');

        }

    }, [applicantComplete, expanded, touched.anket]);


    useEffect(() => {

        if (anketComplete && expanded === 'anket' && !touched.files) {

            setExpanded('files');

        }

    }, [anketComplete, expanded, touched.files]);


    /*
    |--------------------------------------------------------------------------
    | ACCORDION
    |--------------------------------------------------------------------------
    */

    const toggle = (panel) => (e, isExpanded) => {

        setTouched((prev) => ({
            ...prev, [panel]: true
        }));

        setExpanded(isExpanded ? panel : false);

    };


    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    const validate = () => {

        const next = {};


        if (!applicant.applicant_name) {

            next.applicant_name = 'Tələb olunur';

        }


        if (!applicant.voen) {

            next.voen = 'Tələb olunur';

        }


        if (schema) {

            schema.form_fields.forEach((f) => {

                /*
                 * AUTO field validation-a düşmür.
                 */

                if (f.required && !f.auto && !String(formValues[f.key] ?? '').trim()) {

                    next[`form__${f.key}`] = 'Tələb olunur';

                }

            });


            if (!isConfidential) {

                schema.file_fields.forEach((f) => {

                    if (f.required && !files[f.key]) {

                        next[`file__${f.key}`] = true;

                    }

                });

            }

        }


        setErrors(next);


        if (next.applicant_name || next.voen) {

            setExpanded('applicant');

        } else if (Object.keys(next)
            .some((k) => k.startsWith('form__'))) {

            setExpanded('anket');

        } else if (Object.keys(next)
            .some((k) => k.startsWith('file__'))) {

            setExpanded('files');

        }


        return Object.keys(next).length === 0;

    };


    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    const handleSubmit = async () => {

        if (!validate()) {

            enqueueSnackbar('Zəhmət olmasa bütün tələb olunan sahələri doldurun.', {variant: 'warning'});

            return;

        }


        setSubmitting(true);


        try {

            const fd = new FormData();


            fd.append('doc_type', DOC_TYPE);


            fd.append('is_confidential', isConfidential ? 'true' : 'false');


            fd.append('applicant_name', applicant.applicant_name);


            fd.append('voen', applicant.voen);


            if (applicant.organization) {

                fd.append('organization', applicant.organization);

            }


            if (applicant.authorized_person) {

                fd.append('authorized_person', applicant.authorized_person);

            }


            fd.append('fin_kod', applicant.fin_kod);


            fd.append('department', applicant.department);


            fd.append('position', applicant.position);


            fd.append('phone', applicant.phone);


            fd.append('email', applicant.email);


            /*
             * AUTO VALUE-LAR DA BURADA GEDIR.
             *
             * Məsələn:
             *
             * lisenziya_nomresi
             * subyekt_adi
             * istinad_maddesi
             */

            fd.append('form_data', JSON.stringify(formValues));


            Object.entries(files).forEach(([key, file]) => {

                if (file) {

                    fd.append(`file__${key}`, file);

                }

            });


            await service_api.post(NEXT_API_ENDPOINTS.LICENSES.PERMIT_CREATE, fd, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });


            enqueueSnackbar('İstehsal lisenziyası yoxlamaya göndərildi.', {variant: 'success'});


            router.push(APP_ROUTES.ISTEHSAL);


        } catch (e) {

            enqueueSnackbar(handleError(e), {variant: 'error'});

        } finally {

            setSubmitting(false);

        }

    };


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loadingSchema) {

        return (

            <AppShell>

                <Box
                    sx={{
                        display: 'flex', justifyContent: 'center', py: 10
                    }}
                >

                    <CircularProgress size={26}/>

                </Box>

            </AppShell>

        );

    }


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
                        onClick={() => router.push(APP_ROUTES.HOME)}
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'
                        }}
                    >
                        Ana səhifə
                    </Link>

                    {' / '}

                    <Link
                        component="button"
                        onClick={() => router.push(APP_ROUTES.ISTEHSAL)}
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'
                        }}
                    >
                        İstehsal lisenziyası
                    </Link>

                    {' / '}

                    <span
                        style={{
                            fontWeight: 700, color: GOV.textPrimary
                        }}
                    >
                        Yeni lisenziya
                    </span>

                </Typography>


                {/* TITLE */}

                <Typography
                    sx={{
                        fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mb: 0.5
                    }}
                >
                    İstehsal lisenziyası yarat
                </Typography>


                <Typography
                    sx={{
                        fontSize: 13, color: GOV.textMuted, mb: 2.5
                    }}
                >
                    Aşağıdakı addımları sırayla doldurun.
                    Hər bölmə doldurulduqca növbəti bölmə
                    avtomatik açılır, istəsəniz özünüz də
                    istənilən bölməni aça/bağlaya bilərsiniz.
                </Typography>


                {/* CONFIDENTIAL */}

                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.25,
                        backgroundColor: '#FCF6E8',
                        border: `1px solid ${GOV.goldSoft}`,
                        borderRadius: 2,
                        px: 2.5,
                        py: 1.5,
                        mb: 3
                    }}
                >

                    <LockOutlinedIcon
                        sx={{
                            fontSize: 18, color: GOV.goldDark
                        }}
                    />

                    <FormControlLabel
                        sx={{m: 0}}
                        control={<Checkbox
                            checked={isConfidential}
                            onChange={(e) => setIsConfidential(e.target.checked)}
                            sx={{
                                color: GOV.goldDark,

                                '&.Mui-checked': {
                                    color: GOV.goldDark
                                }
                            }}
                        />}
                        label={<Box>

                            <Typography
                                sx={{
                                    fontSize: 13, fontWeight: 700, color: GOV.textPrimary
                                }}
                            >
                                Bu, məxfi lisenziyadır
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize: 11.5, color: GOV.textMuted
                                }}
                            >
                                {isConfidential ? 'Məxfi lisenziyalarda sənəd yükləmə mərhələsi könüllüdür.' : 'İşarələnməzsə, açıq lisenziya hesab olunur və sənəd yükləmə mərhələsi məcburidir.'}
                            </Typography>

                        </Box>}
                    />

                </Box>


                {/* ==========================================================
                    1. APPLICANT
                ========================================================== */}

                <Box sx={{mb: 3}}>

                    <GovAccordionSection
                        title="1. Müraciətçi məlumatları"
                        expanded={expanded === 'applicant'}
                        onChange={toggle('applicant')}
                        complete={applicantComplete}
                    >

                        <Typography
                            sx={{
                                fontSize: 11.5, color: GOV.textMuted, mb: 2
                            }}
                        >
                            {isMsn ? 'Müdafiə Sənayesi Nazirliyi istifadəçisi olduğunuz üçün bütün sahələr sərbəst redaktə olunur.' : 'Təşkilat və VÖEN məlumatları öz təşkilatınıza əsasən avtomatik doldurulub. Səlahiyyətli şəxsi siyahıdan seçə bilərsiniz, digər sahələr seçiminə görə avtomatik dolur.'}
                        </Typography>


                        <Box
                            sx={{
                                display: 'grid', gap: 2, gridTemplateColumns: {
                                    xs: '1fr', sm: '1fr 1fr'
                                }
                            }}
                        >

                            <TextField
                                size="small"
                                label="Müraciətçi müəssisənin tam adı"
                                required
                                value={applicant.applicant_name}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, applicant_name: e.target.value
                                }))}
                                error={!!errors.applicant_name}
                                helperText={errors.applicant_name}
                                disabled={!isMsn}
                            />


                            <TextField
                                size="small"
                                label="VÖEN"
                                required
                                value={applicant.voen}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, voen: e.target.value
                                }))}
                                error={!!errors.voen}
                                helperText={errors.voen}
                                disabled={!isMsn}
                            />


                            <TextField
                                select
                                size="small"
                                label="Səlahiyyətli şəxs"
                                value={applicant.authorized_person}
                                onChange={(e) => handlePersonChange(e.target.value)}
                            >

                                {persons.map((p) => (

                                    <MenuItem
                                        key={p.id}
                                        value={p.id}
                                    >
                                        {p.full_name}

                                        {p.person_type === 'main' ? ' (Əsas)' : ''}
                                    </MenuItem>

                                ))}


                                {persons.length === 0 && (

                                    <MenuItem
                                        disabled
                                        value=""
                                    >
                                        Səlahiyyətli şəxs tapılmadı
                                    </MenuItem>

                                )}

                            </TextField>


                            <TextField
                                size="small"
                                label="FİN kod"
                                value={applicant.fin_kod}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, fin_kod: e.target.value
                                }))}
                                disabled={!isMsn}
                            />


                            <TextField
                                size="small"
                                label="Telefon nömrəsi"
                                value={applicant.phone}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, phone: e.target.value
                                }))}
                                disabled={!isMsn}
                            />


                            <TextField
                                size="small"
                                label="Elektron poçt ünvanı"
                                value={applicant.email}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, email: e.target.value
                                }))}
                                disabled={!isMsn}
                            />


                            <TextField
                                size="small"
                                label="Departament/Şöbə"
                                value={applicant.department}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, department: e.target.value
                                }))}
                                disabled={!isMsn}
                            />


                            <TextField
                                size="small"
                                label="Vəzifə"
                                value={applicant.position}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, position: e.target.value
                                }))}
                                disabled={!isMsn}
                            />

                        </Box>

                    </GovAccordionSection>


                    {/* ======================================================
                        2. FORM
                    ====================================================== */}

                    <GovAccordionSection
                        title="2. Lisenziya anketi"
                        expanded={expanded === 'anket'}
                        onChange={toggle('anket')}
                        complete={anketComplete}
                    >

                        <Typography
                            sx={{
                                fontSize: 11.5, color: GOV.textMuted, mb: 2.5
                            }}
                        >
                            Bütün sahələri doldurun.
                        </Typography>


                        <Box
                            sx={{
                                display: 'grid', gap: 2, gridTemplateColumns: {
                                    xs: '1fr', sm: '1fr 1fr'
                                }
                            }}
                        >

                            {schema.form_fields.map((f, idx) => {

                                const isAuto = !!f.auto;

                                const fieldValue = formValues[f.key] ?? '';


                                return (

                                    <TextField
                                        key={f.key}
                                        size="small"

                                        select={f.type === 'select'}

                                        type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}

                                        label={`${String(idx + 1).padStart(2, '0')}. ${f.label}`}

                                        required={f.required}


                                        /*
                                         * AUTO field disabled qalır.
                                         *
                                         * readonly ayrıca istifadə olunur:
                                         * auto olmayan, amma readonly olan
                                         * sahələr üçün.
                                         */

                                        disabled={isAuto}

                                        InputProps={{
                                            readOnly: !!f.readonly
                                        }}


                                        value={fieldValue}


                                        onChange={(e) => {

                                            /*
                                             * Auto və readonly sahələr
                                             * dəyişdirilmir.
                                             */

                                            if (isAuto || f.readonly) {
                                                return;
                                            }


                                            setFormValues((prev) => ({
                                                ...prev, [f.key]: e.target.value
                                            }));

                                        }}


                                        error={!!errors[`form__${f.key}`]}


                                        helperText={errors[`form__${f.key}`]}


                                        InputLabelProps={f.type === 'date' ? {
                                            shrink: true
                                        } : undefined}

                                    >

                                        {f.type === 'select' && (f.options || []).map(([val, label]) => (

                                            <MenuItem
                                                key={val}
                                                value={val}
                                            >
                                                {label}
                                            </MenuItem>

                                        ))}

                                    </TextField>

                                );

                            })}

                        </Box>

                    </GovAccordionSection>


                    {/* ======================================================
                        3. FILES
                    ====================================================== */}

                    <GovAccordionSection
                        title="3. Sənəd yüklə"
                        expanded={expanded === 'files'}
                        onChange={toggle('files')}
                        complete={filesComplete}
                        optional={isConfidential}
                    >

                        <Typography
                            sx={{
                                fontSize: 11.5, color: GOV.textMuted, mb: 2.5
                            }}
                        >
                            {isConfidential ? 'Məxfi lisenziya seçildiyi üçün bu bölmə könüllüdür. Sənədləri əlavə kanalla təqdim edə bilərsiniz.' : 'Dəstəklənən formatlar: PDF, JPG, PNG'}
                        </Typography>


                        <Box
                            sx={{
                                display: 'grid', gap: 2.5, gridTemplateColumns: {
                                    xs: '1fr', sm: '1fr 1fr'
                                }
                            }}
                        >

                            {schema.file_fields.map((f) => (

                                <FileDropField
                                    key={f.key}

                                    field={isConfidential ? {
                                        ...f, required: false
                                    } : f}

                                    file={files[f.key]}

                                    error={!!errors[`file__${f.key}`]}

                                    onChange={(file) => setFiles((prev) => ({
                                        ...prev, [f.key]: file
                                    }))}
                                />

                            ))}

                        </Box>

                    </GovAccordionSection>

                </Box>


                {/* BUTTONS */}

                <Box
                    sx={{
                        display: 'flex', justifyContent: 'flex-end', gap: 1.5
                    }}
                >

                    <Button
                        onClick={() => router.push(APP_ROUTES.ISTEHSAL)}
                        disabled={submitting}
                        sx={{
                            textTransform: 'none', fontWeight: 600, fontSize: 13, color: GOV.textMuted
                        }}
                    >
                        Ləğv et
                    </Button>


                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={submitting}
                        sx={{
                            backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13,

                            '&:hover': {
                                backgroundColor: GOV.navyMid
                            }
                        }}
                    >
                        {submitting ? 'Göndərilir...' : 'Yoxlamağa göndər'}
                    </Button>

                </Box>

            </Box>

        </AppShell>);
}
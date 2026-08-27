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
import {useRouter, useParams} from "next/navigation";
import {useSnackbar} from "notistack";

import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import FileDropField from "@/components/atoms/licenses/FileDropField";
import GovAccordionSection from "@/components/atoms/organizations/GovAccordionSection";


const TYPE_META = {
    ixrac: {
        title: 'İxrac icazə sənədi yarat',
    }, idxal: {
        title: 'İdxal icazə sənədi yarat',
    },
};


export default function Page() {
    const router = useRouter();
    const params = useParams();

    const docType = params?.type === 'idxal' ? 'idxal' : 'ixrac';

    const {enqueueSnackbar} = useSnackbar();


    const [loadingSchema, setLoadingSchema] = useState(true);
    const [schema, setSchema] = useState(null);

    const [persons, setPersons] = useState([]);

    const [submitting, setSubmitting] = useState(false);

    const [errors, setErrors] = useState({});

    const [isConfidential, setIsConfidential] = useState(false);

    const [expanded, setExpanded] = useState('applicant');

    const [touched, setTouched] = useState({
        applicant: false, anket: false, files: false,
    });

    // MSN istifadəçisi müraciətçi məlumatlarını sərbəst dəyişə bilər.
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
     * Schema-dakı value/default dəyərlərini formValues-a tətbiq edir.
     *
     * Məsələn:
     *
     * {
     *   key: "muddet",
     *   value: "1 il",
     *   readonly: true
     * }
     *
     * nəticədə:
     *
     * formValues.muddet = "1 il"
     *
     * olacaq.
     */
    const buildInitialFormValues = (formFields) => {
        const values = {};

        (formFields || []).forEach((field) => {

            // Əgər schema-da konkret value varsa, onu istifadə et.
            if (Object.prototype.hasOwnProperty.call(field, 'value') && field.value !== undefined && field.value !== null) {
                values[field.key] = String(field.value);
                return;
            }

            // value yoxdursa default istifadə et.
            if (Object.prototype.hasOwnProperty.call(field, 'default') && field.default !== undefined && field.default !== null) {
                values[field.key] = String(field.default);
            }
        });

        return values;
    };


    /*
     * Schema yüklənməsi
     */
    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            setLoadingSchema(true);

            try {
                const [schemaRes, applicantRes,] = await Promise.all([service_api.get(`${NEXT_API_ENDPOINTS.LICENSES.PERMIT_SCHEMA}?doc_type=${docType}`),

                    service_api.get(NEXT_API_ENDPOINTS.LICENSES.APPLICANT_INFO),]);


                if (!mounted) {
                    return;
                }


                const receivedSchema = schemaRes.data;

                setSchema(receivedSchema);


                /*
                 * Schema-dan gələn avtomatik value/default
                 * dəyərlərini formValues-a yazırıq.
                 */
                const initialValues = buildInitialFormValues(receivedSchema?.form_fields || []);

                setFormValues(initialValues);


                /*
                 * Applicant məlumatları
                 */
                const org = applicantRes.data?.organization;

                const personList = applicantRes.data?.authorized_persons || [];


                setPersons(personList);

                setIsMsn(org?.code === 'msn');


                /*
                 * Backend əsas şəxsi birinci qaytarır.
                 */
                const firstPerson = personList[0];


                setApplicant({
                    organization: org?.id || null,

                    applicant_name: org?.full_name || '',

                    voen: org?.voen || '',

                    authorized_person: firstPerson?.id || '',

                    fin_kod: firstPerson?.fin_kod || '',

                    department: firstPerson?.department || '',

                    position: firstPerson?.position || '',

                    phone: firstPerson?.phone || '',

                    email: firstPerson?.email || '',
                });


            } catch (error) {

                if (mounted) {
                    enqueueSnackbar(handleError(error), {variant: 'error'});
                }

            } finally {

                if (mounted) {
                    setLoadingSchema(false);
                }
            }
        };


        loadData();


        return () => {
            mounted = false;
        };

    }, [docType, enqueueSnackbar]);


    /*
     * Səlahiyyətli şəxs dəyişdikdə məlumatları avtomatik doldur.
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


    const breadcrumbTitle = useMemo(() => {
        return TYPE_META[docType]?.title || 'İcazə sənədi yarat';
    }, [docType]);


    /*
     * Müraciətçi məlumatlarının tamamlanması
     */
    const applicantComplete = !!(applicant.applicant_name && applicant.voen);


    /*
     * Anket tamamlanıb?
     *
     * auto field-lər istifadəçidən tələb edilmir.
     *
     * readonly field isə tələb olunursa yoxlanılır.
     */
    const anketComplete = useMemo(() => {

        if (!schema) {
            return false;
        }


        return schema.form_fields
            .filter((field) => {
                return field.required && !field.auto;
            })
            .every((field) => {
                return String(formValues[field.key] ?? '').trim() !== '';
            });

    }, [schema, formValues]);


    /*
     * Fayllar tamamlanıb?
     */
    const filesComplete = useMemo(() => {

        if (!schema) {
            return false;
        }


        if (isConfidential) {
            return true;
        }


        return schema.file_fields
            .filter((field) => field.required)
            .every((field) => !!files[field.key]);

    }, [schema, files, isConfidential]);


    /*
     * Müraciətçi tamamlandıqda anketi aç.
     */
    useEffect(() => {

        if (applicantComplete && expanded === 'applicant' && !touched.anket) {
            setExpanded('anket');
        }

    }, [applicantComplete, expanded, touched.anket]);


    /*
     * Anket tamamlandıqda faylları aç.
     */
    useEffect(() => {

        if (anketComplete && expanded === 'anket' && !touched.files) {
            setExpanded('files');
        }

    }, [anketComplete, expanded, touched.files]);


    /*
     * Accordion toggle
     */
    const toggle = (panel) => (event, isExpanded) => {

        setTouched((prev) => ({
            ...prev, [panel]: true,
        }));


        setExpanded(isExpanded ? panel : false);
    };


    /*
     * Field readonly/auto vəziyyətini müəyyən edir.
     *
     * auto = backend/frontend tərəfindən avtomatik doldurulan
     * readonly = dəyər görünür, amma istifadəçi dəyişə bilmir.
     */
    const isFieldDisabled = (field) => {
        return !!field.auto || !!field.readonly;
    };


    /*
     * Schema field üçün value dəyişməsi.
     *
     * readonly və auto field-lərdə dəyişiklik etməyə icazə verilmir.
     */
    const handleFormFieldChange = (field, value) => {

        if (field.auto || field.readonly) {
            return;
        }


        setFormValues((prev) => ({
            ...prev, [field.key]: value,
        }));


        /*
         * İstifadəçi field-i doldurduqda həmin field-in
         * əvvəlki error-unu sil.
         */
        setErrors((prev) => {

            const errorKey = `form__${field.key}`;

            if (!prev[errorKey]) {
                return prev;
            }


            const next = {
                ...prev,
            };

            delete next[errorKey];

            return next;
        });
    };


    /*
     * Form validation
     */
    const validate = () => {

        const next = {};


        /*
         * Applicant
         */
        if (!applicant.applicant_name) {
            next.applicant_name = 'Tələb olunur';
        }


        if (!applicant.voen) {
            next.voen = 'Tələb olunur';
        }


        /*
         * Schema fields
         */
        if (schema) {

            schema.form_fields.forEach((field) => {

                /*
                 * auto field istifadəçidən tələb edilmir.
                 *
                 * readonly field isə required-dirsə
                 * dəyəri mütləq olmalıdır.
                 */
                if (field.required && !field.auto && !String(formValues[field.key] ?? '').trim()) {
                    next[`form__${field.key}`] = 'Tələb olunur';
                }
            });


            /*
             * File fields
             */
            if (!isConfidential) {

                schema.file_fields.forEach((field) => {

                    if (field.required && !files[field.key]) {
                        next[`file__${field.key}`] = true;
                    }

                });
            }
        }


        setErrors(next);


        /*
         * Error olan accordion-u aç.
         */
        if (next.applicant_name || next.voen) {

            setExpanded('applicant');

        } else if (Object.keys(next)
            .some((key) => key.startsWith('form__'))) {

            setExpanded('anket');

        } else if (Object.keys(next)
            .some((key) => key.startsWith('file__'))) {

            setExpanded('files');
        }


        return Object.keys(next).length === 0;
    };


    /*
     * Submit
     */
    const handleSubmit = async () => {

        if (!validate()) {

            enqueueSnackbar('Zəhmət olmasa bütün tələb olunan sahələri doldurun.', {variant: 'warning'});

            return;
        }


        setSubmitting(true);


        try {

            const fd = new FormData();


            fd.append('doc_type', docType);


            fd.append('is_confidential', isConfidential ? 'true' : 'false');


            /*
             * Applicant
             */
            fd.append('applicant_name', applicant.applicant_name);


            fd.append('voen', applicant.voen);


            if (applicant.organization) {

                fd.append('organization', applicant.organization);
            }


            if (applicant.authorized_person) {

                fd.append('authorized_person', applicant.authorized_person);
            }


            fd.append('fin_kod', applicant.fin_kod || '');


            fd.append('department', applicant.department || '');


            fd.append('position', applicant.position || '');


            fd.append('phone', applicant.phone || '');


            fd.append('email', applicant.email || '');


            /*
             * Schema form data
             *
             * Burada readonly value də göndərilir.
             *
             * Məsələn:
             *
             * {
             *   muddet: "1 il"
             * }
             */
            fd.append('form_data', JSON.stringify(formValues));


            /*
             * Files
             */
            Object.entries(files).forEach(([key, file]) => {

                if (file) {

                    fd.append(`file__${key}`, file);
                }
            });


            await service_api.post(NEXT_API_ENDPOINTS.LICENSES.PERMIT_CREATE, fd, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });


            enqueueSnackbar('İcazə sənədi yoxlamaya göndərildi.', {variant: 'success'});


            router.push(APP_ROUTES.IDXAL_IXRAC);


        } catch (error) {

            enqueueSnackbar(handleError(error), {variant: 'error'});

        } finally {

            setSubmitting(false);
        }
    };


    /*
     * Loading
     */
    if (loadingSchema) {

        return (<AppShell>

                <Box
                    sx={{
                        display: 'flex', justifyContent: 'center', py: 10,
                    }}
                >
                    <CircularProgress size={26}/>
                </Box>

            </AppShell>);
    }


    return (<AppShell>

            <Box
                sx={{
                    maxWidth: "90%", mx: 'auto', px: {
                        xs: 2, md: 4,
                    }, py: {
                        xs: 4, md: 6,
                    },
                }}
            >

                {/* Breadcrumb */}

                <Typography
                    sx={{
                        fontSize: 12.5, color: GOV.textMuted, mb: 3,
                    }}
                >

                    <Link
                        component="button"
                        onClick={() => router.push(APP_ROUTES.HOME)}
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none',
                        }}
                    >
                        Ana səhifə
                    </Link>

                    {' / '}

                    <Link
                        component="button"
                        onClick={() => router.push(APP_ROUTES.IDXAL_IXRAC)}
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none',
                        }}
                    >
                        Lisenziyalar
                    </Link>

                    {' / '}

                    <Link
                        component="button"
                        onClick={() => router.push(APP_ROUTES.IDXAL_IXRAC)}
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none',
                        }}
                    >
                        İdxal/İxrac əməliyyatlarına aid icazə sənədi
                    </Link>

                    {' / '}

                    <span
                        style={{
                            fontWeight: 700, color: GOV.textPrimary,
                        }}
                    >
                        Yeni icazə sənədi
                    </span>

                </Typography>


                {/* Title */}

                <Typography
                    sx={{
                        fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mb: 0.5,
                    }}
                >
                    {breadcrumbTitle}
                </Typography>


                <Typography
                    sx={{
                        fontSize: 13, color: GOV.textMuted, mb: 2.5,
                    }}
                >
                    Aşağıdakı addımları sırayla doldurun.
                    Hər bölmə doldurulduqca növbəti bölmə
                    avtomatik açılır, istəsəniz özünüz də
                    istənilən bölməni aça/bağlaya bilərsiniz.
                </Typography>


                {/* Confidential */}

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
                        mb: 3,
                    }}
                >

                    <LockOutlinedIcon
                        sx={{
                            fontSize: 18, color: GOV.goldDark,
                        }}
                    />

                    <FormControlLabel
                        sx={{m: 0}}
                        control={<Checkbox
                            checked={isConfidential}
                            onChange={(e) => setIsConfidential(e.target.checked)}
                            sx={{
                                color: GOV.goldDark, '&.Mui-checked': {
                                    color: GOV.goldDark,
                                },
                            }}
                        />}
                        label={<Box>

                            <Typography
                                sx={{
                                    fontSize: 13, fontWeight: 700, color: GOV.textPrimary,
                                }}
                            >
                                Bu, məxfi lisenziyadır
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize: 11.5, color: GOV.textMuted,
                                }}
                            >
                                {isConfidential ? 'Məxfi lisenziyalarda sənəd yükləmə mərhələsi könüllüdür.' : 'İşarələnməzsə, açıq lisenziya hesab olunur və sənəd yükləmə mərhələsi məcburidir.'}
                            </Typography>

                        </Box>}
                    />

                </Box>


                <Box sx={{mb: 3}}>

                    {/* =====================================================
                        1. APPLICANT
                    ====================================================== */}

                    <GovAccordionSection
                        title="1. Müraciətçi məlumatları"
                        expanded={expanded === 'applicant'}
                        onChange={toggle('applicant')}
                        complete={applicantComplete}
                    >

                        <Typography
                            sx={{
                                fontSize: 11.5, color: GOV.textMuted, mb: 2,
                            }}
                        >
                            {isMsn ? 'Müdafiə Sənayesi Nazirliyi istifadəçisi olduğunuz üçün bütün sahələr sərbəst redaktə olunur.' : 'Təşkilat və VÖEN məlumatları öz təşkilatınıza əsasən avtomatik doldurulub. Səlahiyyətli şəxsi siyahıdan seçə bilərsiniz, digər sahələr seçiminə görə avtomatik dolur.'}
                        </Typography>


                        <Box
                            sx={{
                                display: 'grid', gap: 2, gridTemplateColumns: {
                                    xs: '1fr', sm: '1fr 1fr',
                                },
                            }}
                        >

                            <TextField
                                size="small"
                                label="Müraciətçi müəssisənin tam adı"
                                required
                                value={applicant.applicant_name}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, applicant_name: e.target.value,
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
                                    ...p, voen: e.target.value,
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

                                {persons.map((person) => (

                                    <MenuItem
                                        key={person.id}
                                        value={person.id}
                                    >
                                        {person.full_name}

                                        {person.person_type === 'main' ? ' (Əsas)' : ''}
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
                                    ...p, fin_kod: e.target.value,
                                }))}
                                disabled={!isMsn}
                            />


                            <TextField
                                size="small"
                                label="Telefon nömrəsi"
                                value={applicant.phone}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, phone: e.target.value,
                                }))}
                                disabled={!isMsn}
                            />


                            <TextField
                                size="small"
                                label="Elektron poçt ünvanı"
                                value={applicant.email}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, email: e.target.value,
                                }))}
                                disabled={!isMsn}
                            />


                            <TextField
                                size="small"
                                label="Departament/Şöbə"
                                value={applicant.department}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, department: e.target.value,
                                }))}
                                disabled={!isMsn}
                            />


                            <TextField
                                size="small"
                                label="Vəzifə"
                                value={applicant.position}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, position: e.target.value,
                                }))}
                                disabled={!isMsn}
                            />

                        </Box>

                    </GovAccordionSection>


                    {/* =====================================================
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
                                fontSize: 11.5, color: GOV.textMuted, mb: 2.5,
                            }}
                        >
                            Bütün sahələri doldurun.
                        </Typography>


                        <Box
                            sx={{
                                display: 'grid', gap: 2, gridTemplateColumns: {
                                    xs: '1fr', sm: '1fr 1fr',
                                },
                            }}
                        >

                            {schema.form_fields.map((field, index) => {

                                /*
                                 * auto və readonly ayrı-ayrı
                                 * schema xüsusiyyətləridir.
                                 */
                                const disabled = isFieldDisabled(field);


                                /*
                                 * Date field
                                 */
                                const isDate = field.type === 'date';


                                /*
                                 * Select field
                                 */
                                const isSelect = field.type === 'select';


                                /*
                                 * Number field
                                 */
                                const isNumber = field.type === 'number';


                                return (

                                    <TextField
                                        key={field.key}
                                        size="small"

                                        select={isSelect}

                                        type={isDate ? 'date' : isNumber ? 'number' : 'text'}

                                        label={`${String(index + 1).padStart(2, '0')}. ${field.label}`}

                                        required={field.required}

                                        /*
                                         * auto və readonly
                                         * field-lər disabled olur.
                                         */
                                        disabled={disabled}

                                        /*
                                         * Schema-dan gələn
                                         * value/default burada
                                         * artıq formValues-dadır.
                                         */
                                        value={formValues[field.key] ?? ''}

                                        onChange={(event) => handleFormFieldChange(field, event.target.value)}

                                        error={!!errors[`form__${field.key}`]}

                                        helperText={errors[`form__${field.key}`]}

                                        InputLabelProps={isDate ? {
                                            shrink: true,
                                        } : undefined}

                                        /*
                                         * readonly field-lərdə
                                         * görünüşü bir az daha
                                         * aydın etmək üçün.
                                         */
                                        sx={field.readonly ? {
                                            '& .MuiInputBase-input.Mui-disabled': {
                                                WebkitTextFillColor: GOV.textPrimary, opacity: 1,
                                            },
                                        } : undefined}
                                    >

                                        {isSelect && (field.options || []).map(([value, label]) => (

                                            <MenuItem
                                                key={value}
                                                value={value}
                                            >
                                                {label}
                                            </MenuItem>

                                        ))}

                                    </TextField>

                                );
                            })}

                        </Box>

                    </GovAccordionSection>


                    {/* =====================================================
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
                                fontSize: 11.5, color: GOV.textMuted, mb: 2.5,
                            }}
                        >
                            {isConfidential ? 'Məxfi lisenziya seçildiyi üçün bu bölmə könüllüdür. Sənədləri əlavə kanalla təqdim edə bilərsiniz.' : 'Dəstəklənən formatlar: PDF, JPG, PNG'}
                        </Typography>


                        <Box
                            sx={{
                                display: 'grid', gap: 2.5, gridTemplateColumns: {
                                    xs: '1fr', sm: '1fr 1fr',
                                },
                            }}
                        >

                            {schema.file_fields.map((field) => (

                                <FileDropField
                                    key={field.key}

                                    field={isConfidential ? {
                                        ...field, required: false,
                                    } : field}

                                    file={files[field.key]}

                                    error={!!errors[`file__${field.key}`]}

                                    onChange={(file) => setFiles((prev) => ({
                                        ...prev, [field.key]: file,
                                    }))}
                                />

                            ))}

                        </Box>

                    </GovAccordionSection>

                </Box>


                {/* Buttons */}

                <Box
                    sx={{
                        display: 'flex', justifyContent: 'flex-end', gap: 1.5,
                    }}
                >

                    <Button
                        onClick={() => router.push(APP_ROUTES.IDXAL_IXRAC)}
                        disabled={submitting}
                        sx={{
                            textTransform: 'none', fontWeight: 600, fontSize: 13, color: GOV.textMuted,
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
                                backgroundColor: GOV.navyMid,
                            },
                        }}
                    >
                        {submitting ? 'Göndərilir...' : 'Yoxlamağa göndər'}
                    </Button>

                </Box>

            </Box>

        </AppShell>);
}
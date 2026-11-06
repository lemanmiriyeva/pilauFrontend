"use client"

import React, {useEffect, useMemo, useRef, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Autocomplete from '@mui/material/Autocomplete';
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
import {afterPermitCreate} from "@/components/atoms/licenses/permitSubmit";

/*
 * "İstehsal" bundan sonra "Lisenziya" adlanır. Əvvəllər Xüsusi/Ümumi Lisenziya
 * ayrı-ayrı 2 səhifə idi (istifadəçi əvvəlcə növü seçirdi) - artıq TƏK forma var.
 * Kateqoriyanı (Xüsusi/Ümumi) istifadəçi seçmir: aşağıdakı "İstinad maddəsi"
 * bölməsindəki bəndlərin HAMISI işarələnibsə "Ümumi", əks halda "Xüsusi" olur -
 * bu, sistem tərəfindən avtomatik hesablanır (bax backend
 * licenses/models.py -> PermitDocument.save() / compute_lisenziya_kateqoriya).
 *
 * DOC_TYPE burada sadəcə API-yə "hansı sxemi göstər" demək üçün ilkin (placeholder)
 * dəyərdir - hər iki dəyər eyni sxemi qaytarır (bax backend get_schema) və sənəd
 * göndəriləndə əsl kateqoriyanı həmişə backend təyin edir.
 */
const DOC_TYPE = 'xususi_lisenziya';
const LICENSE_TITLE = 'Lisenziya';


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

    // Müraciətçi təşkilatın seçimi: istifadəçinin əhatəsindəki təşkilatlar (backend scoped_organization_ids).
    const [orgOptions, setOrgOptions] = useState([]);
    const [orgLoading, setOrgLoading] = useState(false);

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

    // Seçilmiş təşkilata təyin olunmuş nomenklaturalar (yalnız onlar autocomplete-də göstərilir).
    const [orgNomenclatures, setOrgNomenclatures] = useState([]);
    const [nomenclatureLoading, setNomenclatureLoading] = useState(false);

    useEffect(() => {
        // Təşkilat dəyişəndə əvvəlki təşkilatın nomenklaturası formada qalmasın.
        setFormValues((prev) => (prev.mehsulun_novu ? {...prev, mehsulun_novu: ''} : prev));
        if (!applicant.organization) { setOrgNomenclatures([]); return; }
        let alive = true;
        setNomenclatureLoading(true);
        service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURE(applicant.organization))
            .then((res) => alive && setOrgNomenclatures(Array.isArray(res.data) ? res.data : []))
            .catch((e) => { if (alive) { setOrgNomenclatures([]); enqueueSnackbar(handleError(e), {variant: 'error'}); } })
            .finally(() => alive && setNomenclatureLoading(false));
        return () => { alive = false; };
    }, [applicant.organization]);


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


                // Təşkilatda səlahiyyətli şəxs yoxdursa, daxil olan istifadəçinin öz məlumatları (qeyd: id boşdur)
                const firstPerson = personList[0] || applicantRes.data?.current_user;


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

        const loadOrganizations = async () => {

            setOrgLoading(true);

            try {

                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.TABLE);

                const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);

                setOrgOptions(list.filter((o) => o.is_active !== false));

            } catch (e) {

                // Siyahı yüklənməsə də forma əl ilə doldurula bilir.

            } finally {

                setOrgLoading(false);

            }

        };

        loadOrganizations();

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
    | VÖEN AXTARIŞI (yalnız MSN üçün) - VÖEN yazılıb sahədən çıxılanda sistemdə
    | qeydiyyatda olan təşkilat tapılırsa, müəssisə adı və səlahiyyətli şəxslər
    | siyahısı avtomatik dolur.
    |--------------------------------------------------------------------------
    */

    const [voenLookupLoading, setVoenLookupLoading] = useState(false);
    const [docxParsing, setDocxParsing] = useState(false);

    /*
     * Təşkilatın məlumatlarını (ad, VÖEN, səlahiyyətli şəxslər) API-dən gətirib formaya yazır.
     * Həm təşkilat siyahısından seçəndə, həm də VÖEN yazılıb sahədən çıxılanda istifadə olunur.
     * Tapılmasa (və ya əhatədən kənardırsa) "fallback" təşkilatın ad/VÖEN-i ilə kifayətlənir.
     */
    const fillFromOrganization = async (voen, fallback = null) => {

        const res = await service_api.get(`${NEXT_API_ENDPOINTS.ORGANIZATIONS.VOEN_LOOKUP}?voen=${encodeURIComponent(voen)}`);

        if (!res.data?.found) {

            if (fallback) {

                setPersons([]);

                setApplicant((prev) => ({
                    ...prev,
                    organization: fallback.id || null,
                    applicant_name: fallback.full_name || prev.applicant_name,
                    voen: fallback.voen || prev.voen,
                    authorized_person: '', fin_kod: '', department: '', position: '', phone: '', email: '',
                }));

                setFormValues((prev) => ({...prev, subyekt_adi: fallback.full_name || prev.subyekt_adi}));

            }

            return false;

        }

        const org = res.data.organization;
        const personList = res.data.authorized_persons || [];
        const firstPerson = personList[0];

        setPersons(personList);

        setApplicant((prev) => ({
            ...prev,
            organization: org?.id || null,
            applicant_name: org?.full_name || prev.applicant_name,
            voen: org?.voen || prev.voen,
            authorized_person: firstPerson?.id || '',
            fin_kod: firstPerson?.fin_kod || '',
            department: firstPerson?.department || '',
            position: firstPerson?.position || '',
            phone: firstPerson?.phone || '',
            email: firstPerson?.email || '',
        }));

        // Subyekt adı avtomatik müəssisə adı olur.
        if (org?.full_name) {
            setFormValues((prev) => ({...prev, subyekt_adi: org.full_name}));
        }

        return org;

    };


    /*
     * Müraciətçi təşkilat siyahıdan seçildi -> məlumatlar API-dən avtomatik dolur.
     * Təmizlənərsə (x) sahələr boşaldılır ki, əl ilə daxil edilə bilsin.
     */
    const handleOrganizationSelect = async (org) => {

        if (!org) {

            setPersons([]);

            setApplicant((prev) => ({
                ...prev,
                organization: null, applicant_name: '', voen: '',
                authorized_person: '', fin_kod: '', department: '', position: '', phone: '', email: '',
            }));

            return;

        }

        setVoenLookupLoading(true);

        try {

            const found = await fillFromOrganization(org.voen, org);

            if (found) {
                enqueueSnackbar(`"${org.full_name}" məlumatları avtomatik dolduruldu.`, {variant: 'success'});
            }

        } catch (e) {

            enqueueSnackbar(handleError(e), {variant: 'error'});

        } finally {

            setVoenLookupLoading(false);

        }

    };


    /*
     * VÖEN yazılıb sahədən çıxılanda sistemdə qeydiyyatda olan təşkilat tapılırsa məlumatlar dolur.
     */
    const handleVoenLookup = async () => {

        const voen = (applicant.voen || '').trim();

        if (!voen || voen.length < 9) return;

        // Artıq həmin təşkilat seçilibsə təkrar sorğu göndərmirik.
        const current = orgOptions.find((o) => o.id === applicant.organization);
        if (current && current.voen === voen) return;

        setVoenLookupLoading(true);

        try {

            const org = await fillFromOrganization(voen);

            if (org) {
                enqueueSnackbar(`"${org.full_name}" məlumatları avtomatik dolduruldu.`, {variant: 'success'});
            } else {
                enqueueSnackbar('Bu VÖEN üzrə sistemdə qeydiyyatlı təşkilat tapılmadı, məlumatları əl ilə daxil edə bilərsiniz.', {variant: 'info'});
            }

        } catch (e) {

            // Sakit uğursuzluq - istifadəçi məlumatları əl ilə daxil etməyə davam edə bilər.

        } finally {

            setVoenLookupLoading(false);

        }

    };


    /*
    |--------------------------------------------------------------------------
    | SÜRƏTLİ DOLDURMA - QOVLUQ (sənədlər) + WORD ŞABLONU (anket)
    |--------------------------------------------------------------------------
    */

    const normalizeStr = (s) => (s || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/ə/g, 'e').replace(/ö/g, 'o').replace(/ü/g, 'u')
        .replace(/ç/g, 'c').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ı/g, 'i')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

    const stripExt = (name) => (name || '').replace(/\.[^.]+$/, '');

    const handleFolderSelect = (e) => {

        const selected = Array.from(e.target.files || []);

        if (!selected.length || !schema) return;

        const nextFiles = {...files};
        let matchedCount = 0;

        selected.forEach((file) => {

            const base = normalizeStr(stripExt(file.name));

            const match = schema.file_fields.find((f) => {
                const keyNorm = normalizeStr(f.key);
                const labelNorm = normalizeStr(f.label);
                return base === keyNorm || base === labelNorm
                    || base.includes(keyNorm) || keyNorm.includes(base)
                    || base.includes(labelNorm) || labelNorm.includes(base);
            });

            if (match) {
                nextFiles[match.key] = file;
                matchedCount += 1;
            }

        });

        setFiles(nextFiles);

        enqueueSnackbar(
            matchedCount
                ? `${matchedCount} / ${selected.length} sənəd uyğun sahəyə avtomatik yerləşdirildi.`
                : 'Qovluqdakı fayllardan heç biri tələb olunan sənəd adlarına uyğun gəlmədi.',
            {variant: matchedCount ? 'success' : 'warning'}
        );

        e.target.value = '';

    };


    const handleDocxUpload = async (e) => {

        const file = e.target.files?.[0];

        if (!file) return;

        setDocxParsing(true);

        try {

            const fd = new FormData();
            fd.append('file', file);
            fd.append('doc_type', DOC_TYPE);

            const res = await service_api.post(NEXT_API_ENDPOINTS.LICENSES.ANKET_PARSE, fd, {
                headers: {'Content-Type': 'multipart/form-data'},
            });

            const values = res.data?.values || {};
            const matchedCount = res.data?.matched_count ?? Object.keys(values).length;

            if (Object.keys(values).length) {
                setFormValues((prev) => ({...prev, ...values}));
            }

            if (res.data?.voen) {
                setApplicant((prev) => ({...prev, voen: res.data.voen}));
            }

            enqueueSnackbar(
                matchedCount
                    ? `${matchedCount} sahə anket şablonundan avtomatik dolduruldu.`
                    : 'Şablonda dolduruılmuş sahə tapılmadı.',
                {variant: matchedCount ? 'success' : 'warning'}
            );

        } catch (err) {

            enqueueSnackbar(handleError(err), {variant: 'error'});

        } finally {

            setDocxParsing(false);
            e.target.value = '';

        }

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

    /*
     * Növbəti bölmə yalnız bölmə "tamamlanmamış -> tamamlanmış" vəziyyətinə KEÇƏNDƏ açılır.
     * Əvvəlki versiya hər render-də "tamamdır və açıqdır" şərtini yoxlayırdı: bölmə artıq
     * tam olduqda (məs. istifadəçinin təşkilatı avtomatik dolur) onu əl ilə açmaq mümkün
     * olmurdu - dərhal növbətiyə atlayırdı. Anket mətn yazılarkən özbaşına atlamır.
     */
    const prevApplicantComplete = useRef(applicantComplete);

    useEffect(() => {

        if (applicantComplete && !prevApplicantComplete.current && expanded === 'applicant') {

            setExpanded('anket');

        }

        prevApplicantComplete.current = applicantComplete;

    }, [applicantComplete]);


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


            const res = await service_api.post(NEXT_API_ENDPOINTS.LICENSES.PERMIT_CREATE, fd, {
                headers: {'Content-Type': 'multipart/form-data'},
            });
            afterPermitCreate({
                data: res.data, router, enqueueSnackbar,
                successMessage: 'İcazə sənədi yoxlamaya göndərildi.',
                listRoute: APP_ROUTES.IDXAL_IXRAC,
            });


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
    | XƏTA - sxem yüklənə bilmədi (məs. backend hələ bu doc_type-ı tanımır)
    |--------------------------------------------------------------------------
    */

    if (!schema) {

        return (

            <AppShell>

                <Box
                    sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        gap: 2, py: 10, textAlign: 'center',
                    }}
                >

                    <Typography sx={{fontSize: 14, color: GOV.textMuted}}>
                        Sxem yüklənərkən xəta baş verdi. Bir daha cəhd edin və ya
                        backend-in "{DOC_TYPE}" doc_type-ını dəstəklədiyini yoxlayın.
                    </Typography>

                    <Button
                        variant="outlined"
                        onClick={() => router.push(APP_ROUTES.LISENZIYA)}
                        sx={{textTransform: 'none', fontWeight: 700, fontSize: 13}}
                    >
                        Geri qayıt
                    </Button>

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
                        onClick={() => router.push(APP_ROUTES.LISENZIYA)}
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'
                        }}
                    >
                        Lisenziya
                    </Link>

                    {' / '}

                    <span
                        style={{
                            fontWeight: 700, color: GOV.textPrimary
                        }}
                    >
                        {LICENSE_TITLE}
                    </span>

                </Typography>


                {/* TITLE */}

                <Typography
                    sx={{
                        fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mb: 0.5
                    }}
                >
                    {LICENSE_TITLE} yarat
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


                {/* SÜRƏTLİ DOLDURMA - qovluqdan sənədlər + Word şablonu ilə anket */}

                <Box
                    sx={{
                        border: `1.5px dashed ${GOV.cardBorder}`,
                        borderRadius: 2,
                        backgroundColor: '#F7F9FC',
                        p: 2.5,
                        mb: 3,
                        display: 'grid',
                        gap: 2,
                        gridTemplateColumns: {xs: '1fr', md: '1fr 1fr'},
                    }}
                >

                    {/* QOVLUQ - sənədlər */}

                    <Box>

                        <Typography sx={{fontSize: 13, fontWeight: 800, color: GOV.textPrimary, mb: 0.5}}>
                            Sənədləri qovluq şəklində yüklə
                        </Typography>

                        <Typography sx={{fontSize: 11.5, color: GOV.textMuted, mb: 1.25}}>
                            Bütün tələb olunan sənədləri bir qovluqda saxlayıb seçin - fayl adları
                            "3. Sənəd yüklə" bölməsindəki sahə adlarına uyğun olarsa, sistem onları
                            özü müvafiq yerə yerləşdirəcək.
                        </Typography>

                        <Button
                            component="label"
                            variant="outlined"
                            size="small"
                            sx={{textTransform: 'none', fontWeight: 700, fontSize: 12.5}}
                        >
                            Qovluq seç
                            <input
                                type="file"
                                hidden
                                webkitdirectory=""
                                directory=""
                                multiple
                                onChange={handleFolderSelect}
                            />
                        </Button>

                    </Box>


                    {/* WORD ŞABLONU - anket */}

                    <Box>

                        <Typography sx={{fontSize: 13, fontWeight: 800, color: GOV.textPrimary, mb: 0.5}}>
                            Word şablonu ilə anketi doldur
                        </Typography>

                        <Typography sx={{fontSize: 11.5, color: GOV.textMuted, mb: 1.25}}>
                            Şablonu yükləyin (VÖEN artıq doldurulub), qalan sahələri Word-də
                            doldurub geri yükləyin - "2. Lisenziya anketi" avtomatik dolacaq.
                        </Typography>

                        <Box sx={{display: 'flex', gap: 1, flexWrap: 'wrap'}}>

                            <Button
                                component="a"
                                href={`/api/${NEXT_API_ENDPOINTS.LICENSES.ANKET_TEMPLATE}?doc_type=${DOC_TYPE}&voen=${encodeURIComponent(applicant.voen || '')}&applicant_name=${encodeURIComponent(applicant.applicant_name || '')}`}
                                variant="outlined"
                                size="small"
                                sx={{textTransform: 'none', fontWeight: 700, fontSize: 12.5}}
                            >
                                Şablonu yüklə
                            </Button>

                            <Button
                                component="label"
                                variant="contained"
                                size="small"
                                disabled={docxParsing}
                                sx={{
                                    backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 12.5,
                                    '&:hover': {backgroundColor: GOV.navyMid},
                                }}
                            >
                                {docxParsing ? 'Oxunur...' : 'Doldurulmuşu yüklə'}
                                <input
                                    type="file"
                                    hidden
                                    accept=".docx"
                                    onChange={handleDocxUpload}
                                />
                            </Button>

                        </Box>

                    </Box>

                </Box>


                {/* CONFIDENTIAL - hələlik gizlədilib, sonra geri aktivləşdiriləcək.
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
                */}


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
                            Müraciətçi təşkilatı siyahıdan seçin - ad, VÖEN və səlahiyyətli şəxs məlumatları avtomatik dolacaq. Bütün sahələri əl ilə də dəyişə bilərsiniz.
                        </Typography>


                        <Box
                            sx={{
                                display: 'grid', gap: 2, gridTemplateColumns: {
                                    xs: '1fr', sm: '1fr 1fr'
                                }
                            }}
                        >

                            <Autocomplete
                                size="small"
                                sx={{gridColumn: {sm: '1 / -1'}}}
                                options={orgOptions}
                                loading={orgLoading}
                                value={orgOptions.find((o) => o.id === applicant.organization) || null}
                                onChange={(_, org) => handleOrganizationSelect(org)}
                                getOptionLabel={(o) => o.full_name || ''}
                                isOptionEqualToValue={(a, b) => a.id === b.id}
                                filterOptions={(opts, {inputValue}) => {
                                    const q = inputValue.trim().toLowerCase();
                                    if (!q) return opts;
                                    return opts.filter((o) =>
                                        (o.full_name || '').toLowerCase().includes(q)
                                        || (o.voen || '').includes(q)
                                    );
                                }}
                                noOptionsText="Təşkilat tapılmadı"
                                loadingText="Yüklənir..."
                                renderOption={(props, o) => (
                                    <li {...props} key={o.id}>
                                        <Box>
                                            <Typography sx={{fontSize: 13, fontWeight: 600}}>{o.full_name}</Typography>
                                            <Typography sx={{fontSize: 11.5, color: GOV.textMuted}}>VÖEN: {o.voen}</Typography>
                                        </Box>
                                    </li>
                                )}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Müraciətçi təşkilat"
                                        placeholder="Təşkilat adı və ya VÖEN ilə axtarın"
                                        helperText={voenLookupLoading ? 'Məlumatlar yüklənir...' : ''}
                                    />
                                )}
                            />


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
                            />


                            <TextField
                                size="small"
                                label="VÖEN"
                                required
                                value={applicant.voen}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, voen: e.target.value
                                }))}
                                onBlur={handleVoenLookup}
                                error={!!errors.voen}
                                helperText={errors.voen || (voenLookupLoading ? 'Yoxlanılır...' : 'VÖEN daxil edib sahədən çıxın - məlumatlar tapılarsa avtomatik dolacaq.')}
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
                            />


                            <TextField
                                size="small"
                                label="Telefon nömrəsi"
                                value={applicant.phone}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, phone: e.target.value
                                }))}
                            />


                            <TextField
                                size="small"
                                label="Elektron poçt ünvanı"
                                value={applicant.email}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, email: e.target.value
                                }))}
                            />


                            <TextField
                                size="small"
                                label="Departament/Şöbə"
                                value={applicant.department}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, department: e.target.value
                                }))}
                            />


                            <TextField
                                size="small"
                                label="Vəzifə"
                                value={applicant.position}
                                onChange={(e) => setApplicant((p) => ({
                                    ...p, position: e.target.value
                                }))}
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

                            {(() => {
                                const bendField = schema.form_fields.find((x) => x.type === 'checkbox_list');
                                const selectedBends = bendField ? (formValues[bendField.key] || []) : [];
                                const allBendKeys = bendField ? (bendField.options || []).map((o) => o.key) : [];
                                const kateqoriyaLabel = (allBendKeys.length > 0 && allBendKeys.every((k) => selectedBends.includes(k)))
                                    ? 'Ümumi Lisenziya'
                                    : 'Xüsusi Lisenziya';

                                return schema.form_fields.map((f, idx) => {

                                    const isAuto = !!f.auto;
                                    const numberLabel = `${String(idx + 1).padStart(2, '0')}. ${f.label}`;


                                    /*
                                     * CHECKBOX LIST (məs. "İstinad maddəsi" bəndləri) - istifadəçi
                                     * hər bəndi ayrıca işarələyir, dəyər array kimi saxlanılır.
                                     */

                                    if (f.type === 'checkbox_list') {

                                        const selected = formValues[f.key] || [];

                                        /*
                                         * Bəndlər (texnika / silah / sursat) öz qrupuna
                                         * (texnika / silah / sursat) görə qruplaşdırılır - hər qrupun öz
                                         * qalın başlığı (məs. "Hərbi texnikanın:") var, altında isə
                                         * checkbox-lar sətir-sətir gəlir (bax
                                         * backend field_schema.py -> ISTINAD_MADDESI_BENDLERI).
                                         */

                                        const groups = [];
                                        (f.options || []).forEach((opt) => {
                                            let g = groups.find((x) => x.group === opt.group);
                                            if (!g) {
                                                g = {group: opt.group, group_label: opt.group_label, items: []};
                                                groups.push(g);
                                            }
                                            g.items.push(opt);
                                        });

                                        return (
                                            <Box
                                                key={f.key}
                                                sx={{
                                                    gridColumn: '1 / -1',
                                                    border: `1px solid ${errors[`form__${f.key}`] ? '#d32f2f' : GOV.cardBorder}`,
                                                    borderRadius: 1.5, p: 1.75,
                                                }}
                                            >
                                                <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap', mb: 1.5}}>
                                                    <Typography sx={{fontSize: 12.5, fontWeight: 700, color: GOV.textPrimary}}>
                                                        {numberLabel}{f.required ? ' *' : ''}
                                                    </Typography>
                                                    {(() => {
                                                        const allKeys = (f.options || []).map((o) => o.key);
                                                        const allSelected = allKeys.length > 0 && allKeys.every((k) => selected.includes(k));
                                                        return (
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                onClick={() => setFormValues((prev) => ({...prev, [f.key]: allSelected ? [] : allKeys}))}
                                                                sx={{textTransform: 'none', fontWeight: 600, fontSize: 12, color: GOV.navy, borderColor: GOV.navy}}
                                                            >
                                                                {allSelected ? 'Seçimi təmizlə' : 'Hamısını seç'}
                                                            </Button>
                                                        );
                                                    })()}
                                                </Box>

                                                {groups.map((g) => (
                                                    <Box key={g.group} sx={{mb: 1.5}}>

                                                        <Typography sx={{fontSize: 12.5, fontWeight: 700, color: GOV.textPrimary, mb: 0.5}}>
                                                            {g.group_label}
                                                        </Typography>

                                                        <Box sx={{display: 'flex', flexDirection: 'column', pl: 1}}>
                                                            {g.items.map((opt) => (
                                                                <FormControlLabel
                                                                    key={opt.key}
                                                                    sx={{ml: 0}}
                                                                    control={
                                                                        <Checkbox
                                                                            size="small"
                                                                            checked={selected.includes(opt.key)}
                                                                            onChange={(e) => {
                                                                                setFormValues((prev) => {
                                                                                    const current = prev[f.key] || [];
                                                                                    const next = e.target.checked
                                                                                        ? [...current, opt.key]
                                                                                        : current.filter((k) => k !== opt.key);
                                                                                    return {...prev, [f.key]: next};
                                                                                });
                                                                            }}
                                                                        />
                                                                    }
                                                                    label={<Typography sx={{fontSize: 12.5}}>{opt.label}</Typography>}
                                                                />
                                                            ))}
                                                        </Box>

                                                    </Box>
                                                ))}

                                                <Typography sx={{fontSize: 11, color: GOV.textMuted}}>
                                                    Bütün bəndləri işarələsəniz "Ümumi Lisenziya", hər hansı birini
                                                    boş buraxsanız "Xüsusi Lisenziya" kateqoriyası avtomatik təyin olunur.
                                                </Typography>

                                                {errors[`form__${f.key}`] && (
                                                    <Typography sx={{fontSize: 11, color: '#d32f2f', mt: 0.5}}>
                                                        {errors[`form__${f.key}`]}
                                                    </Typography>
                                                )}
                                            </Box>
                                        );

                                    }


                                    /*
                                     * COMPUTED (məs. "Lisenziya kateqoriyası") - sistem hesablayır,
                                     * istifadəçi redaktə edə bilməz, backend-dən dəyər gəlmir çünki
                                     * sənəd hələ göndərilməyib - burada eyni qaydanı frontend-də
                                     * canlı hesablayıb göstəririk.
                                     */

                                    if (f.computed) {

                                        return (
                                            <TextField
                                                key={f.key}
                                                size="small"
                                                label={numberLabel}
                                                value={kateqoriyaLabel}
                                                disabled
                                                helperText={f.help_text}
                                            />
                                        );

                                    }


                                    /*
                                     * NOMENKLATURA - yalnız seçilmiş təşkilata təyin olunmuş mövqelər,
                                     * autocomplete ilə (çoxlu seçim). Dəyər vergüllə birləşdirilmiş mətn kimi saxlanılır.
                                     */
                                    if (f.type === 'nomenclature') {
                                        const labelOf = (n) => n.subcategory_name
                                            ? `${n.name} (${n.category_name} / ${n.subcategory_name})` : `${n.name} (${n.category_name})`;
                                        const options = orgNomenclatures.map(labelOf);
                                        const current = String(formValues[f.key] || '').split(' | ').filter(Boolean);
                                        return (
                                            <Autocomplete
                                                key={f.key}
                                                multiple
                                                size="small"
                                                options={options}
                                                value={current}
                                                loading={nomenclatureLoading}
                                                disabled={!applicant.organization}
                                                onChange={(_, v) => setFormValues((prev) => ({...prev, [f.key]: v.join(' | ')}))}
                                                noOptionsText="Bu təşkilata nomenklatura təyin olunmayıb"
                                                loadingText="Yüklənir..."
                                                renderInput={(p) => (
                                                    <TextField
                                                        {...p}
                                                        label={numberLabel}
                                                        required={f.required}
                                                        error={!!errors[`form__${f.key}`]}
                                                        helperText={errors[`form__${f.key}`] || (applicant.organization
                                                            ? f.help_text
                                                            : 'Əvvəlcə müraciətçi təşkilatı seçin.')}
                                                    />
                                                )}
                                            />
                                        );
                                    }

                                    const fieldValue = formValues[f.key] ?? '';


                                    return (

                                        <TextField
                                            key={f.key}
                                            size="small"

                                            select={f.type === 'select'}

                                            type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}

                                            label={numberLabel}

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

                                });
                            })()}

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
                        onClick={() => router.push(APP_ROUTES.LISENZIYA)}
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
"use client";

import React, {useEffect, useMemo, useState} from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

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


const DOC_TYPE = "xususi_satis";


export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();

    // ---------------------------------------------------------
    // Loading / schema
    // ---------------------------------------------------------

    const [loadingSchema, setLoadingSchema] = useState(true);
    const [schema, setSchema] = useState(null);

    // ---------------------------------------------------------
    // Applicant
    // ---------------------------------------------------------

    const [persons, setPersons] = useState([]);
    const [isMsn, setIsMsn] = useState(false);

    const [applicant, setApplicant] = useState({
        organization: null,
        applicant_name: "",
        voen: "",
        authorized_person: "",
        fin_kod: "",
        department: "",
        position: "",
        phone: "",
        email: "",
    });

    // ---------------------------------------------------------
    // Form
    // ---------------------------------------------------------

    const [formValues, setFormValues] = useState({});

    // ---------------------------------------------------------
    // Files
    // ---------------------------------------------------------

    const [files, setFiles] = useState({});

    // ---------------------------------------------------------
    // Submit / errors
    // ---------------------------------------------------------

    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // ---------------------------------------------------------
    // UI
    // ---------------------------------------------------------

    const [isConfidential, setIsConfidential] = useState(false);
    const [expanded, setExpanded] = useState("applicant");

    const [touched, setTouched] = useState({
        applicant: false, anket: false, files: false,
    });


    // =========================================================
    // Helper: nested value oxumaq
    //
    // Məsələn:
    // "organization.full_name"
    //
    // object:
    // {
    //    organization: {
    //       full_name: "ABC MMC"
    //    }
    // }
    //
    // nəticə:
    // "ABC MMC"
    // =========================================================

    const getNestedValue = (object, path) => {
        if (!object || !path) {
            return "";
        }

        return path
            .split(".")
            .reduce((current, key) => current?.[key], object) ?? "";
    };


    // =========================================================
    // 1. Schema + applicant məlumatlarını gətir
    // =========================================================

    useEffect(() => {
        let mounted = true;

        const loadData = async () => {
            setLoadingSchema(true);

            try {
                const [schemaRes, applicantRes] = await Promise.all([service_api.get(`${NEXT_API_ENDPOINTS.LICENSES.PERMIT_SCHEMA}?doc_type=${DOC_TYPE}`),

                    service_api.get(NEXT_API_ENDPOINTS.LICENSES.APPLICANT_INFO),]);

                if (!mounted) {
                    return;
                }

                const receivedSchema = schemaRes.data;
                const applicantData = applicantRes.data;

                setSchema(receivedSchema);

                // -------------------------------------------------
                // Applicant
                // -------------------------------------------------

                const org = applicantData?.organization;
                const personList = applicantData?.authorized_persons || [];

                setPersons(personList);

                setIsMsn(org?.code === "msn");

                const firstPerson = personList[0];

                setApplicant((prev) => ({
                    ...prev,

                    organization: org?.id || null,

                    applicant_name: org?.full_name || "",

                    voen: org?.voen || "",

                    authorized_person: firstPerson?.id || "",

                    fin_kod: firstPerson?.fin_kod || "",

                    department: firstPerson?.department || "",

                    position: firstPerson?.position || "",

                    phone: firstPerson?.phone || "",

                    email: firstPerson?.email || "",
                }));

                // -------------------------------------------------
                // Schema field values
                //
                // Burada əsas məsələ budur:
                //
                // schema:
                //
                // {
                //    key: "muddet",
                //    value: "Müddətsiz",
                //    readonly: true
                // }
                //
                // avtomatik olaraq:
                //
                // formValues:
                // {
                //    muddet: "Müddətsiz"
                // }
                // -------------------------------------------------

                const initialFormValues = {};

                const formFields = receivedSchema?.form_fields || [];

                formFields.forEach((field) => {
                    // ---------------------------------------------
                    // 1. value varsa götür
                    // ---------------------------------------------

                    if (field.value !== undefined && field.value !== null) {
                        initialFormValues[field.key] = field.value;
                    }

                    // ---------------------------------------------
                    // 2. auto_source varsa applicant məlumatından
                    // götür
                    //
                    // Məs:
                    //
                    // auto_source:
                    // "organization.full_name"
                    // ---------------------------------------------

                    if (field.auto_source) {
                        let sourceValue = "";

                        if (field.auto_source.startsWith("organization.")) {
                            sourceValue = getNestedValue(org, field.auto_source.replace("organization.", ""));
                        }

                        if (sourceValue !== undefined && sourceValue !== null && sourceValue !== "") {
                            initialFormValues[field.key] = sourceValue;
                        }
                    }
                });

                setFormValues(initialFormValues);

            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: "error"});
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
    }, [enqueueSnackbar]);


    // =========================================================
    // 2. Schema dəyişəndə value və auto_source tətbiq et
    //
    // Bu ikinci qoruyucu mexanizmdir.
    // =========================================================

    useEffect(() => {
        if (!schema?.form_fields) {
            return;
        }

        setFormValues((previous) => {
            const next = {
                ...previous,
            };

            schema.form_fields.forEach((field) => {

                // -------------------------------------------------
                // Schema value
                // -------------------------------------------------

                if (field.value !== undefined && field.value !== null && next[field.key] === undefined) {
                    next[field.key] = field.value;
                }

                // -------------------------------------------------
                // auto_source
                // -------------------------------------------------

                if (field.auto_source === "organization.full_name" && applicant.applicant_name) {
                    next[field.key] = applicant.applicant_name;
                }

            });

            return next;
        });
    }, [schema, applicant.applicant_name,]);


    // =========================================================
    // 3. Authorized person dəyişməsi
    // =========================================================

    const handlePersonChange = (personId) => {
        const person = persons.find((p) => String(p.id) === String(personId));

        setApplicant((prev) => ({
            ...prev,

            authorized_person: personId,

            fin_kod: person?.fin_kod || "",

            department: person?.department || "",

            position: person?.position || "",

            phone: person?.phone || "",

            email: person?.email || "",
        }));
    };


    // =========================================================
    // 4. Applicant tamamlanıb?
    // =========================================================

    const applicantComplete = Boolean(applicant.applicant_name && applicant.voen);


    // =========================================================
    // 5. Anket tamamlanıb?
    //
    // readonly və auto sahələr schema-dan value alır.
    // =========================================================

    const anketComplete = useMemo(() => {
        if (!schema?.form_fields) {
            return false;
        }

        return schema.form_fields
            .filter((field) => {
                return (field.required && !field.auto);
            })
            .every((field) => {
                const value = formValues[field.key];

                return String(value ?? "").trim() !== "";
            });

    }, [schema, formValues,]);


    // =========================================================
    // 6. Files tamamlanıb?
    // =========================================================

    const filesComplete = useMemo(() => {
        if (!schema?.file_fields) {
            return false;
        }

        // Məxfi sənəddirsə sənədlər könüllüdür.
        if (isConfidential) {
            return true;
        }

        return schema.file_fields
            .filter((field) => field.required)
            .every((field) => {
                return Boolean(files[field.key]);
            });

    }, [schema, files, isConfidential,]);


    // =========================================================
    // 7. Accordion avtomatik keçid
    // =========================================================

    useEffect(() => {
        if (applicantComplete && expanded === "applicant" && !touched.anket) {
            setExpanded("anket");
        }
    }, [applicantComplete, expanded, touched.anket,]);


    useEffect(() => {
        if (anketComplete && expanded === "anket" && !touched.files) {
            setExpanded("files");
        }
    }, [anketComplete, expanded, touched.files,]);


    // =========================================================
    // 8. Accordion toggle
    // =========================================================

    const toggle = (panel) => (event, isExpanded) => {
        setTouched((previous) => ({
            ...previous, [panel]: true,
        }));

        setExpanded(isExpanded ? panel : false);
    };


    // =========================================================
    // 9. Field disabled/readOnly müəyyənləşdirilməsi
    // =========================================================

    const isFieldReadonly = (field) => {
        return field?.readonly === true;
    };

    const isFieldAuto = (field) => {
        return field?.auto === true;
    };


    // =========================================================
    // 10. Form field dəyişməsi
    // =========================================================

    const handleFormFieldChange = (field, value) => {
        // readonly və auto field-lər
        // istifadəçi tərəfindən dəyişdirilə bilməz.
        if (isFieldReadonly(field) || isFieldAuto(field)) {
            return;
        }

        setFormValues((previous) => ({
            ...previous, [field.key]: value,
        }));

        // Əgər error varsa dəyişəndə sil
        setErrors((previous) => {
            const next = {
                ...previous,
            };

            delete next[`form__${field.key}`];

            return next;
        });
    };


    // =========================================================
    // 11. Validation
    // =========================================================

    const validate = () => {
        const nextErrors = {};

        // -------------------------------------------------------
        // Applicant
        // -------------------------------------------------------

        if (!applicant.applicant_name) {
            nextErrors.applicant_name = "Tələb olunur";
        }

        if (!applicant.voen) {
            nextErrors.voen = "Tələb olunur";
        }

        // -------------------------------------------------------
        // Form fields
        // -------------------------------------------------------

        if (schema?.form_fields) {
            schema.form_fields.forEach((field) => {

                if (!field.required) {
                    return;
                }

                const value = formValues[field.key];

                // readonly/value və auto field-lər də
                // öz value-ları ilə validation-dan keçir.
                if (value === undefined || value === null || String(value).trim() === "") {
                    nextErrors[`form__${field.key}`] = "Tələb olunur";
                }
            });
        }

        // -------------------------------------------------------
        // Files
        // -------------------------------------------------------

        if (!isConfidential && schema?.file_fields) {
            schema.file_fields.forEach((field) => {

                if (field.required && !files[field.key]) {
                    nextErrors[`file__${field.key}`] = true;
                }
            });
        }

        setErrors(nextErrors);

        // -------------------------------------------------------
        // Hansı accordion açılsın?
        // -------------------------------------------------------

        if (nextErrors.applicant_name || nextErrors.voen) {
            setExpanded("applicant");
        } else if (Object.keys(nextErrors)
            .some((key) => key.startsWith("form__"))) {
            setExpanded("anket");
        } else if (Object.keys(nextErrors)
            .some((key) => key.startsWith("file__"))) {
            setExpanded("files");
        }

        return (Object.keys(nextErrors).length === 0);
    };


    // =========================================================
    // 12. Submit
    // =========================================================

    const handleSubmit = async () => {

        if (!validate()) {
            enqueueSnackbar("Zəhmət olmasa bütün tələb olunan sahələri doldurun.", {
                variant: "warning",
            });

            return;
        }

        setSubmitting(true);

        try {
            const fd = new FormData();

            // -------------------------------------------------
            // Document type
            // -------------------------------------------------

            fd.append("doc_type", DOC_TYPE);

            // -------------------------------------------------
            // Confidential
            // -------------------------------------------------

            fd.append("is_confidential", isConfidential ? "true" : "false");

            // -------------------------------------------------
            // Applicant
            // -------------------------------------------------

            fd.append("applicant_name", applicant.applicant_name);

            fd.append("voen", applicant.voen);

            if (applicant.organization) {
                fd.append("organization", applicant.organization);
            }

            if (applicant.authorized_person) {
                fd.append("authorized_person", applicant.authorized_person);
            }

            fd.append("fin_kod", applicant.fin_kod || "");

            fd.append("department", applicant.department || "");

            fd.append("position", applicant.position || "");

            fd.append("phone", applicant.phone || "");

            fd.append("email", applicant.email || "");

            // -------------------------------------------------
            // Form data
            //
            // Burada readonly sahələr də göndərilir:
            //
            // {
            //    muddet: "Müddətsiz",
            //    istinad_maddesi: "292 nömrəli Fərman"
            // }
            // -------------------------------------------------

            fd.append("form_data", JSON.stringify(formValues));

            // -------------------------------------------------
            // Files
            // -------------------------------------------------

            Object.entries(files).forEach(([key, file]) => {

                if (file) {
                    fd.append(`file__${key}`, file);
                }
            });

            // -------------------------------------------------
            // API
            // -------------------------------------------------

            await service_api.post(NEXT_API_ENDPOINTS.LICENSES.PERMIT_CREATE, fd, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });

            enqueueSnackbar("Xüsusi satış icazə sənədi yoxlamaya göndərildi.", {
                variant: "success",
            });

            router.push(APP_ROUTES.XUSUSI_SATIS);

        } catch (e) {

            enqueueSnackbar(handleError(e), {
                variant: "error",
            });

        } finally {
            setSubmitting(false);
        }
    };


    // =========================================================
    // Loading
    // =========================================================

    if (loadingSchema) {
        return (<AppShell>
                <Box
                    sx={{
                        display: "flex", justifyContent: "center", py: 10,
                    }}
                >
                    <CircularProgress size={26}/>
                </Box>
            </AppShell>);
    }


    // =========================================================
    // Render
    // =========================================================

    return (<AppShell>

            <Box
                sx={{
                    maxWidth: "90%", mx: "auto", px: {
                        xs: 2, md: 4,
                    }, py: {
                        xs: 4, md: 6,
                    },
                }}
            >

                {/* =================================================
                    Breadcrumb
                ================================================= */}

                <Typography
                    sx={{
                        fontSize: 12.5, color: GOV.textMuted, mb: 3,
                    }}
                >

                    <Link
                        component="button"
                        onClick={() => router.push(APP_ROUTES.HOME)}
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, textDecoration: "none",
                        }}
                    >
                        Ana səhifə
                    </Link>

                    {" / "}

                    <Link
                        component="button"
                        onClick={() => router.push(APP_ROUTES.XUSUSI_SATIS)}
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, textDecoration: "none",
                        }}
                    >
                        Xüsusi satış icazə sənədi
                    </Link>

                    {" / "}

                    <span
                        style={{
                            fontWeight: 700, color: GOV.textPrimary,
                        }}
                    >
                        Yeni icazə sənədi
                    </span>

                </Typography>


                {/* =================================================
                    Title
                ================================================= */}

                <Typography
                    sx={{
                        fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mb: 0.5,
                    }}
                >
                    Xüsusi satış icazə sənədi yarat
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


                {/* =================================================
                    Confidential
                ================================================= */}

                <Box
                    sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.25,
                        backgroundColor: "#FCF6E8",
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
                        sx={{
                            m: 0,
                        }}
                        control={<Checkbox
                            checked={isConfidential}
                            onChange={(event) => setIsConfidential(event.target.checked)}
                            sx={{
                                color: GOV.goldDark,

                                "&.Mui-checked": {
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
                                {isConfidential ? "Məxfi lisenziyalarda sənəd yükləmə mərhələsi könüllüdür." : "İşarələnməzsə, açıq lisenziya hesab olunur və sənəd yükləmə mərhələsi məcburidir."}
                            </Typography>

                        </Box>}
                    />

                </Box>


                {/* =================================================
                    Accordions
                ================================================= */}

                <Box sx={{mb: 3}}>

                    {/* =================================================
                        1. Applicant
                    ================================================= */}

                    <GovAccordionSection
                        title="1. Müraciətçi məlumatları"
                        expanded={expanded === "applicant"}
                        onChange={toggle("applicant")}
                        complete={applicantComplete}
                    >

                        <Typography
                            sx={{
                                fontSize: 11.5, color: GOV.textMuted, mb: 2,
                            }}
                        >
                            {isMsn ? "Müdafiə Sənayesi Nazirliyi istifadəçisi olduğunuz üçün bütün sahələr sərbəst redaktə olunur." : "Təşkilat və VÖEN məlumatları öz təşkilatınıza əsasən avtomatik doldurulub. Səlahiyyətli şəxsi siyahıdan seçə bilərsiniz, digər sahələr seçiminə görə avtomatik dolur və redaktə edilə bilmir."}
                        </Typography>


                        <Box
                            sx={{
                                display: "grid", gap: 2, gridTemplateColumns: {
                                    xs: "1fr", sm: "1fr 1fr",
                                },
                            }}
                        >

                            {/* Organization */}

                            <TextField
                                size="small"
                                label="Müraciətçi müəssisənin tam adı"
                                required
                                value={applicant.applicant_name}
                                onChange={(event) => setApplicant((prev) => ({
                                    ...prev, applicant_name: event.target.value,
                                }))}
                                error={!!errors.applicant_name}
                                helperText={errors.applicant_name}
                                disabled={!isMsn}
                            />


                            {/* VOEN */}

                            <TextField
                                size="small"
                                label="VÖEN"
                                required
                                value={applicant.voen}
                                onChange={(event) => setApplicant((prev) => ({
                                    ...prev, voen: event.target.value,
                                }))}
                                error={!!errors.voen}
                                helperText={errors.voen}
                                disabled={!isMsn}
                            />


                            {/* Authorized person */}

                            <TextField
                                select
                                size="small"
                                label="Səlahiyyətli şəxs"
                                value={applicant.authorized_person}
                                onChange={(event) => handlePersonChange(event.target.value)}
                            >

                                {persons.map((person) => (<MenuItem
                                        key={person.id}
                                        value={person.id}
                                    >
                                        {person.full_name}

                                        {person.person_type === "main" ? " (Əsas)" : ""}
                                    </MenuItem>))}

                                {persons.length === 0 && (<MenuItem
                                        disabled
                                        value=""
                                    >
                                        Səlahiyyətli şəxs tapılmadı
                                    </MenuItem>)}

                            </TextField>


                            {/* FIN */}

                            <TextField
                                size="small"
                                label="FİN kod"
                                value={applicant.fin_kod}
                                onChange={(event) => setApplicant((prev) => ({
                                    ...prev, fin_kod: event.target.value,
                                }))}
                                disabled={!isMsn}
                            />


                            {/* Phone */}

                            <TextField
                                size="small"
                                label="Telefon nömrəsi"
                                value={applicant.phone}
                                onChange={(event) => setApplicant((prev) => ({
                                    ...prev, phone: event.target.value,
                                }))}
                                disabled={!isMsn}
                            />


                            {/* Email */}

                            <TextField
                                size="small"
                                label="Elektron poçt ünvanı"
                                value={applicant.email}
                                onChange={(event) => setApplicant((prev) => ({
                                    ...prev, email: event.target.value,
                                }))}
                                disabled={!isMsn}
                            />


                            {/* Department */}

                            <TextField
                                size="small"
                                label="Departament/Şöbə"
                                value={applicant.department}
                                onChange={(event) => setApplicant((prev) => ({
                                    ...prev, department: event.target.value,
                                }))}
                                disabled={!isMsn}
                            />


                            {/* Position */}

                            <TextField
                                size="small"
                                label="Vəzifə"
                                value={applicant.position}
                                onChange={(event) => setApplicant((prev) => ({
                                    ...prev, position: event.target.value,
                                }))}
                                disabled={!isMsn}
                            />

                        </Box>

                    </GovAccordionSection>


                    {/* =================================================
                        2. Dynamic schema form
                    ================================================= */}

                    <GovAccordionSection
                        title="2. Lisenziya anketi"
                        expanded={expanded === "anket"}
                        onChange={toggle("anket")}
                        complete={anketComplete}
                    >

                        <Typography
                            sx={{
                                fontSize: 11.5, color: GOV.textMuted, mb: 2.5,
                            }}
                        >
                            Schema üzrə tələb olunan sahələri doldurun.
                        </Typography>


                        <Box
                            sx={{
                                display: "grid", gap: 2, gridTemplateColumns: {
                                    xs: "1fr", sm: "1fr 1fr",
                                },
                            }}
                        >

                            {(schema?.form_fields || []).map((field, index) => {

                                // -------------------------------------------------
                                // Field state
                                // -------------------------------------------------

                                const readonly = isFieldReadonly(field);

                                const auto = isFieldAuto(field);

                                const value = formValues[field.key] ?? "";

                                // -------------------------------------------------
                                // Auto field disabled olur.
                                //
                                // Readonly field isə disabled OLMUR.
                                // Beləliklə "Müddətsiz" boz disabled
                                // görünüşündə deyil, normal görünür.
                                // -------------------------------------------------

                                const disabled = auto;

                                // -------------------------------------------------
                                // Select
                                // -------------------------------------------------

                                const isSelect = field.type === "select";

                                // -------------------------------------------------
                                // Input type
                                // -------------------------------------------------

                                let inputType = "text";

                                if (field.type === "date") {
                                    inputType = "date";
                                } else if (field.type === "number") {
                                    inputType = "number";
                                }

                                return (<TextField
                                        key={field.key}

                                        size="small"

                                        select={isSelect}

                                        type={inputType}

                                        label={`${String(index + 1).padStart(2, "0")}. ${field.label}`}

                                        required={field.required}

                                        disabled={disabled}

                                        value={value}

                                        onChange={(event) => handleFormFieldChange(field, event.target.value)}

                                        error={!!errors[`form__${field.key}`]}

                                        helperText={errors[`form__${field.key}`]}

                                        InputLabelProps={field.type === "date" ? {
                                            shrink: true,
                                        } : undefined}

                                        InputProps={readonly ? {
                                            readOnly: true,
                                        } : undefined}

                                        sx={readonly ? {
                                            "& .MuiInputBase-input": {
                                                cursor: "default",
                                            },
                                        } : undefined}
                                    >

                                        {/* =================================================
                                            Select options
                                        ================================================= */}

                                        {isSelect && (field.options || []).map((option) => {

                                            // -----------------------------------------
                                            // Schema-dakı options:
                                            //
                                            // [
                                            //   ["daxili_satis", "Daxili satış"],
                                            //   ["idxal", "İdxal"],
                                            // ]
                                            // -----------------------------------------

                                            const [optionValue, optionLabel,] = option;

                                            return (<MenuItem
                                                    key={optionValue}
                                                    value={optionValue}
                                                >
                                                    {optionLabel}
                                                </MenuItem>);
                                        })}

                                    </TextField>);
                            })}

                        </Box>

                    </GovAccordionSection>


                    {/* =================================================
                        3. Files
                    ================================================= */}

                    <GovAccordionSection
                        title="3. Sənəd yüklə"
                        expanded={expanded === "files"}
                        onChange={toggle("files")}
                        complete={filesComplete}
                        optional={isConfidential}
                    >

                        <Typography
                            sx={{
                                fontSize: 11.5, color: GOV.textMuted, mb: 2.5,
                            }}
                        >
                            {isConfidential ? "Məxfi lisenziya seçildiyi üçün bu bölmə könüllüdür. Sənədləri əlavə kanalla təqdim edə bilərsiniz." : "Dəstəklənən formatlar: PDF, JPG, PNG"}
                        </Typography>


                        <Box
                            sx={{
                                display: "grid", gap: 2.5, gridTemplateColumns: {
                                    xs: "1fr", sm: "1fr 1fr",
                                },
                            }}
                        >

                            {(schema?.file_fields || []).map((field) => (

                                <FileDropField
                                    key={field.key}

                                    field={isConfidential ? {
                                        ...field, required: false,
                                    } : field}

                                    file={files[field.key]}

                                    error={!!errors[`file__${field.key}`]}

                                    onChange={(file) => setFiles((previous) => ({
                                        ...previous, [field.key]: file,
                                    }))}
                                />

                            ))}

                        </Box>

                    </GovAccordionSection>

                </Box>


                {/* =================================================
                    Buttons
                ================================================= */}

                <Box
                    sx={{
                        display: "flex", justifyContent: "flex-end", gap: 1.5,
                    }}
                >

                    <Button
                        onClick={() => router.push(APP_ROUTES.XUSUSI_SATIS)}
                        disabled={submitting}
                        sx={{
                            textTransform: "none", fontWeight: 600, fontSize: 13, color: GOV.textMuted,
                        }}
                    >
                        Ləğv et
                    </Button>


                    <Button
                        variant="contained"
                        onClick={handleSubmit}
                        disabled={submitting}
                        sx={{
                            backgroundColor: GOV.navy,

                            textTransform: "none",

                            fontWeight: 700,

                            fontSize: 13,

                            "&:hover": {
                                backgroundColor: GOV.navyMid,
                            },
                        }}
                    >
                        {submitting ? "Göndərilir..." : "Yoxlamağa göndər"}
                    </Button>

                </Box>

            </Box>

        </AppShell>);
}
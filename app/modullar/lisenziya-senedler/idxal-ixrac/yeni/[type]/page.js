"use client"
import React, {useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import {useRouter, useParams} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import FileDropField from "@/components/atoms/licenses/FileDropField";

const TYPE_META = {
    ixrac: {title: 'İxrac icazə sənədi yarat'},
    idxal: {title: 'İdxal icazə sənədi yarat'},
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

    const [applicant, setApplicant] = useState({
        organization: null, applicant_name: '', voen: '',
        authorized_person: '', fin_kod: '', department: '', position: '',
        phone: '', email: '',
    });

    const [mode, setMode] = useState('file'); // 'file' | 'form'
    const [files, setFiles] = useState({});
    const [formValues, setFormValues] = useState({});

    useEffect(() => {
        (async () => {
            setLoadingSchema(true);
            try {
                const [schemaRes, applicantRes] = await Promise.all([
                    service_api.get(`${NEXT_API_ENDPOINTS.LICENSES.PERMIT_SCHEMA}?doc_type=${docType}`),
                    service_api.get(NEXT_API_ENDPOINTS.LICENSES.APPLICANT_INFO),
                ]);
                setSchema(schemaRes.data);

                const org = applicantRes.data?.organization;
                const personList = applicantRes.data?.authorized_persons || [];
                setPersons(personList);
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
            } catch (e) {
                enqueueSnackbar(handleError(e), {variant: 'error'});
            } finally {
                setLoadingSchema(false);
            }
        })();
    }, [docType]);

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

    const breadcrumbTitle = useMemo(() => TYPE_META[docType].title, [docType]);

    const validate = () => {
        const next = {};
        if (!applicant.applicant_name) next.applicant_name = 'Tələb olunur';
        if (!applicant.voen) next.voen = 'Tələb olunur';

        if (mode === 'file' && schema) {
            schema.file_fields.forEach((f) => {
                if (f.required && !files[f.key]) next[`file__${f.key}`] = true;
            });
        }
        if (mode === 'form' && schema) {
            schema.form_fields.forEach((f) => {
                if (f.required && !f.auto && !formValues[f.key]) next[`form__${f.key}`] = 'Tələb olunur';
            });
        }
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            enqueueSnackbar('Zəhmət olmasa bütün tələb olunan sahələri doldurun.', {variant: 'warning'});
            return;
        }

        setSubmitting(true);
        try {
            if (mode === 'file') {
                const fd = new FormData();
                fd.append('doc_type', docType);
                fd.append('submission_mode', 'file');
                fd.append('applicant_name', applicant.applicant_name);
                fd.append('voen', applicant.voen);
                if (applicant.organization) fd.append('organization', applicant.organization);
                if (applicant.authorized_person) fd.append('authorized_person', applicant.authorized_person);
                fd.append('fin_kod', applicant.fin_kod);
                fd.append('department', applicant.department);
                fd.append('position', applicant.position);
                fd.append('phone', applicant.phone);
                fd.append('email', applicant.email);
                Object.entries(files).forEach(([key, file]) => {
                    if (file) fd.append(`file__${key}`, file);
                });
                await service_api.post(NEXT_API_ENDPOINTS.LICENSES.PERMIT_CREATE, fd, {
                    headers: {'Content-Type': 'multipart/form-data'},
                });
            } else {
                await service_api.post(NEXT_API_ENDPOINTS.LICENSES.PERMIT_CREATE, {
                    doc_type: docType,
                    submission_mode: 'form',
                    applicant_name: applicant.applicant_name,
                    voen: applicant.voen,
                    organization: applicant.organization,
                    authorized_person: applicant.authorized_person || null,
                    fin_kod: applicant.fin_kod,
                    department: applicant.department,
                    position: applicant.position,
                    phone: applicant.phone,
                    email: applicant.email,
                    form_data: formValues,
                });
            }
            enqueueSnackbar('İcazə sənədi yoxlamaya göndərildi.', {variant: 'success'});
            router.push(APP_ROUTES.IDXAL_IXRAC);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSubmitting(false);
        }
    };

    if (loadingSchema) {
        return (
            <AppShell>
                <Box sx={{display: 'flex', justifyContent: 'center', py: 10}}>
                    <CircularProgress size={26}/>
                </Box>
            </AppShell>
        );
    }

    return (
        <AppShell>
            <Box sx={{maxWidth: 1080, mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Ana səhifə
                    </Link>
                    {' / '}
                    <Link component="button" onClick={() => router.push(APP_ROUTES.IDXAL_IXRAC)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Lisenziyalar
                    </Link>
                    {' / '}
                    <Link component="button" onClick={() => router.push(APP_ROUTES.IDXAL_IXRAC)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        İdxal/İxrac əməliyyatlarına aid icazə sənədi
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Yeni icazə sənədi</span>
                </Typography>

                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mb: 0.5}}>
                    {breadcrumbTitle}
                </Typography>
                <Typography sx={{fontSize: 13, color: GOV.textMuted, mb: 3}}>
                    İcazə sənədini yükləyin və ya məlumatları manual sürət formasıyla doldurun.
                </Typography>

                {/* Step 1 - Müraciətçi məlumatları */}
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, backgroundColor: '#EEF1F7',
                    border: `1px solid ${GOV.cardBorder}`, borderRadius: '8px 8px 0 0', px: 2.5, py: 1.75,
                }}>
                    <Box sx={{
                        width: 26, height: 26, borderRadius: 1, backgroundColor: GOV.navySoft,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <PersonOutlineIcon sx={{fontSize: 15, color: GOV.gold}}/>
                    </Box>
                    <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>
                        Müraciətçi məlumatları
                    </Typography>
                </Box>

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderTop: 'none', borderRadius: '0 0 8px 8px', p: 3, mb: 3}}>
                    <Typography sx={{fontSize: 14, fontWeight: 700, color: GOV.textPrimary, mb: 2}}>
                        Müraciətçi məlumatları
                    </Typography>
                    <Box sx={{display: 'grid', gap: 2, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}}}>
                        <TextField
                            size="small" label="Müraciətçi müəssisənin tam adı" required
                            value={applicant.applicant_name}
                            onChange={(e) => setApplicant((p) => ({...p, applicant_name: e.target.value}))}
                            error={!!errors.applicant_name} helperText={errors.applicant_name}
                        />
                        <TextField
                            size="small" label="VÖEN" required
                            value={applicant.voen}
                            onChange={(e) => setApplicant((p) => ({...p, voen: e.target.value}))}
                            error={!!errors.voen} helperText={errors.voen}
                        />
                        <TextField
                            select size="small" label="Səlahiyyətli şəxs"
                            value={applicant.authorized_person}
                            onChange={(e) => handlePersonChange(e.target.value)}
                        >
                            {persons.map((p) => (
                                <MenuItem key={p.id} value={p.id}>{p.full_name}</MenuItem>
                            ))}
                            {persons.length === 0 && (
                                <MenuItem disabled value="">Səlahiyyətli şəxs tapılmadı</MenuItem>
                            )}
                        </TextField>
                        <TextField
                            size="small" label="FİN kod"
                            value={applicant.fin_kod}
                            onChange={(e) => setApplicant((p) => ({...p, fin_kod: e.target.value}))}
                        />
                        <TextField
                            size="small" label="Telefon nömrəsi"
                            value={applicant.phone}
                            onChange={(e) => setApplicant((p) => ({...p, phone: e.target.value}))}
                        />
                        <TextField
                            size="small" label="Elektron poçt ünvanı"
                            value={applicant.email}
                            onChange={(e) => setApplicant((p) => ({...p, email: e.target.value}))}
                        />
                        <TextField
                            size="small" label="Departament/Şöbə"
                            value={applicant.department}
                            onChange={(e) => setApplicant((p) => ({...p, department: e.target.value}))}
                        />
                        <TextField
                            size="small" label="Vəzifə"
                            value={applicant.position}
                            onChange={(e) => setApplicant((p) => ({...p, position: e.target.value}))}
                        />
                    </Box>
                </Box>

                {/* Step 2 - Sənəd yükləmə / Elektron müraciət forması */}
                <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, backgroundColor: '#EEF1F7',
                    border: `1px solid ${GOV.cardBorder}`, borderRadius: '8px 8px 0 0', px: 2.5, py: 1.75,
                }}>
                    <Box sx={{
                        width: 26, height: 26, borderRadius: 1, backgroundColor: GOV.navySoft,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <DescriptionOutlinedIcon sx={{fontSize: 15, color: GOV.gold}}/>
                    </Box>
                    <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>
                        Sənəd yüklə
                    </Typography>
                </Box>

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderTop: 'none', borderRadius: '0 0 8px 8px', overflow: 'hidden'}}>
                    <Box sx={{display: 'flex', borderBottom: `1px solid ${GOV.cardBorder}`}}>
                        <Box
                            onClick={() => setMode('file')}
                            sx={{
                                flex: 1, display: 'flex', alignItems: 'center', gap: 1.25, px: 2.5, py: 1.75,
                                cursor: 'pointer', backgroundColor: mode === 'file' ? '#fff' : '#EEF1F7',
                                borderRight: `1px solid ${GOV.cardBorder}`,
                            }}
                        >
                            <Box sx={{
                                width: 26, height: 26, borderRadius: 1, backgroundColor: GOV.navySoft,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <UploadFileIcon sx={{fontSize: 15, color: GOV.gold}}/>
                            </Box>
                            <Typography sx={{fontSize: 13, fontWeight: 700, color: GOV.textPrimary}}>
                                Fayl yüklə
                            </Typography>
                        </Box>
                        <Box
                            onClick={() => setMode('form')}
                            sx={{
                                flex: 1, display: 'flex', alignItems: 'center', gap: 1.25, px: 2.5, py: 1.75,
                                cursor: 'pointer', backgroundColor: mode === 'form' ? '#fff' : '#EEF1F7',
                            }}
                        >
                            <Box sx={{
                                width: 26, height: 26, borderRadius: 1, backgroundColor: GOV.navySoft,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <DescriptionOutlinedIcon sx={{fontSize: 15, color: GOV.gold}}/>
                            </Box>
                            <Typography sx={{fontSize: 13, fontWeight: 700, color: GOV.textPrimary}}>
                                Elektron müraciət forması
                            </Typography>
                        </Box>
                    </Box>

                    <Box sx={{p: 3}}>
                        {mode === 'file' ? (
                            <>
                                <Typography sx={{fontSize: 14, fontWeight: 700, color: GOV.textPrimary}}>
                                    Sənəd yüklə
                                </Typography>
                                <Typography sx={{fontSize: 11.5, color: GOV.textMuted, mb: 2.5}}>
                                    Dəstəklənən formatlar: PDF, JPG, PNG
                                </Typography>
                                <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}}}>
                                    {schema.file_fields.map((f) => (
                                        <FileDropField
                                            key={f.key} field={f} file={files[f.key]}
                                            error={!!errors[`file__${f.key}`]}
                                            onChange={(file) => setFiles((prev) => ({...prev, [f.key]: file}))}
                                        />
                                    ))}
                                </Box>
                            </>
                        ) : (
                            <>
                                <Typography sx={{fontSize: 14, fontWeight: 700, color: GOV.textPrimary}}>
                                    Lisenziya anketi
                                </Typography>
                                <Typography sx={{fontSize: 11.5, color: GOV.textMuted, mb: 2.5}}>
                                    Bütün sahələri doldurub yadda saxlayın.
                                </Typography>
                                <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}}}>
                                    {schema.form_fields.map((f, idx) => (
                                        <TextField
                                            key={f.key}
                                            size="small"
                                            select={f.type === 'select'}
                                            type={f.type === 'date' ? 'date' : (f.type === 'number' ? 'number' : 'text')}
                                            label={`${String(idx + 1).padStart(2, '0')}. ${f.label}`}
                                            required={f.required}
                                            disabled={!!f.auto}
                                            value={formValues[f.key] ?? ''}
                                            onChange={(e) => setFormValues((prev) => ({...prev, [f.key]: e.target.value}))}
                                            error={!!errors[`form__${f.key}`]}
                                            helperText={errors[`form__${f.key}`]}
                                            InputLabelProps={f.type === 'date' ? {shrink: true} : undefined}
                                        >
                                            {f.type === 'select' && (f.options || []).map(([val, label]) => (
                                                <MenuItem key={val} value={val}>{label}</MenuItem>
                                            ))}
                                        </TextField>
                                    ))}
                                </Box>
                            </>
                        )}

                        <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 4, borderTop: `1px solid ${GOV.cardBorder}`, pt: 3}}>
                            <Button
                                onClick={() => router.push(APP_ROUTES.IDXAL_IXRAC)} disabled={submitting}
                                sx={{textTransform: 'none', fontWeight: 600, fontSize: 13, color: GOV.textMuted}}
                            >
                                Ləğv et
                            </Button>
                            <Button
                                variant="contained" onClick={handleSubmit} disabled={submitting}
                                sx={{
                                    backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13,
                                    '&:hover': {backgroundColor: GOV.navyMid},
                                }}
                            >
                                {submitting ? 'Göndərilir...' : 'Yoxlamağa göndər'}
                            </Button>
                        </Box>
                    </Box>
                </Box>
            </Box>
        </AppShell>
    );
}
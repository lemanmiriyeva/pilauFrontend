"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import {GOV} from "@/components/theme/govColors";
import GovAccordionSection from "@/components/atoms/organizations/GovAccordionSection";

const CODE_OPTIONS = [
    {value: 'other', label: 'Digər'},
    {value: 'msn', label: 'Müdafiə Sənayesi Nazirliyi (MSN)'},
];

const PERSON_TYPE_OPTIONS = [
    {value: 'main', label: 'Əsas'},
    {value: 'other', label: 'Digər'},
];

const emptyPerson = (isFirst) => ({
    person_type: isFirst ? 'main' : 'other',
    full_name: '', fin_kod: '', department: '', position: '', email: '', phone: '',
});

export default function OrganizationForm({mode = 'create', initialData, onSubmit, onCancel, submitting}) {
    const [form, setForm] = useState({
        full_name: '', voen: '', state_reg_number: '', code: 'other',
        email: '', phone: '', address: '', notes: '',
        ...(initialData || {}),
    });
    const [persons, setPersons] = useState(
        initialData?.authorized_persons?.length ? initialData.authorized_persons : [emptyPerson(true)]
    );
    const [expanded, setExpanded] = useState('identification');
    const [errors, setErrors] = useState({});

    const set = (field) => (e) => setForm((f) => ({...f, [field]: e.target.value}));

    const setPerson = (idx, field) => (e) => {
        setPersons((prev) => prev.map((p, i) => (i === idx ? {...p, [field]: e.target.value} : p)));
    };

    const addPerson = () => setPersons((prev) => [emptyPerson(prev.length === 0), ...prev]);
    const removePerson = (idx) => setPersons((prev) => prev.filter((_, i) => i !== idx));

    const toggle = (panel) => (e, isExpanded) => setExpanded(isExpanded ? panel : false);

    const validate = () => {
        const next = {};
        if (!form.full_name) next.full_name = 'Tələb olunur';
        if (!form.voen) next.voen = 'Tələb olunur';
        setErrors(next);
        if (Object.keys(next).length) setExpanded('identification');
        return Object.keys(next).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit({
            ...form,
            authorized_persons: persons.filter((p) => p.full_name?.trim()),
        });
    };

    return (
        <Box>
            <Box sx={{mb: 3}}>
                <GovAccordionSection
                    title="İdentifikasiya (eyniləşdirmə)"
                    expanded={expanded === 'identification'} onChange={toggle('identification')}
                    complete={!!(form.full_name && form.voen)}
                >
                    <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr 1fr'}}}>
                        <TextField
                            size="small" label="Tam adı" placeholder="Daxil edin" required
                            value={form.full_name} onChange={set('full_name')}
                            error={!!errors.full_name} helperText={errors.full_name}
                        />
                        <TextField
                            size="small" label="VÖEN" placeholder="123456789" required
                            value={form.voen} onChange={set('voen')}
                            error={!!errors.voen} helperText={errors.voen}
                        />
                        <TextField
                            size="small" label="Dövlət qeydiyyat nömrəsi" placeholder="Daxil edin"
                            value={form.state_reg_number} onChange={set('state_reg_number')}
                        />
                        <TextField
                            select size="small" label="Kod" value={form.code || 'other'} onChange={set('code')}
                            helperText="MSN seçilərsə, bu təşkilatın istifadəçiləri icazə sənədi formasında müraciətçi məlumatlarını sərbəst redaktə edə bilər."
                        >
                            {CODE_OPTIONS.map((o) => (
                                <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                            ))}
                        </TextField>
                    </Box>
                </GovAccordionSection>

                <GovAccordionSection
                    title="Əlaqə məlumatları"
                    expanded={expanded === 'contact'} onChange={toggle('contact')}
                    complete={!!(form.email && form.phone)}
                >
                    <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr 1fr'}}}>
                        <TextField
                            size="small" label="Əsas elektron poçt ünvanı" placeholder="Daxil edin"
                            value={form.email} onChange={set('email')}
                        />
                        <TextField
                            size="small" label="Əsas telefon nömrəsi" placeholder="Daxil edin"
                            value={form.phone} onChange={set('phone')}
                        />
                        <TextField
                            size="small" label="Tam ünvan" placeholder="Daxil edin"
                            value={form.address} onChange={set('address')}
                        />
                    </Box>
                </GovAccordionSection>

                <GovAccordionSection
                    title="Səlahiyyətli şəxs"
                    expanded={expanded === 'persons'} onChange={toggle('persons')}
                    complete={persons.some((p) => p.full_name?.trim())}
                >
                    <Box sx={{display: 'grid', gap: 2}}>
                        {persons.map((p, idx) => (
                            <Box key={idx} sx={{display: 'flex', gap: 1.5, alignItems: 'flex-start'}}>
                                <Box sx={{
                                    flexGrow: 1, display: 'grid', gap: 1.5,
                                    gridTemplateColumns: {xs: '1fr 1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)'},
                                }}>
                                    <TextField
                                        select size="small" label="Növ"
                                        value={p.person_type || 'other'} onChange={setPerson(idx, 'person_type')}
                                    >
                                        {PERSON_TYPE_OPTIONS.map((o) => (
                                            <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                                        ))}
                                    </TextField>
                                    <TextField size="small" label="Tam adı" placeholder="Daxil edin"
                                               value={p.full_name} onChange={setPerson(idx, 'full_name')}/>
                                    <TextField size="small" label="FİN kod" placeholder="Daxil edin"
                                               value={p.fin_kod} onChange={setPerson(idx, 'fin_kod')}/>
                                    <TextField size="small" label="Departament/Şöbə" placeholder="Daxil edin"
                                               value={p.department} onChange={setPerson(idx, 'department')}/>
                                    <TextField size="small" label="Vəzifə" placeholder="Daxil edin"
                                               value={p.position} onChange={setPerson(idx, 'position')}/>
                                    <TextField size="small" label="Elektron poçt ünvanı" placeholder="Daxil edin"
                                               value={p.email} onChange={setPerson(idx, 'email')}/>
                                    <TextField size="small" label="Əlaqə nömrəsi" placeholder="Daxil edin"
                                               value={p.phone} onChange={setPerson(idx, 'phone')}/>
                                </Box>
                                <Box sx={{display: 'flex', pt: 0.5}}>
                                    {idx === 0 ? (
                                        <IconButton size="small" onClick={addPerson}>
                                            <AddCircleOutlineIcon sx={{fontSize: 20, color: GOV.navySoft}}/>
                                        </IconButton>
                                    ) : (
                                        <IconButton size="small" onClick={() => removePerson(idx)}>
                                            <RemoveCircleOutlineIcon sx={{fontSize: 20, color: GOV.textMuted}}/>
                                        </IconButton>
                                    )}
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </GovAccordionSection>

                <GovAccordionSection
                    title="Əlavə məlumatlar"
                    expanded={expanded === 'notes'} onChange={toggle('notes')}
                    optional
                >
                    <TextField
                        fullWidth multiline minRows={3} placeholder="Daxil edin"
                        value={form.notes} onChange={set('notes')}
                    />
                </GovAccordionSection>
            </Box>

            <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1.5}}>
                <Button
                    onClick={onCancel} disabled={submitting}
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
                    {submitting ? 'Göndərilir...' : (mode === 'create' ? 'Yarat' : 'Yadda saxla')}
                </Button>
            </Box>
        </Box>
    );
}
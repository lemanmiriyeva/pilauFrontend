"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
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

// Başlanğıc üçün 1 departament və içində 1 boş vəzifə
const defaultDepartments = [
    {
        name: '',
        positions: ['']
    }
];

export default function OrganizationForm({mode = 'create', initialData, onSubmit, onCancel, submitting}) {
    const [form, setForm] = useState({
        full_name: '', voen: '', state_reg_number: '', code: 'other',
        email: '', phone: '', address: '', notes: '',
        ...(initialData || {}),
    });

    // Departamentlər və onların daxilindəki vəzifələr (struktur)
    const [departments, setDepartments] = useState(
        initialData?.departments?.length ? initialData.departments : defaultDepartments
    );

    const [persons, setPersons] = useState(
        initialData?.authorized_persons?.length ? initialData.authorized_persons : [emptyPerson(true)]
    );
    const [expanded, setExpanded] = useState('identification');
    const [errors, setErrors] = useState({});

    const set = (field) => (e) => setForm((f) => ({...f, [field]: e.target.value}));

    // Departament əlavə etmək
    const addDepartment = () => {
        setDepartments((prev) => [...prev, { name: '', positions: [''] }]);
    };

    // Departamentin adını dəyişmək
    const handleDepartmentNameChange = (deptIdx, value) => {
        setDepartments((prev) => prev.map((d, i) => (i === deptIdx ? {...d, name: value} : d)));
    };

    // Departamentləri silmək
    const removeDepartment = (deptIdx) => {
        setDepartments((prev) => prev.filter((_, i) => i !== deptIdx));
    };

    // Müəyyən departamentə vəzifə əlavə etmək
    const addPositionToDept = (deptIdx) => {
        setDepartments((prev) => prev.map((d, i) => {
            if (i === deptIdx) {
                return {...d, positions: [...d.positions, '']};
            }
            return d;
        }));
    };

    // Müəyyən departamentin vəzifəsini dəyişmək
    const handlePositionChange = (deptIdx, posIdx, value) => {
        setDepartments((prev) => prev.map((d, i) => {
            if (i === deptIdx) {
                const newPositions = [...d.positions];
                newPositions[posIdx] = value;
                return {...d, positions: newPositions};
            }
            return d;
        }));
    };

    // Müəyyən departamentdən vəzifəni silmək
    const removePositionFromDept = (deptIdx, posIdx) => {
        setDepartments((prev) => prev.map((d, i) => {
            if (i === deptIdx) {
                return {...d, positions: d.positions.filter((_, pIdx) => pIdx !== posIdx)};
            }
            return d;
        }));
    };

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

        // Boş department və ya position-ları təmizləyib göndərmək üçün
        const cleanedDepartments = departments
            .filter((d) => d.name?.trim())
            .map((d) => ({
                name: d.name.trim(),
                positions: d.positions.filter((p) => p?.trim())
            }));

        onSubmit({
            ...form,
            departments: cleanedDepartments,
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

                {/* Struktur: Hər departamentin daxilində bir neçə vəzifə */}
                <GovAccordionSection
                    title="Struktur (Departamentlər və vəzifələr)"
                    expanded={expanded === 'structure'} onChange={toggle('structure')}
                    complete={departments.some(d => d.name?.trim())}
                >
                    <Box sx={{display: 'flex', flexDirection: 'column', gap: 2.5}}>
                        <Box sx={{display: 'flex', justifyContent: 'flex-end'}}>
                            <Button
                                size="small"
                                startIcon={<AddCircleOutlineIcon />}
                                onClick={addDepartment}
                                sx={{textTransform: 'none', fontWeight: 600}}
                            >
                                Departament əlavə et
                            </Button>
                        </Box>

                        {departments.map((dept, deptIdx) => (
                            <Box
                                key={deptIdx}
                                sx={{
                                    p: 2.5,
                                    border: '1px solid #E5E7EB',
                                    borderRadius: 2,
                                    backgroundColor: '#F9FAFB',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: 2
                                }}
                            >
                                {/* Departament adı və silmə düyməsi */}
                                <Box sx={{display: 'flex', gap: 1.5, alignItems: 'center'}}>
                                    <TextField
                                        size="small"
                                        fullWidth
                                        required
                                        placeholder={`Departament ${deptIdx + 1} adı`}
                                        value={dept.name}
                                        onChange={(e) => handleDepartmentNameChange(deptIdx, e.target.value)}
                                    />
                                    <IconButton
                                        color="error"
                                        onClick={() => removeDepartment(deptIdx)}
                                        disabled={departments.length === 1}
                                        size="small"
                                    >
                                        <DeleteOutlineIcon />
                                    </IconButton>
                                </Box>

                                {/* Həmin departamentin içindəki vəzifələr */}
                                <Box sx={{pl: {xs: 0, sm: 3}, display: 'flex', flexDirection: 'column', gap: 1.5}}>
                                    <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                                        <Typography sx={{fontSize: 12, fontWeight: 700, color: GOV.textMuted}}>
                                            Vəzifələr
                                        </Typography>
                                        <Button
                                            size="small"
                                            startIcon={<AddCircleOutlineIcon />}
                                            onClick={() => addPositionToDept(deptIdx)}
                                            sx={{textTransform: 'none', fontSize: 12}}
                                        >
                                            Vəzifə əlavə et
                                        </Button>
                                    </Box>

                                    {dept.positions.map((pos, posIdx) => (
                                        <Box key={posIdx} sx={{display: 'flex', gap: 1, alignItems: 'center'}}>
                                            <TextField
                                                size="small"
                                                fullWidth
                                                placeholder={`Vəzifə ${posIdx + 1}`}
                                                value={pos}
                                                onChange={(e) => handlePositionChange(deptIdx, posIdx, e.target.value)}
                                            />
                                            <IconButton
                                                size="small"
                                                onClick={() => removePositionFromDept(deptIdx, posIdx)}
                                                disabled={dept.positions.length === 1}
                                            >
                                                <RemoveCircleOutlineIcon sx={{fontSize: 18, color: GOV.textMuted}}/>
                                            </IconButton>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        ))}
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
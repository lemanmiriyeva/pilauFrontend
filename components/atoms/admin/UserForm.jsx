"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {GOV} from "@/components/theme/govColors";
import OrganizationSelect from "@/components/atoms/admin/OrganizationSelect";
import ModulePermissionsPicker from "@/components/atoms/admin/ModulePermissionsPicker";

const PHONE_PREFIX = '+994 ';
const ID_CARD_SERIES = ['AZE', 'AA'];

const emptyForm = {
    first_name: '', last_name: '', username: '', email: '', phone: PHONE_PREFIX,
    organization: '', fin_kod: '', id_card_serial: '',
};

// FİN kodun vəsiqədə harada olduğunu göstərən sadə illüstrasiya (tooltip içində)
function FinKodIllustration() {
    return (
        <Box sx={{p: 1, maxWidth: 240}}>
            <svg width="220" height="132" viewBox="0 0 220 132" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="218" height="130" rx="10" fill="#F4F6FA" stroke="#C9D0DD" strokeWidth="2"/>
                <rect x="14" y="16" width="52" height="64" rx="4" fill="#DCE3EF" stroke="#B7C1D6"/>
                <circle cx="40" cy="38" r="11" fill="#B7C1D6"/>
                <path d="M22 74c0-10 8-16 18-16s18 6 18 16" fill="#B7C1D6"/>
                <rect x="78" y="20" width="120" height="8" rx="2" fill="#C9D0DD"/>
                <rect x="78" y="36" width="100" height="8" rx="2" fill="#C9D0DD"/>
                <rect x="78" y="52" width="110" height="8" rx="2" fill="#C9D0DD"/>
                <rect x="12" y="96" width="120" height="14" rx="3" fill="none" stroke="#D32F2F" strokeWidth="2"/>
                <rect x="12" y="96" width="60" height="14" rx="3" fill="#D32F2F"/>
                <text x="18" y="106" fontSize="9" fontWeight="700" fill="#FFFFFF" fontFamily="Arial, sans-serif">FİN KODU</text>
                <text x="78" y="106" fontSize="9" fontWeight="700" fill="#D32F2F" fontFamily="Arial, sans-serif">7XXXXXX</text>
            </svg>
            <Typography sx={{fontSize: 11.5, color: '#6B7280', mt: 0.75, lineHeight: 1.5}}>
                FİN kod şəxsiyyət vəsiqəsinin ön üzündə, şəklin sağında, "FİN KODU" başlığı
                altında yazılan 7 simvoldan ibarət koddur.
            </Typography>
        </Box>
    );
}

export default function UserForm({mode = 'create', initialData, initialModules = [], onSubmit, onCancel, submitting}) {
    const parseIdCard = (value) => {
        const found = ID_CARD_SERIES.find((s) => (value || '').toUpperCase().startsWith(s));
        return found
            ? {series: found, number: (value || '').slice(found.length)}
            : {series: ID_CARD_SERIES[1], number: value || ''};
    };

    const initialPhone = (initialData && initialData.phone) || PHONE_PREFIX;
    const initialParsedIdCard = parseIdCard((initialData && initialData.id_card_serial) || '');

    const [form, setForm] = useState({
        ...emptyForm, ...(initialData || {}), phone: initialPhone,
        id_card_serial: `${initialParsedIdCard.series}${initialParsedIdCard.number}`,
    });
    const [idCardSeries, setIdCardSeries] = useState(initialParsedIdCard.series);
    const [idCardNumber, setIdCardNumber] = useState(initialParsedIdCard.number);
    const [modules, setModules] = useState([]);
    const [errors, setErrors] = useState({});

    const set = (field) => (e) => setForm((f) => ({...f, [field]: e.target.value}));

    const handlePhoneChange = (e) => {
        let val = e.target.value;
        if (!val.startsWith('+994')) {
            val = PHONE_PREFIX;
        }
        setForm((f) => ({...f, phone: val}));
    };

    const handlePhoneFocus = () => {
        if (!form.phone) setForm((f) => ({...f, phone: PHONE_PREFIX}));
    };

    const updateIdCard = (series, number) => {
        setIdCardSeries(series);
        setIdCardNumber(number);
        setForm((f) => ({...f, id_card_serial: `${series}${number}`}));
    };

    const validate = () => {
        const next = {};
        if (!form.first_name) next.first_name = 'Tələb olunur';
        if (!form.last_name) next.last_name = 'Tələb olunur';
        if (mode === 'create' && !form.username) next.username = 'Tələb olunur';
        if (!form.email) next.email = 'Tələb olunur';
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit({...form, modules});
    };

    return (
        <Box>
            <Box sx={{display: 'grid', gap: 2.5, gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, mb: 3}}>
                <TextField
                    label="Ad" size="small" required value={form.first_name} onChange={set('first_name')}
                    error={!!errors.first_name} helperText={errors.first_name}
                />
                <TextField
                    label="Soyad" size="small" required value={form.last_name} onChange={set('last_name')}
                    error={!!errors.last_name} helperText={errors.last_name}
                />
                <TextField
                    label="İstifadəçi adı" size="small" required={mode === 'create'} disabled={mode === 'edit'}
                    value={form.username} onChange={set('username')}
                    error={!!errors.username} helperText={errors.username}
                />
                <TextField
                    label="E-poçt" size="small" required value={form.email} onChange={set('email')}
                    error={!!errors.email} helperText={errors.email}
                />
                <TextField
                    label="Telefon" size="small" placeholder="+994 __ ___ __ __"
                    value={form.phone} onChange={handlePhoneChange} onFocus={handlePhoneFocus}
                />
                <OrganizationSelect value={form.organization} onChange={(v) => setForm((f) => ({...f, organization: v}))}/>
                <TextField
                    label="FİN kod" size="small" value={form.fin_kod} onChange={set('fin_kod')}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <Tooltip title={<FinKodIllustration/>} arrow placement="top"
                                         componentsProps={{tooltip: {sx: {backgroundColor: '#FFFFFF', boxShadow: '0 8px 24px rgba(15,23,55,0.18)', border: `1px solid ${GOV.cardBorder}`}}}}>
                                    <InfoOutlinedIcon sx={{fontSize: 18, color: GOV.textMuted, cursor: 'help'}}/>
                                </Tooltip>
                            </InputAdornment>
                        ),
                    }}
                />
                <Box sx={{display: 'flex', gap: 1}}>
                    <Select
                        size="small" value={idCardSeries}
                        onChange={(e) => updateIdCard(e.target.value, idCardNumber)}
                        sx={{width: 96, flexShrink: 0}}
                    >
                        {ID_CARD_SERIES.map((s) => (
                            <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                    </Select>
                    <TextField
                        label="Şəxsiyyət vəsiqəsinin seriya nömrəsi" size="small" fullWidth
                        value={idCardNumber}
                        onChange={(e) => updateIdCard(idCardSeries, e.target.value.replace(/\D/g, ''))}
                    />
                </Box>
            </Box>

            <ModulePermissionsPicker initialModules={initialModules} onChange={setModules}/>

            <Box sx={{display: 'flex', justifyContent: 'flex-end', gap: 1.5, mt: 4}}>
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
                    {mode === 'create' ? 'İstifadəçini yarat' : 'Yadda saxla'}
                </Button>
            </Box>
        </Box>
    );
}
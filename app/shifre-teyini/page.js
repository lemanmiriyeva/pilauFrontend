"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AuthLayout from "@/app/daxilol/AuthLayout";

const STEP = {USERNAME: 'username', RESET: 'reset', DONE: 'done'};

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [step, setStep] = useState(STEP.USERNAME);
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleRequestCode = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.PASSWORD_FORGOT, {username});
            enqueueSnackbar(res.data?.detail || 'Kod göndərildi.', {variant: 'success', autoHideDuration: 4000});
            setStep(STEP.RESET);
        } catch (e) {
            setError(handleError(e));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmReset = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.PASSWORD_FORGOT_CONFIRM, {
                username, code, new_password: newPassword,
            });
            setStep(STEP.DONE);
        } catch (e) {
            setError(e?.response?.data?.detail || handleError(e));
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Link component="button" type="button" onClick={() => router.push(APP_ROUTES.SIGNIN)}
                  sx={{
                      display: 'inline-flex', alignItems: 'center', gap: 0.5, fontSize: 13,
                      color: GOV.textMuted, mb: 2.5, textDecoration: 'none',
                  }}>
                <ArrowBackIcon sx={{fontSize: 16}}/> Girişə qayıt
            </Link>

            <Typography sx={{fontSize: 22, fontWeight: 700, color: '#111827', mb: 0.5}}>
                Şifrəni bərpa et
            </Typography>

            {step === STEP.USERNAME && (
                <Box component="form" onSubmit={handleRequestCode} noValidate>
                    <Typography sx={{fontSize: 14, color: '#6B7280', mb: 3}}>
                        İstifadəçi adınızı daxil edin. Qeydiyyatda olan e-poçt ünvanınıza bərpa kodu göndəriləcək.
                    </Typography>
                    <Typography sx={{fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75}}>
                        İstifadəçi adı
                    </Typography>
                    <TextField
                        fullWidth required autoFocus size="small"
                        value={username} onChange={(e) => setUsername(e.target.value)}
                        disabled={loading} error={!!error} helperText={error} sx={{mb: 3}}
                    />
                    <Button
                        type="submit" fullWidth variant="contained" disabled={loading || !username}
                        sx={{
                            backgroundColor: GOV.navySoft, textTransform: 'none', fontWeight: 700, py: 1.1,
                            '&:hover': {backgroundColor: GOV.navy},
                        }}
                    >
                        {loading ? 'Göndərilir…' : 'Kod göndər'}
                    </Button>
                </Box>
            )}

            {step === STEP.RESET && (
                <Box component="form" onSubmit={handleConfirmReset} noValidate>
                    <Typography sx={{fontSize: 14, color: '#6B7280', mb: 3}}>
                        E-poçtunuza gələn 6 rəqəmli kodu və yeni şifrənizi daxil edin.
                    </Typography>

                    <Typography sx={{fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75}}>
                        Kod
                    </Typography>
                    <TextField
                        fullWidth required autoFocus size="small"
                        value={code}
                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        disabled={loading} sx={{mb: 2}}
                        inputProps={{inputMode: 'numeric', maxLength: 6, style: {letterSpacing: 4}}}
                    />

                    <Typography sx={{fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75}}>
                        Yeni şifrə
                    </Typography>
                    <TextField
                        fullWidth required size="small"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        disabled={loading} error={!!error}
                        helperText={error || 'Ən azı 10 simvol, böyük/kiçik hərf, rəqəm və xüsusi simvol'}
                        sx={{mb: 3}}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton size="small" onClick={() => setShowPassword((s) => !s)}>
                                        {showPassword ? <VisibilityOff fontSize="small"/> : <Visibility fontSize="small"/>}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />

                    <Box sx={{display: 'flex', gap: 1.5}}>
                        <Button
                            onClick={() => setStep(STEP.USERNAME)} disabled={loading}
                            sx={{textTransform: 'none', flexShrink: 0}}
                        >
                            Geri
                        </Button>
                        <Button
                            type="submit" fullWidth variant="contained" disabled={loading || !code || !newPassword}
                            sx={{
                                backgroundColor: GOV.navySoft, textTransform: 'none', fontWeight: 700, py: 1.1,
                                '&:hover': {backgroundColor: GOV.navy},
                            }}
                        >
                            {loading ? 'Yadda saxlanılır…' : 'Şifrəni dəyiş'}
                        </Button>
                    </Box>
                </Box>
            )}

            {step === STEP.DONE && (
                <Box sx={{textAlign: 'center', py: 2}}>
                    <CheckCircleOutlineIcon sx={{fontSize: 40, color: '#16A34A', mb: 1.5}}/>
                    <Typography sx={{fontSize: 15, color: '#16A34A', fontWeight: 600, mb: 3}}>
                        Şifrəniz uğurla dəyişdirildi.
                    </Typography>
                    <Button
                        fullWidth variant="contained" onClick={() => router.push(APP_ROUTES.SIGNIN)}
                        sx={{
                            backgroundColor: GOV.navySoft, textTransform: 'none', fontWeight: 700, py: 1.1,
                            '&:hover': {backgroundColor: GOV.navy},
                        }}
                    >
                        Girişə qayıt
                    </Button>
                </Box>
            )}
        </AuthLayout>
    );
}
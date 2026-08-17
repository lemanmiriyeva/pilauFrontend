"use client"
import React, {useState, useEffect} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AuthLayout from "@/app/daxilol/AuthLayout";

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Səhifə açılan kimi tokenin olub-olmadığını yoxlayırıq
    useEffect(() => {
        const token = sessionStorage.getItem('password_change_token');
        if (!token) {
            router.push(APP_ROUTES.SIGNIN);
        }
    }, [router]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);

        if (!newPassword) {
            setError('Yeni şifrə boş ola bilməz');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Şifrələr üst-üstə düşmür');
            return;
        }

        const token = sessionStorage.getItem('password_change_token');
        if (!token) {
            enqueueSnackbar('Sessiya bitib, yenidən daxil olun.', {variant: 'error'});
            router.push(APP_ROUTES.SIGNIN);
            return;
        }

        setLoading(true);
        try {
            const res = await service_api.post(
                NEXT_API_ENDPOINTS.AUTHENTICATION.FIRST_LOGIN_PASSWORD_SET,
                {
                    new_password: newPassword,
                    temp_token: token // Tokeni bura əlavə edirik
                }
            );

            // İstifadədən sonra tokeni təmizləyirik
            sessionStorage.removeItem('password_change_token');

            // Backend-dən qayıdan access/refresh tokenləri ehtiyac olarsa saxlaya bilərsiniz
            // (Adətən service_api və ya interceptorlar bunu avtomatik idarə edir)

            enqueueSnackbar('Yeni şifrəniz təyin edildi. Giriş uğurludur.', {variant: 'success', autoHideDuration: 2000});
            router.push(APP_ROUTES.HOME);
        } catch (e) {
            const msg = e?.response?.data?.detail || handleError(e);
            setError(msg);
            enqueueSnackbar(msg, {variant: 'error', autoHideDuration: 5000});
            if (e?.response?.status === 401) {
                sessionStorage.removeItem('password_change_token');
                router.push(APP_ROUTES.SIGNIN);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <Typography sx={{fontSize: {xs: 22, md: 26}, fontWeight: 700, color: '#111827', mb: 0.5}}>
                Yeni şifrənizi təyin edin
            </Typography>
            <Typography sx={{fontSize: {xs: 14, md: 15}, color: '#6B7280', mb: 4}}>
                İki mərhələli təsdiqləmə uğurla quruldu. Davam etməzdən əvvəl hesabınız üçün yeni şifrə təyin edin.
            </Typography>

            <Box component="form" onSubmit={handleSubmit} noValidate>
                <Typography sx={{fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75}}>
                    Yeni şifrə
                </Typography>
                <TextField
                    fullWidth required size="medium" id="new_password" name="new_password"
                    placeholder="Yeni şifrə" autoFocus
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password" disabled={loading}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton size="small" disabled={loading}
                                            onClick={() => setShowPassword((s) => !s)} edge="end">
                                    {showPassword ? <VisibilityOff fontSize="small"/> : <Visibility fontSize="small"/>}
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={{mb: 2}}
                />

                <Typography sx={{fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75}}>
                    Yeni şifrə (təkrar)
                </Typography>
                <TextField
                    fullWidth required size="medium" id="confirm_password" name="confirm_password"
                    placeholder="Yeni şifrə (təkrar)"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password" disabled={loading}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    error={!!error} helperText={error}
                    sx={{mb: 3}}
                />

                <Button
                    type="submit" fullWidth variant="contained" disabled={loading}
                    sx={{
                        backgroundColor: GOV.navySoft, textTransform: 'none', fontWeight: 600,
                        fontSize: 15, py: 1.4, borderRadius: 1.5, '&:hover': {backgroundColor: GOV.navy},
                    }}
                >
                    {loading ? 'Yadda saxlanılır…' : 'Şifrəni təyin et və daxil ol'}
                </Button>
            </Box>
        </AuthLayout>
    );
}
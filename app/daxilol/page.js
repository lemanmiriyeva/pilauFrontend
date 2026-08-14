"use client"
import React, {useState, useRef} from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Link from '@mui/material/Link';
import Box from '@mui/material/Box';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {useRouter} from "next/navigation";
import {handleError} from "@/app/utils";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES, LOGIN_STEPS} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import ResetPassword from "@/app/daxilol/ResetPassword";
import TwoFaResetDialog from "@/components/atoms/TwoFaResetDialog";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import bina from "@/app/msn_bina.png"
import logo from "@/app/logo.svg"
import Image from "next/image";

function BrandMark() {
    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 10}}>
            <Image src={logo} alt=""/>
        </Box>
    );
}

function BuildingBlueprint() {
    return (
        <Box sx={{
            position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height: '100%',
            pointerEvents: 'none',
            '& img': {width: '100%', height: '100%', objectFit: 'cover'},
        }}>
            <div style={{
                position: "absolute", backgroundColor: "rgba(0,0,0,0.7)",
                zIndex: 1, width: "100%", height: "100%",
            }}/>
            <Image
                className="building" src={bina} alt="Bina təsviri"
                layout="responsive" width={1000} height={1000}
                style={{height: "100%", objectFit: 'cover'}}
            />
        </Box>
    );
}

export default function Page() {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [errors, setErrors] = useState({username: null, password: null, common: null});
    const [capsLockOn, setCapsLockOn] = useState(false);
    const [twoFaStep, setTwoFaStep] = useState(false);
    const [code, setCode] = useState('');
    const [showPasswordReset, setShowPasswordReset] = useState(false);
    const [showTwoFaResetDialog, setShowTwoFaResetDialog] = useState(false);
    const [pendingUsername, setPendingUsername] = useState('');

    const {enqueueSnackbar} = useSnackbar();
    const router = useRouter();
    const formRef = useRef(null);

    const handleClickShowPassword = () => setShowPassword((show) => !show);

    const handleCapsLock = (e) => setCapsLockOn(e.getModifierState && e.getModifierState('CapsLock'));

    const handleBackToCredentials = () => {
        setTwoFaStep(false);
        setCode('');
        setErrors({username: null, password: null, common: null});
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors({username: null, password: null, common: null});

        if (!twoFaStep) {
            const data = new FormData(event.currentTarget);
            const username = data.get('username');
            const password = data.get('password');

            if (!username) {
                setErrors((e) => ({...e, username: 'İstifadəçi adı boş ola bilməz'}));
                return;
            }
            if (!password) {
                setErrors((e) => ({...e, password: 'Şifrə boş ola bilməz'}));
                return;
            }

            setLoading(true);
            try {
                const res = await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.LOGIN, {username, password});
                setPendingUsername(username);

                if (res.data.step === LOGIN_STEPS.TOTP_SETUP) {
                    router.push(APP_ROUTES.TWO_FA_SETUP);
                    return;
                }
                if (res.data.step === LOGIN_STEPS.TOTP_VERIFY) {
                    setTwoFaStep(true);
                }
            } catch (error) {
                if (error?.response?.status === 423) {
                    const msg = error?.response?.data?.detail || 'Hesabınız bloklanıb.';
                    setErrors((e) => ({...e, common: msg}));
                    enqueueSnackbar(msg, {variant: 'error', autoHideDuration: 6000});
                } else {
                    const msg = error?.response?.data?.detail || handleError(error);
                    setErrors((e) => ({...e, common: msg}));
                    enqueueSnackbar(msg, {variant: 'error', autoHideDuration: 5000});
                }
                formRef.current?.reset();
            } finally {
                setLoading(false);
            }
        } else {
            setLoading(true);
            try {
                const res = await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.TOTP_VERIFY, {code});
                enqueueSnackbar('Giriş uğurludur.', {variant: 'success', autoHideDuration: 1500});
                router.push(APP_ROUTES.HOME);
            } catch (error) {
                const msg = error?.response?.data?.detail || handleError(error);
                setErrors((e) => ({...e, common: msg}));
                enqueueSnackbar(msg, {variant: 'error', autoHideDuration: 4000});
                setCode('');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleOpenTwoFaResetDialog = () => setShowTwoFaResetDialog(true);
    const handleCloseTwoFaResetDialog = () => setShowTwoFaResetDialog(false);

    return (
        <Box sx={{
            display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden',
            backgroundColor: '#FFFFFF', position: 'fixed', top: 0, left: 0,
        }}>

            <Box sx={{display: {xs: 'block', md: 'none'}, position: 'absolute', inset: 0, zIndex: 0}}>
                <BuildingBlueprint/>
            </Box>
            <Box sx={{display: {xs: 'flex', md: 'none'}, position: 'absolute', top: 20, left: 20, zIndex: 2}}>
                <BrandMark/>
            </Box>

            <Box sx={{
                display: 'flex', width: '100%', height: '100%', position: 'relative', zIndex: 1,
                flexDirection: {xs: 'column', md: 'row'},
            }}>
                {/* LEFT — Brand Panel */}
                <Box sx={{
                    position: 'relative', flex: {xs: '0 0 0%', md: '0 0 52%'},
                    display: {xs: 'none', md: 'flex'}, flexDirection: 'column',
                    justifyContent: 'space-between', backgroundColor: GOV.navyMid,
                    color: GOV.textOnNavy, overflow: 'hidden', px: {md: 6, lg: 8}, py: 5,
                }}>
                    <BrandMark/>
                    <Box sx={{position: 'relative', zIndex: 10, mb: 4}}>
                        <Typography sx={{color: GOV.gold, letterSpacing: 4,textTransform:'uppercase', fontSize: 13, fontWeight: 600, mb: 1}}>
                            İdarəetmə platforması
                        </Typography>
                        <Typography sx={{
                            fontSize: {md: 48, lg: 64}, fontWeight: 800, lineHeight: 1,
                            textTransform: 'uppercase', letterSpacing: 1, mb: 2,
                        }}>
                            PİLAU
                        </Typography>
                        <Typography sx={{color: GOV.textOnNavyMuted, maxWidth: 440, fontSize: 15, lineHeight: 1.7}}>
                            İstehsal, təchizat və sənəd dövriyyəsi proseslərinin
                            vahid idarəetmə mühiti. Giriş yalnız sistem
                            administratoru tərəfindən yaradılmış hesablar üçün
                            mümkündür.
                        </Typography>
                    </Box>
                    <Box></Box>
                    <BuildingBlueprint/>
                </Box>

                {/* RIGHT — Form Panel */}
                <Box sx={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100%', overflowY: 'auto', px: 3, pt: {xs: 12, sm: 3, md: 0},
                }}>
                    <Box sx={{
                        width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 3,
                        boxShadow: {xs: '0 20px 45px rgba(15, 23, 55, 0.18)', md: 'none'},
                        px: {xs: 3, sm: 4}, py: 5,
                    }}>
                        <Typography sx={{fontSize: 22, fontWeight: 700, color: '#111827', mb: 0.5}}>
                            Sistemə giriş
                        </Typography>
                        <Typography sx={{fontSize: 14, color: '#6B7280', mb: 3}}>
                            {twoFaStep
                                ? 'Autentifikasiya tətbiqinizdəki 6 rəqəmli kodu daxil edin.'
                                : 'Davam etmək üçün istifadəçi adı və şifrənizi daxil edin.'}
                        </Typography>

                        <Box component="form" ref={formRef} onSubmit={handleSubmit} noValidate>
                            {!twoFaStep ? (
                                <>
                                    <Typography sx={{fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75}}>
                                        İstifadəçi adı
                                    </Typography>
                                    <TextField
                                        fullWidth required id="username" name="username"
                                        placeholder="İstifadəçi adı" autoComplete="username" autoFocus
                                        size="small" error={!!errors.username} helperText={errors.username}
                                        disabled={loading} sx={{mb: 2}}
                                    />

                                    <Typography sx={{fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75}}>
                                        Şifrə
                                    </Typography>
                                    <TextField
                                        fullWidth required size="small"
                                        onKeyDown={handleCapsLock} onKeyUp={handleCapsLock}
                                        error={!!errors.password}
                                        helperText={errors.password ? errors.password : (capsLockOn ? "Caps Lock açıqdır" : "")}
                                        name="password" placeholder="Şifrə"
                                        type={showPassword ? 'text' : 'password'} id="password"
                                        autoComplete="current-password" disabled={loading}
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton size="small" disabled={loading}
                                                                onClick={handleClickShowPassword} edge="end">
                                                        {showPassword ? <VisibilityOff fontSize="small"/> :
                                                            <Visibility fontSize="small"/>}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                    />

                                    <Box sx={{display: 'flex', justifyContent: 'flex-end', mt: 0.75, mb: 2.5}}>
                                        <Link onClick={() => setShowPasswordReset(true)} component="button"
                                              type="button" underline="hover" sx={{fontSize: 13, color: GOV.navyMid}}>
                                            Şifrənizi unutmusunuz?
                                        </Link>
                                    </Box>
                                </>
                            ) : (
                                <>
                                    <TextField
                                        fullWidth required id="code" name="code" placeholder="000000"
                                        autoComplete="one-time-code" autoFocus size="small" value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        error={!!errors.common} disabled={loading}
                                        inputProps={{
                                            inputMode: 'numeric', maxLength: 6,
                                            style: {letterSpacing: 4, textAlign: 'center', fontSize: 18},
                                        }}
                                        sx={{mb: 2}}
                                    />
                                    <Box sx={{display: 'flex', justifyContent: 'space-between', mt: -1, mb: 2.5}}>
                                        <Link onClick={handleOpenTwoFaResetDialog} component="button" type="button"
                                              underline="hover" sx={{fontSize: 13, color: GOV.navyMid}}>
                                            Administrator ilə əlaqə
                                        </Link>
                                        <Link onClick={handleBackToCredentials} component="button" type="button"
                                              underline="hover" sx={{fontSize: 13, color: GOV.navyMid}}>
                                            Geri qayıt
                                        </Link>
                                    </Box>
                                    <Typography sx={{fontSize: 12, color: '#9CA3AF', mt: -1.5, mb: 2.5}}>
                                        Autentifikasiya tətbiqinə girişinizi itirmisinizsə, yuxarıdakı bağlantı ilə
                                        administratora müraciət edə bilərsiniz.
                                    </Typography>
                                </>
                            )}

                            {errors.common && (
                                <Typography sx={{fontSize: 13, color: '#D32F2F', mb: 2}}>
                                    {errors.common}
                                </Typography>
                            )}

                            <Button
                                type="submit" fullWidth variant="contained" disabled={loading}
                                sx={{
                                    backgroundColor: GOV.navySoft, textTransform: 'none', fontWeight: 600,
                                    py: 1.1, borderRadius: 1.5, '&:hover': {backgroundColor: GOV.navy},
                                }}
                            >
                                {loading ? 'Yoxlanılır…' : (twoFaStep ? 'Təsdiqlə' : 'Daxil ol')}
                            </Button>
                        </Box>

                        <Typography sx={{fontSize: 12.5, color: '#9CA3AF', mt: 3, lineHeight: 1.6}}>
                            Bu sistemdə qeydiyyat mövcud deyil. Hesabınız yoxdursa, administrator ilə əlaqə saxlayın.
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <ResetPassword open={showPasswordReset} handleClose={() => setShowPasswordReset(false)}/>

            <TwoFaResetDialog
                open={showTwoFaResetDialog}
                handleClose={handleCloseTwoFaResetDialog}
                defaultUsername={pendingUsername}
            />
        </Box>
    );
}

"use client"
import React, {useEffect, useState} from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";

// Axın: 1) istifadəçi adını yazır -> e-poçtuna kod göndərilir
//       2) kodu yazır -> 2FA sıfırlanır -> yenidən daxil olub QR-i yenidən qurur
export default function TwoFaResetDialog({open, handleClose, defaultUsername = ''}) {
    const [step, setStep] = useState('username'); // 'username' | 'code' | 'success'
    const [username, setUsername] = useState(defaultUsername);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        if (open) {
            setStep('username');
            setUsername(defaultUsername || '');
            setCode('');
            setError('');
            setLoading(false);
        }
    }, [open, defaultUsername]);

    const handleSendCode = async () => {
        setError('');
        if (!username) {
            setError('İstifadəçi adını daxil edin');
            return;
        }
        setLoading(true);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.TOTP_REQUEST_ADMIN_HELP, {username});
            setStep('code');
        } catch (e) {
            setError(e?.response?.data?.detail || handleError(e));
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmCode = async () => {
        setError('');
        if (!code || code.length !== 6) {
            setError('6 rəqəmli kodu daxil edin');
            return;
        }
        setLoading(true);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.TOTP_REQUEST_ADMIN_HELP_CONFIRM, {username, code});
            setStep('success');
            enqueueSnackbar('2FA uğurla sıfırlandı.', {variant: 'success'});
        } catch (e) {
            setError(e?.response?.data?.detail || handleError(e));
        } finally {
            setLoading(false);
        }
    };

    const handleBackToUsername = () => {
        setStep('username');
        setCode('');
        setError('');
    };

    const onClose = () => {
        if (loading) return;
        handleClose();
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{fontSize: 17, fontWeight: 700, color: '#111827', pr: 6}}>
                {step === 'success' ? '2FA sıfırlandı' : '2FA-nı sıfırla'}
                <IconButton onClick={onClose} disabled={loading}
                            sx={{position: 'absolute', right: 12, top: 12}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {step === 'username' && (
                    <Box sx={{pt: 0.5}}>
                        <Typography sx={{fontSize: 13, color: '#6B7280', mb: 2.5}}>
                            Autentifikasiya tətbiqinizə girişinizi itirmisinizsə, istifadəçi adınızı daxil edin —
                            qeydiyyatdakı e-poçt ünvanınıza sıfırlama kodu göndəriləcək.
                        </Typography>
                        <Typography sx={{fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75}}>
                            İstifadəçi adı
                        </Typography>
                        <TextField
                            fullWidth autoFocus size="medium" value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="İstifadəçi adı" disabled={loading}
                            error={!!error} helperText={error}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                        />
                    </Box>
                )}

                {step === 'code' && (
                    <Box sx={{pt: 0.5}}>
                        <Typography sx={{fontSize: 13, color: '#6B7280', mb: 2.5}}>
                            <strong>{username}</strong> istifadəçisinin qeydiyyatdakı e-poçtuna 6 rəqəmli kod
                            göndərildi. Kodu aşağıda daxil edin.
                        </Typography>
                        <Typography sx={{fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75}}>
                            Kod
                        </Typography>
                        <TextField
                            fullWidth autoFocus size="medium" value={code} placeholder="000000"
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            disabled={loading} error={!!error} helperText={error}
                            inputProps={{
                                inputMode: 'numeric', maxLength: 6,
                                style: {letterSpacing: 4, textAlign: 'center', fontSize: 18},
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirmCode()}
                        />
                        <Box sx={{display: 'flex', justifyContent: 'space-between', mt: 1.5}}>
                            <Link onClick={handleBackToUsername} component="button" type="button"
                                  underline="hover" sx={{fontSize: 12.5, color: GOV.navyMid}}>
                                İstifadəçi adını dəyiş
                            </Link>
                            <Link onClick={handleSendCode} component="button" type="button"
                                  underline="hover" sx={{fontSize: 12.5, color: GOV.navyMid}}>
                                Kodu yenidən göndər
                            </Link>
                        </Box>
                    </Box>
                )}

                {step === 'success' && (
                    <Box sx={{pt: 0.5, textAlign: 'center', py: 2}}>
                        <CheckCircleOutlineIcon sx={{fontSize: 44, color: '#2E7D32', mb: 1.5}}/>
                        <Typography sx={{fontSize: 13.5, color: '#374151', lineHeight: 1.7}}>
                            İki mərhələli doğrulama (2FA) sıfırlandı. İndi yenidən daxil olun —
                            növbəti girişdə autentifikator tətbiqini təzədən quracaqsınız.
                        </Typography>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{px: 3, pb: 3}}>
                {step === 'username' && (
                    <Button
                        fullWidth variant="contained" onClick={handleSendCode} disabled={loading}
                        sx={{
                            backgroundColor: GOV.navySoft, textTransform: 'none', fontWeight: 600,
                            fontSize: 14, py: 1.2, borderRadius: 1.5, '&:hover': {backgroundColor: GOV.navy},
                        }}
                    >
                        {loading ? 'Göndərilir…' : 'Kod göndər'}
                    </Button>
                )}
                {step === 'code' && (
                    <Button
                        fullWidth variant="contained" onClick={handleConfirmCode} disabled={loading}
                        sx={{
                            backgroundColor: GOV.navySoft, textTransform: 'none', fontWeight: 600,
                            fontSize: 14, py: 1.2, borderRadius: 1.5, '&:hover': {backgroundColor: GOV.navy},
                        }}
                    >
                        {loading ? 'Yoxlanılır…' : 'Sıfırla'}
                    </Button>
                )}
                {step === 'success' && (
                    <Button
                        fullWidth variant="contained" onClick={onClose}
                        sx={{
                            backgroundColor: GOV.navySoft, textTransform: 'none', fontWeight: 600,
                            fontSize: 14, py: 1.2, borderRadius: 1.5, '&:hover': {backgroundColor: GOV.navy},
                        }}
                    >
                        Daxil olmağa qayıt
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
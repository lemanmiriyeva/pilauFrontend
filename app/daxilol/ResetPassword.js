"use client"
import React, {useState} from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";

const STEP = {USERNAME: 'username', RESET: 'reset', DONE: 'done'};

export default function ResetPassword({open, handleClose}) {
    const [step, setStep] = useState(STEP.USERNAME);
    const [username, setUsername] = useState('');
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const {enqueueSnackbar} = useSnackbar();

    const reset = () => {
        setStep(STEP.USERNAME);
        setUsername('');
        setCode('');
        setNewPassword('');
        setError(null);
    };

    const onClose = () => {
        reset();
        handleClose();
    };

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
            enqueueSnackbar('Şifrəniz uğurla dəyişdirildi. İndi yenidən daxil ola bilərsiniz.',
                {variant: 'success', autoHideDuration: 5000});
            setStep(STEP.DONE);
            setTimeout(onClose, 1500);
        } catch (e) {
            const msg = e?.response?.data?.detail || handleError(e);
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{fontWeight: 700}}>Şifrəni bərpa et</DialogTitle>

            {step === STEP.USERNAME && (
                <Box component="form" onSubmit={handleRequestCode}>
                    <DialogContent>
                        <Typography sx={{fontSize: 13, color: '#6B7280', mb: 2}}>
                            İstifadəçi adınızı daxil edin. Qeydiyyatda olan e-poçt ünvanınıza bərpa kodu
                            göndəriləcək.
                        </Typography>
                        <TextField
                            fullWidth required autoFocus size="small" label="İstifadəçi adı"
                            value={username} onChange={(e) => setUsername(e.target.value)}
                            disabled={loading} error={!!error} helperText={error}
                        />
                    </DialogContent>
                    <DialogActions sx={{px: 3, pb: 3}}>
                        <Button onClick={onClose} disabled={loading} sx={{textTransform: 'none'}}>
                            Ləğv et
                        </Button>
                        <Button
                            type="submit" variant="contained" disabled={loading || !username}
                            sx={{
                                backgroundColor: GOV.navySoft, textTransform: 'none',
                                '&:hover': {backgroundColor: GOV.navy},
                            }}
                        >
                            {loading ? 'Göndərilir…' : 'Kod göndər'}
                        </Button>
                    </DialogActions>
                </Box>
            )}

            {step === STEP.RESET && (
                <Box component="form" onSubmit={handleConfirmReset}>
                    <DialogContent>
                        <Typography sx={{fontSize: 13, color: '#6B7280', mb: 2}}>
                            E-poçtunuza gələn 6 rəqəmli kodu və yeni şifrənizi daxil edin.
                        </Typography>
                        <TextField
                            fullWidth required autoFocus size="small" label="Kod"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            disabled={loading} sx={{mb: 2}}
                            inputProps={{inputMode: 'numeric', maxLength: 6}}
                        />
                        <TextField
                            fullWidth required size="small" label="Yeni şifrə"
                            type={showPassword ? 'text' : 'password'}
                            value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                            disabled={loading} error={!!error} helperText={error ||
                                'Ən azı 10 simvol, böyük/kiçik hərf, rəqəm və xüsusi simvol'}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton size="small" onClick={() => setShowPassword((s) => !s)}>
                                            {showPassword ? <VisibilityOff fontSize="small"/> :
                                                <Visibility fontSize="small"/>}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </DialogContent>
                    <DialogActions sx={{px: 3, pb: 3}}>
                        <Button onClick={() => setStep(STEP.USERNAME)} disabled={loading} sx={{textTransform: 'none'}}>
                            Geri
                        </Button>
                        <Button
                            type="submit" variant="contained" disabled={loading || !code || !newPassword}
                            sx={{
                                backgroundColor: GOV.navySoft, textTransform: 'none',
                                '&:hover': {backgroundColor: GOV.navy},
                            }}
                        >
                            {loading ? 'Yadda saxlanılır…' : 'Şifrəni dəyiş'}
                        </Button>
                    </DialogActions>
                </Box>
            )}

            {step === STEP.DONE && (
                <DialogContent>
                    <Typography sx={{fontSize: 14, color: '#16A34A', fontWeight: 600, py: 2, textAlign: 'center'}}>
                        Şifrəniz uğurla dəyişdirildi.
                    </Typography>
                </DialogContent>
            )}
        </Dialog>
    );
}

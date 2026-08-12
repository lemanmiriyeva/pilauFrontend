"use client"
import React, {useState, useEffect} from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";

export default function TwoFaResetDialog({open, handleClose, defaultUsername = ''}) {
    const [username, setUsername] = useState(defaultUsername);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        if (open) {
            setUsername(defaultUsername);
            setMessage('');
            setSent(false);
        }
    }, [open, defaultUsername]);

    const onClose = () => {
        handleClose();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.TOTP_REQUEST_ADMIN_HELP, {
                username, message,
            });
            setSent(true);
            enqueueSnackbar(res.data?.detail || 'Sorğunuz göndərildi.', {variant: 'success', autoHideDuration: 4000});
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error', autoHideDuration: 4000});
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{fontWeight: 700}}>Administrator ilə əlaqə</DialogTitle>

            {!sent ? (
                <Box component="form" onSubmit={handleSubmit}>
                    <DialogContent>
                        <Typography sx={{fontSize: 13, color: '#6B7280', mb: 2}}>
                            Təhlükəsizlik səbəbindən 2FA (iki mərhələli təsdiqləmə) yalnız administrator
                            tərəfindən sıfırlana bilər. İstifadəçi adınızı göndərin — administrator sizinlə
                            əlaqə saxlayacaq.
                        </Typography>
                        <TextField
                            fullWidth required autoFocus size="small" label="İstifadəçi adı"
                            value={username} onChange={(e) => setUsername(e.target.value)}
                            disabled={loading} sx={{mb: 2}}
                        />
                        <TextField
                            fullWidth multiline minRows={2} size="small" label="Qeyd (istəyə bağlı)"
                            value={message} onChange={(e) => setMessage(e.target.value)}
                            disabled={loading}
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
                            {loading ? 'Göndərilir…' : 'Sorğu göndər'}
                        </Button>
                    </DialogActions>
                </Box>
            ) : (
                <>
                    <DialogContent>
                        <Typography sx={{fontSize: 14, color: '#16A34A', fontWeight: 600, py: 1, textAlign: 'center'}}>
                            Sorğunuz administratora çatdırıldı.
                        </Typography>
                        <Typography sx={{fontSize: 13, color: '#6B7280', textAlign: 'center'}}>
                            Administrator sizinlə qeydiyyatdakı əlaqə vasitələri üzərindən əlaqə saxlayacaq.
                        </Typography>
                    </DialogContent>
                    <DialogActions sx={{px: 3, pb: 3, justifyContent: 'center'}}>
                        <Button onClick={onClose} variant="contained" sx={{
                            backgroundColor: GOV.navySoft, textTransform: 'none',
                            '&:hover': {backgroundColor: GOV.navy},
                        }}>
                            Bağla
                        </Button>
                    </DialogActions>
                </>
            )}
        </Dialog>
    );
}

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
import IconButton from '@mui/material/IconButton';
import CircularProgress from '@mui/material/CircularProgress';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import {GOV} from "@/components/theme/govColors";

const METHOD_LABEL = {sima: 'SİMA İmza', asan: 'Asan İmza'};

// SİM İmza / Asan İmza ilə imzalama - telefon nömrəsini alır, imzala düyməsini basanda
// onConfirm(phone) çağırır (əsl API çağırışı və nəticə emalı sened/[id]/page.js-də olur).
export default function CertificateSignDialog({open, method, onClose, onConfirm}) {
    const [phone, setPhone] = useState('+994 ');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (open) {
            setPhone('+994 ');
            setLoading(false);
            setError('');
            setSuccess(false);
        }
    }, [open, method]);

    const handlePhoneChange = (e) => {
        let val = e.target.value;
        if (!val.startsWith('+994')) val = '+994 ';
        setPhone(val);
    };

    const handleConfirm = async () => {
        setError('');
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 12) {
            setError('Düzgün mobil nömrə daxil edin');
            return;
        }
        setLoading(true);
        try {
            await onConfirm(phone);
            setSuccess(true);
        } catch (e) {
            setError(e?.response?.data?.detail || 'İmzalama zamanı xəta baş verdi');
        } finally {
            setLoading(false);
        }
    };

    const onDialogClose = () => {
        if (loading) return;
        onClose();
    };

    return (
        <Dialog open={open} onClose={onDialogClose} fullWidth maxWidth="xs">
            <DialogTitle sx={{fontSize: 17, fontWeight: 700, color: '#111827', pr: 6}}>
                {method ? METHOD_LABEL[method] : ''} ilə imzala
                <IconButton onClick={onDialogClose} disabled={loading}
                            sx={{position: 'absolute', right: 12, top: 12}}>
                    <CloseIcon fontSize="small"/>
                </IconButton>
            </DialogTitle>

            <DialogContent>
                {success ? (
                    <Box sx={{textAlign: 'center', py: 2}}>
                        <CheckCircleOutlineIcon sx={{fontSize: 44, color: '#2E7D32', mb: 1.5}}/>
                        <Typography sx={{fontSize: 13.5, color: '#374151'}}>
                            Sənəd {method ? METHOD_LABEL[method] : ''} ilə uğurla imzalandı.
                        </Typography>
                    </Box>
                ) : (
                    <Box sx={{pt: 0.5}}>
                        <Typography sx={{fontSize: 13, color: '#6B7280', mb: 2.5}}>
                            {method === 'sima'
                                ? 'SİM İmza ilə imzalamaq üçün SİM İmza aktiv olan mobil nömrənizi daxil edin. Təsdiq üçün telefonunuza PIN kodu göndəriləcək.'
                                : 'Asan İmza ilə imzalamaq üçün Asan İmza-ya qeydiyyatdan keçmiş mobil nömrənizi daxil edin. Təsdiq üçün Asan İmza tətbiqinə bildiriş gedəcək.'}
                        </Typography>
                        <Typography sx={{fontSize: 13, fontWeight: 600, color: '#374151', mb: 0.75}}>
                            Mobil nömrə
                        </Typography>
                        <TextField
                            fullWidth autoFocus size="medium" value={phone}
                            onChange={handlePhoneChange} disabled={loading}
                            placeholder="+994 __ ___ __ __" error={!!error} helperText={error}
                            onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                        />
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{px: 3, pb: 3}}>
                {success ? (
                    <Button
                        fullWidth variant="contained" onClick={onDialogClose}
                        sx={{
                            backgroundColor: GOV.navySoft, textTransform: 'none', fontWeight: 600,
                            fontSize: 14, py: 1.2, borderRadius: 1.5, '&:hover': {backgroundColor: GOV.navy},
                        }}
                    >
                        Bağla
                    </Button>
                ) : (
                    <Button
                        fullWidth variant="contained" onClick={handleConfirm} disabled={loading}
                        startIcon={loading ? <CircularProgress size={14} color="inherit"/> : null}
                        sx={{
                            backgroundColor: GOV.navySoft, textTransform: 'none', fontWeight: 600,
                            fontSize: 14, py: 1.2, borderRadius: 1.5, '&:hover': {backgroundColor: GOV.navy},
                        }}
                    >
                        {loading ? 'İmzalanır…' : 'İmzala'}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
}
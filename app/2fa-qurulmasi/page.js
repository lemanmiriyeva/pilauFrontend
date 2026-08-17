"use client"
import React, {useState, useEffect} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import QRCode from "qrcode";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import {handleError} from "@/app/utils";
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
            pointerEvents: 'none', '& img': {width: '100%', height: '100%', objectFit: 'cover'},
        }}>
            <div style={{
                position: "absolute", backgroundColor: "rgba(0,0,0,0.7)",
                zIndex: 1, width: "100%", height: "100%",
            }}/>
            <Image className="building" src={bina} alt="Bina təsviri" layout="responsive"
                   width={1000} height={1000} style={{height: "100%", objectFit: 'cover'}}/>
        </Box>
    );
}

export default function Page() {
    const [qrDataUrl, setQrDataUrl] = useState(null);
    const [manualKey, setManualKey] = useState(null);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.TOTP_SETUP_BEGIN);
                if (res.data?.qr_uri) {
                    setManualKey(res.data.manual_key);
                    const dataUrl = await QRCode.toDataURL(res.data.qr_uri, {width: 220, margin: 1});
                    setQrDataUrl(dataUrl);
                }
            } catch (e) {
                if (e?.response?.status === 401) {
                    router.push(APP_ROUTES.SIGNIN);
                    return;
                }
                setError(handleError(e));
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleVerify = async (event) => {
        event.preventDefault();
        setVerifying(true);
        setError(null);
        try {
            const res = await service_api.post(NEXT_API_ENDPOINTS.AUTHENTICATION.TOTP_SETUP_CONFIRM, {code});
            enqueueSnackbar('2FA uğurla quruldu.', {variant: 'success'});

            const nextStep = res.data?.step;
            if (nextStep === 'password_change_required') {
                router.push(APP_ROUTES.FIRST_PASSWORD_SET);
                return;
            }
            router.push(APP_ROUTES.HOME);
        } catch (e) {
            const msg = e?.response?.data?.detail || handleError(e);
            setError(msg);
            setCode('');
        } finally {
            setVerifying(false);
        }
    };

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
                <Box sx={{
                    position: 'relative', flex: {xs: '0 0 0%', md: '0 0 52%'},
                    display: {xs: 'none', md: 'flex'}, flexDirection: 'column',
                    justifyContent: 'space-between', backgroundColor: GOV.navyMid,
                    color: GOV.textOnNavy, overflow: 'hidden', px: {md: 6, lg: 8}, py: 5,
                }}>
                    <BrandMark/>
                    <Box sx={{position: 'relative', zIndex: 10, mb: 4}}>
                        <Typography sx={{color: GOV.gold, letterSpacing: 4, fontSize: 13, fontWeight: 600, mb: 1}}>
                            TƏHLÜKƏSİZLİK PLATFORMASI
                        </Typography>
                        <Typography sx={{
                            fontSize: {md: 40, lg: 56}, fontWeight: 800, lineHeight: 1.1,
                            textTransform: 'uppercase', letterSpacing: 1, mb: 2,
                        }}>
                            İki Mərhələli Təsdiqləmə
                        </Typography>
                        <Typography sx={{color: GOV.textOnNavyMuted, maxWidth: 440, fontSize: 15, lineHeight: 1.7}}>
                            Hesabınızın təhlükəsizliyi üçün ilk girişdə mütləq quraşdırılmalıdır.
                        </Typography>
                    </Box>
                    <BuildingBlueprint/>
                </Box>

                <Box sx={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100%', overflowY: 'auto', px: 3, pt: {xs: 12, sm: 3, md: 0},
                }}>
                    <Box sx={{
                        width: '100%', maxWidth: 440, backgroundColor: '#FFFFFF', borderRadius: 3,
                        boxShadow: {xs: '0 20px 45px rgba(15, 23, 55, 0.18)', md: 'none'},
                        px: {xs: 3, sm: 4}, py: 5,
                    }}>
                        <Typography sx={{fontSize: 22, fontWeight: 700, color: '#111827', mb: 0.5}}>
                            İki addımlı təsdiqləmə
                        </Typography>
                        <Typography sx={{fontSize: 14, color: '#6B7280', mb: 3}}>
                            Google Authenticator və ya Microsoft Authenticator tətbiqi ilə aşağıdakı QR
                            kodu skan edin, sonra tətbiqdə göstərilən 6 rəqəmli kodu daxil edin.
                        </Typography>

                        {loading ? (
                            <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                                <CircularProgress size={28}/>
                            </Box>
                        ) : (
                            <>
                                {qrDataUrl && (
                                    <Box sx={{display: 'flex', justifyContent: 'center', mb: 1}}>
                                        <img src={qrDataUrl} alt="2FA QR kod" width={200} height={200}/>
                                    </Box>
                                )}
                                {manualKey && (
                                    <Typography sx={{
                                        fontSize: 12, color: '#9CA3AF', textAlign: 'center',
                                        mb: 3, fontFamily: 'monospace', wordBreak: 'break-all',
                                    }}>
                                        QR oxunmursa, əl ilə daxil edin: {manualKey}
                                    </Typography>
                                )}

                                <Box component="form" onSubmit={handleVerify}>
                                    <TextField
                                        fullWidth required size="small" placeholder="000000"
                                        value={code}
                                        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        disabled={verifying}
                                        inputProps={{
                                            inputMode: 'numeric', maxLength: 6,
                                            style: {letterSpacing: 4, textAlign: 'center', fontSize: 18},
                                        }}
                                        sx={{mb: 2}}
                                    />

                                    {error && (
                                        <Typography sx={{fontSize: 13, color: '#D32F2F', mb: 2}}>
                                            {error}
                                        </Typography>
                                    )}

                                    <Button
                                        type="submit" fullWidth variant="contained"
                                        disabled={verifying || code.length !== 6}
                                        sx={{
                                            backgroundColor: GOV.navySoft, textTransform: 'none',
                                            fontWeight: 600, py: 1.1, borderRadius: 1.5,
                                            '&:hover': {backgroundColor: GOV.navy},
                                        }}
                                    >
                                        {verifying ? 'Yoxlanılır…' : 'Təsdiqlə'}
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
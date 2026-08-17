"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import {GOV} from "@/components/theme/govColors";
import bina from "@/app/msn_bina.png"
import logo from "@/app/logo.svg"
import Image from "next/image";

export function BrandMark() {
    return (
        <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, zIndex: 10}}>
            <Image src={logo} alt=""/>
        </Box>
    );
}

export function BuildingBlueprint() {
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

export default function AuthLayout({children}) {
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
                    position: 'relative', flex: {xs: '0 0 0%', md: '0 0 44%'},
                    display: {xs: 'none', md: 'flex'}, flexDirection: 'column',
                    justifyContent: 'space-between', backgroundColor: GOV.navyMid,
                    color: GOV.textOnNavy, overflow: 'hidden', px: {md: 6, lg: 8}, py: 5,
                }}>
                    <BrandMark/>
                    <Box sx={{position: 'relative', zIndex: 10, mb: 4}}>
                        <Typography sx={{color: GOV.gold, letterSpacing: 4, textTransform: 'uppercase', fontSize: 13, fontWeight: 600, mb: 1}}>
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
                    flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    height: '100%', overflowY: 'auto', px: {xs: 3, md: 6, lg: 8}, pt: {xs: 12, sm: 3, md: 0},
                }}>
                    <Box sx={{
                        width: '100%', maxWidth: 480, backgroundColor: '#FFFFFF', borderRadius: 3,
                        boxShadow: {xs: '0 20px 45px rgba(15, 23, 55, 0.18)', md: 'none'},
                        px: {xs: 3, sm: 4}, py: 5,
                    }}>
                        {children}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}
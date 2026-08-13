"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import {useRouter, useParams} from "next/navigation";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import ModuleCard from "@/components/atoms/ModuleCard";
import {findModuleByPath} from "@/app/ModuleTree";
import AppShell from "@/components/atoms/AppShell";

export default function Page() {
    const router = useRouter();
    const params = useParams();
    const pathKeys = params?.path || [];

    return (
        <AppShell>
            {({tree}) => {
                const result = findModuleByPath(tree, pathKeys);

                if (!result) {
                    return (
                        <Box sx={{maxWidth: 1080, mx: 'auto', px: {xs: 2, md: 4}, py: 10, textAlign: 'center'}}>
                            <InfoOutlinedIcon sx={{fontSize: 32, color: GOV.textMuted, mb: 1}}/>
                            <Typography sx={{fontSize: 16, fontWeight: 700, color: GOV.textPrimary, mb: 0.5}}>
                                Bu bölmə tapılmadı və ya girişiniz yoxdur
                            </Typography>
                            <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                                  sx={{fontSize: 13, color: GOV.navySoft}}>
                                Ana səhifəyə qayıt
                            </Link>
                        </Box>
                    );
                }

                const {node, breadcrumb} = result;

                return (
                    <Box sx={{maxWidth: 1080, mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                        <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                            <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                                  sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                                Ana Səhifə
                            </Link>
                            {breadcrumb.map((b, i) => (
                                <React.Fragment key={b.keyPath.join('/')}>
                                    {' / '}
                                    {i === breadcrumb.length - 1 ? (
                                        <span>{b.title}</span>
                                    ) : (
                                        <Link component="button"
                                              onClick={() => router.push(`${APP_ROUTES.MODULES}/${b.keyPath.join('/')}`)}
                                              sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                                            {b.title}
                                        </Link>
                                    )}
                                </React.Fragment>
                            ))}
                        </Typography>

                        <Box sx={{textAlign: 'center', mb: 5}}>
                            <Typography sx={{
                                fontSize: {xs: 22, md: 28}, fontWeight: 800, letterSpacing: 1,
                                color: GOV.textPrimary, textTransform: 'uppercase',
                            }}>
                                {node.title}
                            </Typography>
                        </Box>

                        {node.children.length === 0 ? (
                            <Box sx={{textAlign: 'center', py: 6}}>
                                <InfoOutlinedIcon sx={{fontSize: 28, color: GOV.textMuted, mb: 1}}/>
                                <Typography sx={{fontSize: 14, color: GOV.textMuted}}>
                                    Bu bölmənin məzmunu hazırlanır.
                                </Typography>
                                {!node.can_view && (
                                    <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mt: 0.5}}>
                                        (Bu bölməyə görmə icazəniz yoxdur)
                                    </Typography>
                                )}
                            </Box>
                        ) : (
                            <Box sx={{
                                display: 'grid', gap: 2,
                                gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'},
                            }}>
                                {node.children.map((child) => (
                                    <ModuleCard
                                        key={child.id} module={child} variant="sub"
                                        onClick={() => router.push(`${APP_ROUTES.MODULES}/${[...pathKeys, child.key].join('/')}`)}
                                    />
                                ))}
                            </Box>
                        )}
                    </Box>
                );
            }}
        </AppShell>
    );
}
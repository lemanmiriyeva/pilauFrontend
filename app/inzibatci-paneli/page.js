"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import {useRouter} from "next/navigation";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AdminShell from "@/components/atoms/admin/AdminShell";
import ModuleCard from "@/components/atoms/ModuleCard";
import {findModuleByPath} from "@/app/ModuleTree";

export default function Page() {
    const router = useRouter();

    return (
        <AdminShell>
            {({tree}) => {
                const result = findModuleByPath(tree, ['inzibatci-paneli']);
                const children = result?.node?.children || [];

                return (
                    <Box sx={{maxWidth: 1080, mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                        <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                            <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                                  sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                                Ana Səhifə
                            </Link>
                            {' / '}
                            <span>İnzibatçı Paneli</span>
                        </Typography>

                        <Box sx={{textAlign: 'center', mb: 5}}>
                            <Typography sx={{
                                fontSize: {xs: 22, md: 28}, fontWeight: 800, letterSpacing: 1,
                                color: GOV.textPrimary, textTransform: 'uppercase',
                            }}>
                                İnzibatçı Paneli
                            </Typography>
                        </Box>

                        <Box sx={{
                            display: 'grid', gap: 2,
                            gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'},
                        }}>
                            {children.map((child) => {
                                const href = child.key === 'istifadeciler'
                                    ? APP_ROUTES.INZIBATCI_ISTIFADECILER
                                    : child.key === 'icazelerin-idaresi'
                                        ? APP_ROUTES.INZIBATCI_ICAZELER
                                        : `${APP_ROUTES.INZIBATCI}/${child.key}`;
                                return (
                                    <ModuleCard
                                        key={child.id} module={child} variant="sub"
                                        onClick={() => router.push(href)}
                                    />
                                );
                            })}
                        </Box>

                        {children.length === 0 && (
                            <Typography sx={{fontSize: 13, color: GOV.textMuted, textAlign: 'center', py: 4}}>
                                Bu bölməyə girişiniz yoxdur.
                            </Typography>
                        )}
                    </Box>
                );
            }}
        </AdminShell>
    );
}
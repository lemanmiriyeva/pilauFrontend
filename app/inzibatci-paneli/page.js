"use client"
import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import {useRouter} from "next/navigation";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import ModuleCard from "@/components/atoms/ModuleCard";
import {findModuleByPath} from "@/app/ModuleTree";

export default function Page() {
    const router = useRouter();

    return (
        <AppShell>
            {({tree, user}) => {
                const result = findModuleByPath(tree, ['inzibatci-paneli']);
                const children = result?.node?.children || [];

                // Mərhələli təsdiqləmə icazə ekranları modul ağacı/DB-icazə sistemindən deyil,
                // birbaşa istifadəçi rollarından (is_org_admin / is_staff) asılıdır - ona görə
                // burada statik olaraq əlavə olunur (bax: workflow app, backend icazə yoxlaması
                // real qapıdır, bu kartlar sadəcə naviqasiya üçündür).
                const extraCards = [];
                if (user?.is_org_admin) {
                    extraCards.push({
                        id: 'qurum-yoxlamasi-icazeleri',
                        key: 'qurum-yoxlamasi-icazeleri',
                        title: 'Qurum yoxlaması icazələri',
                        description: 'Təşkilatınızın işçilərinə lisenziya kateqoriyaları üzrə yoxlama icazəsi verin (1-ci mərhələ).',
                        icon: 'gavel',
                        href: APP_ROUTES.QURUM_YOXLAMASI_ICAZELERI,
                    });
                }
                if (user?.is_staff) {
                    extraCards.push({
                        id: 'tesdiq-huquqlari',
                        key: 'tesdiq-huquqlari',
                        title: 'Təsdiq hüquqları',
                        description: 'İstifadəçilərə lisenziya kateqoriyaları üzrə yoxlama və son təsdiq hüququ verin (2-ci mərhələ).',
                        icon: 'gavel',
                        href: APP_ROUTES.TESDIQ_HUQUQLARI,
                    });
                    extraCards.push({
                        id: 'tesdiq-axini',
                        key: 'tesdiq-axini',
                        title: 'Təsdiq axını',
                        description: 'Hər sənəd növü üçün 1-ci mərhələni (Qurum/MSN) və hər iki mərhələnin konkret icraçısını təyin edin.',
                        icon: 'gavel',
                        href: APP_ROUTES.TESDIQ_AXINI,
                    });
                    extraCards.push({
                        id: 'departament-vezife',
                        key: 'departament-vezife',
                        title: 'Departamentlər və Vəzifələr',
                        description: 'Hər təşkilat üçün Şəxsi Kabinet və istifadəçi formalarında seçilə bilən departament/vəzifə kataloqunu idarə edin.',
                        icon: 'apartment',
                        href: APP_ROUTES.INZIBATCI_DEPARTAMENT_VEZIFE,
                    });
                }

                return (
                    <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
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
                            {extraCards.map((card) => (
                                <ModuleCard
                                    key={card.id} module={card} variant="sub"
                                    onClick={() => router.push(card.href)}
                                />
                            ))}
                        </Box>

                        {children.length === 0 && extraCards.length === 0 && (
                            <Typography sx={{fontSize: 13, color: GOV.textMuted, textAlign: 'center', py: 4}}>
                                Bu bölməyə girişiniz yoxdur.
                            </Typography>
                        )}
                    </Box>
                );
            }}
        </AppShell>
    );
}
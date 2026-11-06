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

    return (<AppShell>
        {({tree, user}) => {
            const result = findModuleByPath(tree, ['inzibatci-paneli']);

            const backendChildren = result?.node?.children || [];

            // "Operatorlar" bölməsi backend modul cədvəlindən asılı olmasın deyə burada əlavə olunur
            // (backend artıq eyni açarla qaytarırsa təkrar göstərilmir).
            const extra = [
                {
                    id: 'operatorlar',
                    key: 'operatorlar',
                    title: 'Operatorlar',
                    meta: 'Operatorların siyahısı, gündəlik statistika, dövr limiti və aç/söndür',
                    icon: 'manage_accounts',
                },
                {
                    id: 'nomenklatura',
                    key: 'nomenklatura',
                    title: 'Nomenklatura',
                    meta: 'Nomenklatura kataloqu, kateqoriyalar və təşkilatlara təyinat',
                    icon: 'inventory_2',
                },
            ].filter((e) => !backendChildren.some((ch) => ch.key === e.key));
            const children = result ? [...backendChildren, ...extra] : backendChildren;

            return (<Box
                sx={{
                    maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6},
                }}
            >
                {/* Breadcrumb */}
                <Typography
                    sx={{
                        fontSize: 12.5, color: GOV.textMuted, mb: 3,
                    }}
                >
                    <Link
                        component="button"
                        onClick={() => router.push(APP_ROUTES.HOME)}
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none',
                        }}
                    >
                        Ana Səhifə
                    </Link>

                    {' / '}

                    <span>
                                İnzibatçı Paneli
                            </span>
                </Typography>

                {/* Page title */}
                <Box
                    sx={{
                        textAlign: 'center', mb: 5,
                    }}
                >
                    <Typography
                        sx={{
                            fontSize: {
                                xs: 22, md: 28,
                            },
                            fontWeight: 800,
                            letterSpacing: 1,
                            color: GOV.textPrimary,
                            textTransform: 'uppercase',
                        }}
                    >
                        İnzibatçı Paneli
                    </Typography>
                </Box>

                {/* Submodules */}
                {children.length > 0 ? (<Box
                    sx={{
                        display: 'grid', gap: 2, gridTemplateColumns: {
                            xs: '1fr', sm: '1fr 1fr',
                        },
                    }}
                >
                    {children.map((child) => {
                        let href;

                        switch (child.key) {
                            case 'istifadeciler':
                                href = APP_ROUTES.INZIBATCI_ISTIFADECILER;
                                break;

                            case 'icazelerin-idaresi':
                                href = APP_ROUTES.INZIBATCI_ICAZELER;
                                break;

                            case 'departament-vezife':
                                href = APP_ROUTES.INZIBATCI_DEPARTAMENT_VEZIFE;
                                break;

                            case 'tesdiq-huquqlari':
                                href = APP_ROUTES.TESDIQ_HUQUQLARI;
                                break;

                            case 'tesdiq-axini':
                                href = '/inzibatci-paneli/tesdiq-axini';
                                break;

                            case 'operatorlar':
                                href = APP_ROUTES.OPERATORLAR;
                                break;

                            case 'nomenklatura':
                                href = APP_ROUTES.NOMENKLATURA;
                                break;

                            default:
                                href = `${APP_ROUTES.INZIBATCI}/${child.key}`;
                        }

                        return (<ModuleCard
                            key={child.id}
                            module={child}
                            variant="sub"
                            onClick={() => router.push(href)}
                        />);
                    })}
                </Box>) : (<Typography
                    sx={{
                        fontSize: 13, color: GOV.textMuted, textAlign: 'center', py: 4,
                    }}
                >
                    Bu bölməyə girişiniz yoxdur.
                </Typography>)}
                {(user?.is_staff || user?.is_superuser || user?.is_org_admin) && (
                    <Box sx={{mt: 3, textAlign: 'center'}}>
                        <Link
                            component="button" onClick={() => router.push('/inzibatci-paneli/modul-konfiqurasiyasi')}
                            sx={{fontSize: 13, fontWeight: 700, color: GOV.navySoft}}
                        >
                            Təşkilatların modul icazələri
                        </Link>
                    </Box>
                )}
            </Box>);
        }}
    </AppShell>);
}
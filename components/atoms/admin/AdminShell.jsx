"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import {useRouter, usePathname} from "next/navigation";
import {GOV} from "@/components/theme/govColors";
import {APP_ROUTES} from "@/components/constants";
import {getModuleIcon} from "@/components/theme/moduleIcons";

// "inzibatci-paneli" modulu və altları /inzibatci-paneli altında xüsusi səhifələrə,
// digər bütün modullar isə ümumi /modullar/<key> ağac-görünüşünə yönləndirilir.
function hrefForModule(module, parentKeys = []) {
    if (module.key === 'inzibatci-paneli') return APP_ROUTES.INZIBATCI;
    if (parentKeys[0] === 'inzibatci-paneli') {
        if (module.key === 'istifadeciler') return APP_ROUTES.INZIBATCI_ISTIFADECILER;
        if (module.key === 'icazelerin-idaresi') return APP_ROUTES.INZIBATCI_ICAZELER;
    }
    return `${APP_ROUTES.MODULES}/${[...parentKeys, module.key].join('/')}`;
}

function NavItem({module, parentKeys, depth, pathname, router}) {
    const Icon = getModuleIcon(module.icon);
    const hasChildren = module.children && module.children.length > 0;
    const href = hrefForModule(module, parentKeys);
    const isActive = pathname === href || (href !== APP_ROUTES.MODULES && pathname.startsWith(href + '/'));
    const containsActive = isActive || (hasChildren && pathname.startsWith(`${APP_ROUTES.MODULES}/${[...parentKeys, module.key].join('/')}`));
    const [open, setOpen] = useState(containsActive);

    return (
        <Box>
            <Box
                onClick={() => {
                    if (hasChildren) setOpen((o) => !o);
                    else router.push(href);
                }}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer',
                    pl: 2 + depth * 1.5, pr: 1.5, py: 1.1,
                    backgroundColor: isActive ? 'rgba(201,162,75,0.14)' : 'transparent',
                    borderLeft: `3px solid ${isActive ? GOV.gold : 'transparent'}`,
                    '&:hover': {backgroundColor: 'rgba(255,255,255,0.05)'},
                }}
            >
                <Icon sx={{fontSize: 17, color: isActive ? GOV.gold : GOV.textOnNavyMuted, flexShrink: 0}}/>
                <Typography sx={{
                    fontSize: 12.5, fontWeight: isActive ? 700 : 500, flexGrow: 1,
                    color: isActive ? '#FFFFFF' : GOV.textOnNavyMuted,
                    whiteSpace: 'normal', lineHeight: 1.3,
                }}>
                    {module.title}
                </Typography>
                {hasChildren && (
                    <KeyboardArrowDownIcon sx={{
                        fontSize: 16, color: GOV.textOnNavyMuted,
                        transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .15s',
                    }}/>
                )}
            </Box>
            {hasChildren && (
                <Collapse in={open} timeout="auto" unmountOnExit>
                    {module.children.map((child) => (
                        <NavItem
                            key={child.id} module={child} parentKeys={[...parentKeys, module.key]}
                            depth={depth + 1} pathname={pathname} router={router}
                        />
                    ))}
                </Collapse>
            )}
        </Box>
    );
}

export default function AdminSidebar({tree, collapsed, onToggleCollapsed}) {
    const router = useRouter();
    const pathname = usePathname();

    if (collapsed) {
        return (
            <Box sx={{
                width: 56, flexShrink: 0, minHeight: '100%', backgroundColor: GOV.navy,
                borderRight: `1px solid ${GOV.navySoft}`, py: 1.5,
            }}>
                <Box sx={{display: 'flex', justifyContent: 'center', px: 1, pb: 1}}>
                    <MenuIcon
                        onClick={onToggleCollapsed}
                        sx={{fontSize: 20, color: GOV.textOnNavyMuted, cursor: 'pointer'}}
                    />
                </Box>
            </Box>
        );
    }

    return (
        <Box sx={{
            width: 260, flexShrink: 0, minHeight: '100%', backgroundColor: GOV.navy,
            borderRight: `1px solid ${GOV.navySoft}`, py: 1.5,
        }}>
            <Box sx={{display: 'flex', justifyContent: 'flex-end', px: 1.5, pb: 0.5}}>
                <MenuIcon
                    onClick={onToggleCollapsed}
                    sx={{fontSize: 20, color: GOV.textOnNavyMuted, cursor: 'pointer'}}
                />
            </Box>

            <Box
                onClick={() => router.push(APP_ROUTES.HOME)}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer',
                    pl: 2, pr: 1.5, py: 1.1, mb: 0.5,
                    backgroundColor: pathname === APP_ROUTES.HOME ? 'rgba(201,162,75,0.14)' : 'transparent',
                    borderLeft: `3px solid ${pathname === APP_ROUTES.HOME ? GOV.gold : 'transparent'}`,
                    '&:hover': {backgroundColor: 'rgba(255,255,255,0.05)'},
                }}
            >
                <HomeOutlinedIcon sx={{
                    fontSize: 17, flexShrink: 0,
                    color: pathname === APP_ROUTES.HOME ? GOV.gold : GOV.textOnNavyMuted,
                }}/>
                <Typography sx={{
                    fontSize: 12.5, fontWeight: pathname === APP_ROUTES.HOME ? 700 : 500,
                    color: pathname === APP_ROUTES.HOME ? '#FFFFFF' : GOV.textOnNavyMuted,
                    textTransform: 'uppercase',
                }}>
                    Ana Səhifə
                </Typography>
            </Box>

            {(tree || []).map((m) => (
                <NavItem key={m.id} module={m} parentKeys={[]} depth={0} pathname={pathname} router={router}/>
            ))}
        </Box>
    );
}
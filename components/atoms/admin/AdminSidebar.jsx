"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CloseFullscreenIcon from '@mui/icons-material/CloseFullscreen';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CloseIcon from '@mui/icons-material/Close';
import {useRouter, usePathname} from "next/navigation";
import {GOV} from "@/components/theme/govColors";
import {APP_ROUTES} from "@/components/constants";

const SIDEBAR_WIDTH = 300;
const RAIL_WIDTH = 56;
const CIRCLE = 22;

function hrefForModule(module, parentKeys = []) {
    if (module.key === 'inzibatci-paneli') return APP_ROUTES.INZIBATCI;
    if (parentKeys[0] === 'inzibatci-paneli') {
        if (module.key === 'istifadeciler') return APP_ROUTES.INZIBATCI_ISTIFADECILER;
        if (module.key === 'icazelerin-idaresi') return APP_ROUTES.INZIBATCI_ICAZELER;
    }
    return `${APP_ROUTES.MODULES}/${[...parentKeys, module.key].join('/')}`;
}

function NavIcon({open, hasChildren}) {
    const Icon = hasChildren && open ? KeyboardArrowDownIcon : ChevronRightIcon;
    return (
        <Box sx={{
            width: CIRCLE, height: CIRCLE, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(180deg, ${GOV.navIconBgTop} 0%, ${GOV.navIconBgBottom} 100%)`,
        }}>
            <Icon sx={{fontSize: 16, color: GOV.navIconFg}}/>
        </Box>
    );
}

function NavItem({module, parentKeys, depth, pathname, onNavigate}) {
    const hasChildren = module.children && module.children.length > 0;
    const href = hrefForModule(module, parentKeys);
    const modulePath = `${APP_ROUTES.MODULES}/${[...parentKeys, module.key].join('/')}`;
    const isActive = pathname === href || (href !== APP_ROUTES.MODULES && pathname.startsWith(href + '/'));
    const containsActive = isActive || (hasChildren && pathname.startsWith(modulePath));
    const [open, setOpen] = useState(containsActive);

    if (depth > 0) {
        return (
            <Box sx={{position: 'relative', pl: `${CIRCLE / 2 + 42}px`, pr: 2}}>
                <Box sx={{
                    position: 'absolute', left: `${CIRCLE / 2 + 17}px`, top: 0, bottom: 0,
                    borderLeft: `1.5px dashed ${GOV.textOnNavyMuted}`, opacity: 0.55,
                }}/>
                <Box
                    onClick={() => onNavigate(href)}
                    sx={{py: 1.3, cursor: 'pointer', '&:hover .navlabel': {color: '#FFFFFF'}}}
                >
                    <Typography className="navlabel" sx={{
                        fontSize: 11.5, fontWeight: isActive ? 700 : 500,
                        color: isActive ? '#FFFFFF' : GOV.textOnNavyMuted,
                        textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1.3,
                        textDecoration: isActive ? 'underline' : 'none',
                    }}>
                        {module.title}
                    </Typography>
                </Box>
            </Box>
        );
    }

    return (
        <Box>
            <Box
                onClick={() => {
                    if (hasChildren) setOpen((o) => !o);
                    else onNavigate(href);
                }}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                    pl: 2.25, pr: 2, py: 1.5,
                    '&:hover .navlabel': {color: '#FFFFFF'},
                }}
            >
                <NavIcon open={open} hasChildren={hasChildren}/>
                <Typography className="navlabel" sx={{
                    fontSize: 12.5, fontWeight: isActive ? 700 : 600, flexGrow: 1,
                    color: isActive ? '#FFFFFF' : GOV.textOnNavyMuted,
                    textTransform: 'uppercase', letterSpacing: 0.3, lineHeight: 1.3,
                    textDecoration: isActive ? 'underline' : 'none',
                }}>
                    {module.title}
                </Typography>
            </Box>
            {hasChildren && (
                <Collapse in={open} timeout={220} unmountOnExit>
                    <Box sx={{pb: 0.5}}>
                        {module.children.map((child) => (
                            <NavItem
                                key={child.id} module={child} parentKeys={[...parentKeys, module.key]}
                                depth={depth + 1} pathname={pathname} onNavigate={onNavigate}
                            />
                        ))}
                    </Box>
                </Collapse>
            )}
        </Box>
    );
}

function NavList({tree, pathname, onNavigate}) {
    return (
        <Box sx={{py: 1.5, width: SIDEBAR_WIDTH}}>
            <Box
                onClick={() => onNavigate(APP_ROUTES.HOME)}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                    pl: 2.25, pr: 2, py: 1.3,
                    '&:hover .navlabel': {color: '#FFFFFF'},
                }}
            >
                <NavIcon open={false} hasChildren={false}/>
                <Typography className="navlabel" sx={{
                    fontSize: 12.5, fontWeight: pathname === APP_ROUTES.HOME ? 700 : 600,
                    color: pathname === APP_ROUTES.HOME ? '#FFFFFF' : GOV.textOnNavyMuted,
                    textTransform: 'uppercase', letterSpacing: 0.3,
                    textDecoration: pathname === APP_ROUTES.HOME ? 'underline' : 'none',
                }}>
                    Ana Səhifə
                </Typography>
            </Box>

            {(tree || []).map((m) => (
                <NavItem key={m.id} module={m} parentKeys={[]} depth={0} pathname={pathname} onNavigate={onNavigate}/>
            ))}
        </Box>
    );
}

export default function AdminSidebar({tree, collapsed, onToggleCollapsed, mobileOpen, onCloseMobile}) {
    const router = useRouter();
    const pathname = usePathname();

    const navigate = (href) => {
        router.push(href);
        onCloseMobile && onCloseMobile();
    };

    return (
        <>
            <Box sx={{
                display: {xs: 'none', sm: 'block'},
                width: collapsed ? RAIL_WIDTH : SIDEBAR_WIDTH,
                flexShrink: 0, minHeight: '100%', backgroundColor: GOV.navy,
                borderRight: `1px solid ${GOV.navDivider}`,
                overflow: 'hidden',
                transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                <Box sx={{
                    display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end',
                    px: collapsed ? 0 : 2, py: 1.25,
                    borderBottom: `1px solid ${GOV.navDivider}`,
                    transition: 'padding 0.28s ease',
                }}>
                    {collapsed ? (
                        <OpenInFullIcon
                            onClick={onToggleCollapsed}
                            sx={{fontSize: 17, color: GOV.textOnNavyMuted, cursor: 'pointer'}}
                        />
                    ) : (
                        <CloseFullscreenIcon
                            onClick={onToggleCollapsed}
                            sx={{fontSize: 17, color: GOV.textOnNavyMuted, cursor: 'pointer'}}
                        />
                    )}
                </Box>

                <Box sx={{
                    opacity: collapsed ? 0 : 1,
                    transition: collapsed ? 'opacity 0.12s ease' : 'opacity 0.22s ease 0.08s',
                }}>
                    <NavList tree={tree} pathname={pathname} onNavigate={(href) => router.push(href)}/>
                </Box>
            </Box>

            <Box
                onClick={onCloseMobile}
                sx={{
                    display: {xs: 'block', sm: 'none'},
                    position: 'fixed', inset: 0, zIndex: 1200,
                    backgroundColor: 'rgba(0,0,0,0.55)',
                    opacity: mobileOpen ? 1 : 0,
                    pointerEvents: mobileOpen ? 'auto' : 'none',
                    transition: 'opacity 0.25s ease',
                }}
            />
            <Box sx={{
                display: {xs: 'block', sm: 'none'},
                position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 1201,
                width: Math.min(SIDEBAR_WIDTH, 300), maxWidth: '85vw',
                backgroundColor: GOV.navy, overflowY: 'auto',
                transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: mobileOpen ? '4px 0 24px rgba(0,0,0,0.35)' : 'none',
            }}>
                <Box sx={{
                    display: 'flex', justifyContent: 'flex-end', px: 2, py: 1.25,
                    borderBottom: `1px solid ${GOV.navDivider}`,
                }}>
                    <CloseIcon
                        onClick={onCloseMobile}
                        sx={{fontSize: 20, color: GOV.textOnNavyMuted, cursor: 'pointer'}}
                    />
                </Box>
                <NavList tree={tree} pathname={pathname} onNavigate={navigate}/>
            </Box>
        </>
    );
}
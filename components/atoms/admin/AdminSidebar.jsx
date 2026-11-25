"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import CloseIcon from '@mui/icons-material/Close';
import {useRouter, usePathname} from "next/navigation";
import {APP_ROUTES} from "@/components/constants";
import {getModuleIcon} from "@/components/theme/moduleIcons";

const SIDEBAR_WIDTH = 296;
const RAIL_WIDTH = 84;

/* Yeni sidebar dizaynı: tünd mavi şüşə kart, ikon kafelləri, aktiv bənd bənövşəyi,
 * altda istifadəçi kartı. Rənglər burada yerlidir (digər səhifələrə təsir etmir). */
const S = {
    bgTop: '#0B1E4A',
    bgBottom: '#050D26',
    border: 'rgba(255,255,255,0.08)',
    tile: 'rgba(255,255,255,0.07)',
    tileBorder: 'rgba(255,255,255,0.06)',
    text: '#E8EDF8',
    muted: '#8D9BC0',
    activeTop: '#8B6CF6',
    activeBottom: '#5B3FD9',
    activeBg: 'linear-gradient(90deg, rgba(139,108,246,0.30) 0%, rgba(139,108,246,0.08) 100%)',
    hover: 'rgba(255,255,255,0.05)',
};

function hrefForModule(module, parentKeys = []) {
    if (module.key === 'inzibatci-paneli') return APP_ROUTES.INZIBATCI;
    if (parentKeys.length === 0) {
        if (module.key === 'dovriyyeler') return APP_ROUTES.DOVRIYYELER;
        if (module.key === 'partnyor-sirketler') return APP_ROUTES.PARTNYORLAR;
    }
    if (parentKeys[0] === 'inzibatci-paneli') {
        if (module.key === 'istifadeciler') return APP_ROUTES.INZIBATCI_ISTIFADECILER;
        if (module.key === 'icazelerin-idaresi') return APP_ROUTES.INZIBATCI_ICAZELER;
        if (module.key === 'departament-vezife') return APP_ROUTES.INZIBATCI_DEPARTAMENT_VEZIFE;
        if (module.key === 'tesdiq-huquqlari') return APP_ROUTES.TESDIQ_HUQUQLARI;
        if (module.key === 'tesdiq-axini') return APP_ROUTES.TESDIQ_AXINI;
        if (module.key === 'operatorlar') return APP_ROUTES.OPERATORLAR;
        if (module.key === 'nomenklatura') return APP_ROUTES.NOMENKLATURA;
    }
    return `${APP_ROUTES.MODULES}/${[...parentKeys, module.key].join('/')}`;
}

function IconTile({Icon, active, size = 38}) {
    return (
        <Box sx={{
            width: size, height: size, borderRadius: '12px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: active
                ? `linear-gradient(180deg, ${S.activeTop} 0%, ${S.activeBottom} 100%)`
                : S.tile,
            border: `1px solid ${active ? 'transparent' : S.tileBorder}`,
            boxShadow: active ? '0 6px 16px rgba(91,63,217,0.45)' : 'none',
            transition: 'background 0.2s ease',
        }}>
            <Icon sx={{fontSize: 20, color: active ? '#fff' : S.text}}/>
        </Box>
    );
}

function NavRow({Icon, label, active, hasChildren, open, onClick, collapsed}) {
    return (
        <Box sx={{position: 'relative', px: 1.5, py: 0.4}}>
            {active && (
                <Box sx={{
                    position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderRadius: '0 3px 3px 0',
                    background: S.activeTop,
                }}/>
            )}
            <Box
                onClick={onClick}
                title={collapsed ? label : undefined}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer',
                    px: collapsed ? 0.5 : 1, py: 0.9, borderRadius: '14px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    background: active ? S.activeBg : 'transparent',
                    '&:hover': {background: active ? S.activeBg : S.hover},
                }}
            >
                <IconTile Icon={Icon} active={active}/>
                {!collapsed && (
                    <>
                        <Typography sx={{
                            fontSize: 14.5, fontWeight: active ? 700 : 600, color: active ? '#fff' : S.text,
                            flexGrow: 1, lineHeight: 1.25,
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {label}
                        </Typography>
                        {hasChildren && (
                            <ExpandMoreIcon sx={{
                                fontSize: 20, color: S.muted,
                                transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease',
                            }}/>
                        )}
                    </>
                )}
            </Box>
        </Box>
    );
}

function NavItem({module, parentKeys, depth, pathname, onNavigate, collapsed}) {
    const hasChildren = module.children && module.children.length > 0;
    const href = hrefForModule(module, parentKeys);
    const modulePath = `${APP_ROUTES.MODULES}/${[...parentKeys, module.key].join('/')}`;
    const isActive = pathname === href || (href !== APP_ROUTES.MODULES && pathname.startsWith(href + '/'));
    const containsActive = isActive || (hasChildren && pathname.startsWith(modulePath));
    const [open, setOpen] = useState(containsActive);

    if (depth > 0) {
        return (
            <Box sx={{position: 'relative', pl: '34px', pr: 2.5}}>
                <Box sx={{
                    position: 'absolute', left: '34px', top: 0, bottom: 0,
                    borderLeft: `1.5px solid ${S.border}`,
                }}/>
                <Box
                    onClick={() => onNavigate(href)}
                    sx={{
                        ml: 2.5, my: 0.25, px: 1.5, py: 0.9, borderRadius: '10px', cursor: 'pointer',
                        background: isActive ? S.activeBg : 'transparent',
                        '&:hover': {background: isActive ? S.activeBg : S.hover},
                    }}
                >
                    <Typography sx={{
                        fontSize: 13, fontWeight: isActive ? 700 : 500, lineHeight: 1.3,
                        color: isActive ? '#fff' : S.muted,
                    }}>
                        {module.title}
                    </Typography>
                </Box>
            </Box>
        );
    }

    const Icon = getModuleIcon(module.icon);
    return (
        <Box>
            <NavRow
                Icon={Icon} label={module.title} active={containsActive && !hasChildren ? true : isActive}
                hasChildren={hasChildren} open={open} collapsed={collapsed}
                onClick={() => {
                    if (hasChildren && !collapsed) setOpen((o) => !o);
                    else onNavigate(href);
                }}
            />
            {hasChildren && !collapsed && (
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

function NavList({tree, pathname, onNavigate, collapsed}) {
    return (
        <Box sx={{py: 1}}>
            {!collapsed && (
                <Typography sx={{
                    px: 3, pt: 1.5, pb: 1, fontSize: 11.5, fontWeight: 800, letterSpacing: 1.4, color: S.muted,
                }}>
                    MODULLAR
                </Typography>
            )}
            <NavRow
                Icon={HomeOutlinedIcon} label="Ana səhifə" collapsed={collapsed}
                active={pathname === APP_ROUTES.HOME} onClick={() => onNavigate(APP_ROUTES.HOME)}
            />
            {(tree || []).map((m) => (
                <NavItem
                    key={m.id} module={m} parentKeys={[]} depth={0}
                    pathname={pathname} onNavigate={onNavigate} collapsed={collapsed}
                />
            ))}
        </Box>
    );
}

function UserCard({user, collapsed}) {
    if (!user) return null;
    const name = `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.username;
    const role = (user.is_superuser || user.is_staff)
        ? 'Sistem administratoru'
        : (user.position_name || user.position?.name || user.organization_name || user.email || '');
    const initials = ((user.first_name || '')[0] || '') + ((user.last_name || '')[0] || '') || (user.username || '?')[0];
    return (
        <Box sx={{p: 1.5, borderTop: `1px solid ${S.border}`}}>
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.25, p: collapsed ? 0.75 : 1.25, borderRadius: '16px',
                background: 'rgba(255,255,255,0.05)', border: `1px solid ${S.tileBorder}`,
                justifyContent: collapsed ? 'center' : 'flex-start',
            }}>
                <Avatar
                    src={user.photo || user.avatar || undefined}
                    sx={{width: 38, height: 38, fontSize: 14, fontWeight: 700, bgcolor: S.activeBottom}}
                >
                    {initials.toUpperCase()}
                </Avatar>
                {!collapsed && (
                    <Box sx={{minWidth: 0}}>
                        <Typography noWrap sx={{fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.25}}>{name}</Typography>
                        <Typography noWrap sx={{fontSize: 12, color: S.muted, lineHeight: 1.3}}>{role}</Typography>
                    </Box>
                )}
            </Box>
        </Box>
    );
}

function Panel({tree, pathname, onNavigate, collapsed, user}) {
    return (
        <Box sx={{display: 'flex', flexDirection: 'column', height: '100%'}}>
            <Box sx={{flexGrow: 1, overflowY: 'auto', overflowX: 'hidden', '&::-webkit-scrollbar': {width: 4},
                '&::-webkit-scrollbar-thumb': {background: 'rgba(255,255,255,0.18)', borderRadius: 4}}}>
                <NavList tree={tree} pathname={pathname} onNavigate={onNavigate} collapsed={collapsed}/>
            </Box>
            <UserCard user={user} collapsed={collapsed}/>
        </Box>
    );
}

export default function AdminSidebar({tree, user, collapsed, onToggleCollapsed, mobileOpen, onCloseMobile}) {
    const router = useRouter();
    const pathname = usePathname();

    const navigate = (href) => {
        router.push(href);
        onCloseMobile && onCloseMobile();
    };

    return (
        <>
            {/* Desktop */}
            <Box sx={{
                display: {xs: 'none', sm: 'block'},
                width: (collapsed ? RAIL_WIDTH : SIDEBAR_WIDTH) + 24, flexShrink: 0,
                transition: 'width 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
                <Box sx={{
                    position: 'sticky', top: 74, m: '12px', ml: '12px',
                    height: 'calc(100vh - 98px)', minHeight: 420,
                    borderRadius: '26px', overflow: 'visible',
                    background: `linear-gradient(180deg, ${S.bgTop} 0%, ${S.bgBottom} 100%)`,
                    border: `1px solid ${S.border}`,
                    boxShadow: '0 18px 40px rgba(5,13,38,0.35)',
                }}>
                    <Box sx={{height: '100%', borderRadius: '26px', overflow: 'hidden'}}>
                        <Panel tree={tree} pathname={pathname} onNavigate={(href) => router.push(href)}
                               collapsed={collapsed} user={user}/>
                    </Box>
                    <Box
                        onClick={onToggleCollapsed}
                        sx={{
                            position: 'absolute', top: 18, right: -14, width: 28, height: 28, borderRadius: '50%',
                            background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.25)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2,
                        }}
                    >
                        {collapsed
                            ? <ChevronRightIcon sx={{fontSize: 20, color: '#0B1E4A'}}/>
                            : <ChevronLeftIcon sx={{fontSize: 20, color: '#0B1E4A'}}/>}
                    </Box>
                </Box>
            </Box>

            {/* Mobil */}
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
                width: SIDEBAR_WIDTH, maxWidth: '85vw',
                background: `linear-gradient(180deg, ${S.bgTop} 0%, ${S.bgBottom} 100%)`,
                transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: mobileOpen ? '4px 0 24px rgba(0,0,0,0.35)' : 'none',
            }}>
                <Box sx={{display: 'flex', justifyContent: 'flex-end', px: 2, py: 1.25}}>
                    <CloseIcon onClick={onCloseMobile} sx={{fontSize: 22, color: S.muted, cursor: 'pointer'}}/>
                </Box>
                <Box sx={{height: 'calc(100% - 52px)'}}>
                    <Panel tree={tree} pathname={pathname} onNavigate={navigate} collapsed={false} user={user}/>
                </Box>
            </Box>
        </>
    );
}

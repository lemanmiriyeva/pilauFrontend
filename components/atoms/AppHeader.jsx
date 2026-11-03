"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import Divider from '@mui/material/Divider';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {useRouter} from "next/navigation";
import {GOV} from "@/components/theme/govColors";
import {APP_ROUTES} from "@/components/constants";
import Image from "next/image";
import logo from "@/app/logo.png";
import NotificationBell from "@/components/atoms/NotificationBell";

const menuItemSx = {
    px: 2, py: 1, mx: 0.75, borderRadius: 1.5, fontSize: 13.5, fontWeight: 600, color: GOV.textPrimary,
    '&:hover': {backgroundColor: GOV.pageBg},
};
const iconSx = {minWidth: 34, color: GOV.textMuted};

function initialsOf(user) {
    const a = (user?.first_name || '')[0] || '';
    const b = (user?.last_name || '')[0] || '';
    return (a + b).toUpperCase() || (user?.username || '?')[0].toUpperCase();
}

export default function AppHeader({user, onMenuClick}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const router = useRouter();
    const open = Boolean(anchorEl);
    const [review, setReview] = useState(null);
    const [reviewLoaded, setReviewLoaded] = useState(false);

    // Menyu ilk dəfə açılanda operator olub-olmadığını yoxla (səhifə açılışında əlavə sorğu getmir)
    const go = (href) => {
        setAnchorEl(null);
        router.push(href);
    };

    const openMenu = (e) => {
        setAnchorEl(e.currentTarget);
        if (!reviewLoaded) {
            setReviewLoaded(true);
            service_api.get(NEXT_API_ENDPOINTS.LICENSES.REVIEW_SUMMARY)
                .then((r) => setReview(r.data))
                .catch(() => {});
        }
    };

    return (
        <Box sx={{
            position: 'sticky', top: 0, zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: GOV.navy, color: GOV.textOnNavy, px: {xs: 1.5, md: 4}, py: 1.5,
            boxShadow: '0 2px 10px rgba(2, 6, 36, 0.22)',
        }}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                {onMenuClick && (
                    <IconButton onClick={onMenuClick} aria-label="Menyu"
                                sx={{display: {xs: 'inline-flex', sm: 'none'}, color: GOV.textOnNavy}}>
                        <MenuIcon/>
                    </IconButton>
                )}
                <Box onClick={() => {
                    router.push(APP_ROUTES.HOME);
                }} sx={{display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer'}}>
                    <Image width={250} height={44} src={logo} alt="Pilau" style={{width: 'auto', height: 44}}/>
                </Box>
            </Box>

            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                <NotificationBell/>
                <Box
                    onClick={openMenu}
                    sx={{
                        display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                        backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 5, px: 1, py: 0.5,
                        '&:hover': {backgroundColor: 'rgba(255,255,255,0.1)'},
                    }}
                >
                    <Avatar sx={{width: 26, height: 26, fontSize: 12, backgroundColor: GOV.gold, color: GOV.navy}}>
                        {initialsOf(user)}
                    </Avatar>
                    <Typography sx={{fontSize: 13, fontWeight: 600, textTransform: 'uppercase', display: {xs: 'none', sm: 'block'}}}>
                        {user?.first_name} {user?.last_name}
                    </Typography>
                    <KeyboardArrowDownIcon sx={{fontSize: 18, color: GOV.textOnNavyMuted}}/>
                </Box>
            </Box>

            <Menu
                anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                transformOrigin={{vertical: 'top', horizontal: 'right'}}
                slotProps={{
                    paper: {
                        elevation: 0,
                        sx: {
                            mt: 1, minWidth: 250, borderRadius: 2, overflow: 'hidden',
                            border: `1px solid ${GOV.cardBorder}`,
                            boxShadow: '0 12px 32px rgba(20, 27, 51, 0.14)',
                        },
                    },
                }}
                MenuListProps={{sx: {py: 0}}}
            >
                {/* İstifadəçi məlumatı */}
                <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.75, backgroundColor: GOV.pageBg}}>
                    <Avatar sx={{width: 36, height: 36, fontSize: 14, fontWeight: 700, backgroundColor: GOV.gold, color: GOV.navy}}>
                        {initialsOf(user)}
                    </Avatar>
                    <Box sx={{minWidth: 0}}>
                        <Typography noWrap sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>
                            {`${user?.first_name || ''} ${user?.last_name || ''}`.trim() || user?.username}
                        </Typography>
                        <Typography noWrap sx={{fontSize: 11.5, color: GOV.textMuted}}>
                            {user?.organization_name || user?.organization_detail?.full_name || user?.email || user?.username}
                        </Typography>
                    </Box>
                </Box>
                <Divider/>

                <Box sx={{py: 0.75}}>
                    <MenuItem sx={menuItemSx} onClick={() => go(APP_ROUTES.SENEDLERIM)}>
                        <ListItemIcon sx={iconSx}><DescriptionOutlinedIcon fontSize="small"/></ListItemIcon>
                        Sənədlərim
                    </MenuItem>
                    {review?.is_operator && (
                        <MenuItem sx={menuItemSx} onClick={() => go(`${APP_ROUTES.SENEDLERIM}?tab=operator`)}>
                            <ListItemIcon sx={iconSx}><FactCheckOutlinedIcon fontSize="small"/></ListItemIcon>
                            <Box sx={{flexGrow: 1}}>Yoxlanacaq sənədlər</Box>
                            {review.operator_pending > 0 && (
                                <Box sx={{
                                    minWidth: 20, height: 20, px: 0.75, ml: 2, borderRadius: 10, fontSize: 11.5,
                                    fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    backgroundColor: GOV.gold, color: GOV.navy,
                                }}>
                                    {review.operator_pending}
                                </Box>
                            )}
                        </MenuItem>
                    )}
                    <MenuItem sx={menuItemSx} onClick={() => go(APP_ROUTES.PROFILE)}>
                        <ListItemIcon sx={iconSx}><PersonOutlineIcon fontSize="small"/></ListItemIcon>
                        Şəxsi kabinet
                    </MenuItem>
                </Box>

                <Divider/>
                <Box sx={{py: 0.75}}>
                    <MenuItem sx={{...menuItemSx, color: '#B42318', '&:hover': {backgroundColor: '#FDECEC'}}}
                              onClick={() => go(APP_ROUTES.SIGNOUT)}>
                        <ListItemIcon sx={{...iconSx, color: '#B42318'}}><LogoutOutlinedIcon fontSize="small"/></ListItemIcon>
                        Çıxış
                    </MenuItem>
                </Box>
            </Menu>
        </Box>
    );
}
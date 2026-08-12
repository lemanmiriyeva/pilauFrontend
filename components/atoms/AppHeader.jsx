"use client"
import React, {useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import {useRouter} from "next/navigation";
import {GOV} from "@/components/theme/govColors";
import {APP_ROUTES} from "@/components/constants";
import Image from "next/image";
import logo from "@/app/logo.svg";

function initialsOf(user) {
    const a = (user?.first_name || '')[0] || '';
    const b = (user?.last_name || '')[0] || '';
    return (a + b).toUpperCase() || (user?.username || '?')[0].toUpperCase();
}

export default function AppHeader({user}) {
    const [anchorEl, setAnchorEl] = useState(null);
    const router = useRouter();
    const open = Boolean(anchorEl);

    return (
        <Box sx={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: GOV.navy, color: GOV.textOnNavy, px: {xs: 2, md: 4}, py: 1.5,
        }}>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1.5}}>
                <Image src={logo} alt="" height={34} style={{width: 'auto', height: 34}}/>
            </Box>

            <Box
                onClick={(e) => setAnchorEl(e.currentTarget)}
                sx={{
                    display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
                    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 5, px: 1, py: 0.5,
                    '&:hover': {backgroundColor: 'rgba(255,255,255,0.1)'},
                }}
            >
                <Avatar sx={{width: 26, height: 26, fontSize: 12, backgroundColor: GOV.gold, color: GOV.navy}}>
                    {initialsOf(user)}
                </Avatar>
                <Typography sx={{fontSize: 13, fontWeight: 600, textTransform: 'uppercase'}}>
                    {user?.first_name} {user?.last_name}
                </Typography>
                <KeyboardArrowDownIcon sx={{fontSize: 18, color: GOV.textOnNavyMuted}}/>
            </Box>

            <Menu anchorEl={anchorEl} open={open} onClose={() => setAnchorEl(null)}
                  anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                  transformOrigin={{vertical: 'top', horizontal: 'right'}}>
                <MenuItem onClick={() => {
                    setAnchorEl(null);
                    router.push(APP_ROUTES.PROFILE);
                }}>
                    <ListItemIcon><PersonOutlineIcon fontSize="small"/></ListItemIcon>
                    Şəxsi kabinet
                </MenuItem>
                <MenuItem onClick={() => {
                    setAnchorEl(null);
                    router.push(APP_ROUTES.SIGNOUT);
                }}>
                    <ListItemIcon><LogoutOutlinedIcon fontSize="small"/></ListItemIcon>
                    Çıxış
                </MenuItem>
            </Menu>
        </Box>
    );
}
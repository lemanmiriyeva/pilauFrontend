"use client"
import React, {useEffect, useRef, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import CircularProgress from '@mui/material/CircularProgress';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import {useRouter} from "next/navigation";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {GOV} from "@/components/theme/govColors";
import {APP_ROUTES} from "@/components/constants";

const POLL_MS = 30000;

function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'indicə';
    if (mins < 60) return `${mins} dəq əvvəl`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} saat əvvəl`;
    return `${Math.floor(hrs / 24)} gün əvvəl`;
}

export default function NotificationBell() {
    const router = useRouter();
    const [anchorEl, setAnchorEl] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const pollRef = useRef(null);

    const fetchUnreadOnly = async () => {
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.WORKFLOW.NOTIFICATIONS);
            setUnreadCount(res.data?.unread_count || 0);
        } catch (e) {
            // sakit fail - bell sadəcə köhnə sayı göstərməyə davam edir
        }
    };

    const fetchFull = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.WORKFLOW.NOTIFICATIONS);
            setUnreadCount(res.data?.unread_count || 0);
            setItems(res.data?.results || []);
            setLoaded(true);
        } catch (e) {
            // sakit fail
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUnreadOnly();
        pollRef.current = setInterval(fetchUnreadOnly, POLL_MS);
        return () => clearInterval(pollRef.current);
    }, []);

    const handleOpen = (e) => {
        setAnchorEl(e.currentTarget);
        fetchFull();
    };

    const handleItemClick = async (n) => {
        setAnchorEl(null);
        if (!n.is_read) {
            setItems((prev) => prev.map((i) => (i.id === n.id ? {...i, is_read: true} : i)));
            setUnreadCount((c) => Math.max(0, c - 1));
            service_api.post(NEXT_API_ENDPOINTS.WORKFLOW.NOTIFICATIONS_READ(n.id)).catch(() => {
            });
        }
        if (n.link) router.push(n.link);
    };

    const handleMarkAllRead = async (e) => {
        e.stopPropagation();
        setItems((prev) => prev.map((i) => ({...i, is_read: true})));
        setUnreadCount(0);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.WORKFLOW.NOTIFICATIONS_READ_ALL);
        } catch (e2) {
            fetchFull();
        }
    };

    return (
        <>
            <IconButton onClick={handleOpen} sx={{color: GOV.textOnNavy}}>
                <Badge badgeContent={unreadCount} max={99} color="error">
                    <NotificationsNoneOutlinedIcon sx={{fontSize: 22}}/>
                </Badge>
            </IconButton>

            <Menu
                anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
                anchorOrigin={{vertical: 'bottom', horizontal: 'right'}}
                transformOrigin={{vertical: 'top', horizontal: 'right'}}
                slotProps={{paper: {sx: {width: 360, maxHeight: 440}}}}
            >
                <Box sx={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 2, py: 1.25, borderBottom: `1px solid ${GOV.cardBorder}`,
                }}>
                    <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>
                        Bildirişlər
                    </Typography>
                    {unreadCount > 0 && (
                        <Box onClick={handleMarkAllRead} sx={{
                            display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer',
                            fontSize: 12, color: GOV.navyMid, '&:hover': {textDecoration: 'underline'},
                        }}>
                            <DoneAllIcon sx={{fontSize: 15}}/>
                            Hamısını oxu
                        </Box>
                    )}
                </Box>

                {loading && !loaded ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                        <CircularProgress size={22}/>
                    </Box>
                ) : items.length === 0 ? (
                    <Box sx={{textAlign: 'center', py: 4, px: 2}}>
                        <Typography sx={{fontSize: 13, color: GOV.textMuted}}>
                            Bildiriş yoxdur.
                        </Typography>
                    </Box>
                ) : (
                    items.map((n) => (
                        <Box
                            key={n.id} onClick={() => handleItemClick(n)}
                            sx={{
                                px: 2, py: 1.25, cursor: 'pointer',
                                borderBottom: `1px solid ${GOV.cardBorder}`,
                                backgroundColor: n.is_read ? 'transparent' : `${GOV.gold}0F`,
                                '&:hover': {backgroundColor: `${GOV.gold}1A`},
                                '&:last-of-type': {borderBottom: 'none'},
                            }}
                        >
                            <Box sx={{display: 'flex', alignItems: 'flex-start', gap: 1}}>
                                {!n.is_read && (
                                    <Box sx={{
                                        width: 7, height: 7, borderRadius: '50%', backgroundColor: GOV.gold,
                                        mt: 0.6, flexShrink: 0,
                                    }}/>
                                )}
                                <Box sx={{flex: 1, minWidth: 0, ml: n.is_read ? 2 : 0}}>
                                    <Typography sx={{fontSize: 12.5, fontWeight: n.is_read ? 500 : 700, color: GOV.textPrimary}}>
                                        {n.title}
                                    </Typography>
                                    {n.body && (
                                        <Typography sx={{fontSize: 12, color: GOV.textMuted, mt: 0.25}}>
                                            {n.body}
                                        </Typography>
                                    )}
                                    <Typography sx={{fontSize: 11, color: GOV.textMuted, mt: 0.5}}>
                                        {timeAgo(n.created_at)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    ))
                )}

                <Box
                    onClick={() => {
                        setAnchorEl(null);
                        router.push(APP_ROUTES.BILDIRISLER);
                    }}
                    sx={{
                        textAlign: 'center', py: 1.25, cursor: 'pointer', fontSize: 12.5,
                        fontWeight: 700, color: GOV.navyMid, borderTop: `1px solid ${GOV.cardBorder}`,
                        '&:hover': {backgroundColor: GOV.pageBg},
                    }}
                >
                    Bütün bildirişlərə bax
                </Box>
            </Menu>
        </>
    );
}
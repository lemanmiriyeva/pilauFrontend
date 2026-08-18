"use client"
import React, {useCallback, useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import CircularProgress from '@mui/material/CircularProgress';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import {useRouter} from "next/navigation";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {useSnackbar} from "notistack";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";

const PAGE_SIZE = 20;

function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'indicə';
    if (mins < 60) return `${mins} dəqiqə əvvəl`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} saat əvvəl`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days} gün əvvəl`;
    return new Date(iso).toLocaleDateString('az-AZ');
}

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'
    const [page, setPage] = useState(1);
    const [hasNext, setHasNext] = useState(false);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);

    const fetchPage = useCallback(async (targetPage, targetFilter, append) => {
        append ? setLoadingMore(true) : setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', String(targetPage));
            params.set('page_size', String(PAGE_SIZE));
            if (targetFilter === 'unread') params.set('unread', 'true');
            const res = await service_api.get(`${NEXT_API_ENDPOINTS.WORKFLOW.NOTIFICATIONS}?${params.toString()}`);
            setUnreadCount(res.data?.unread_count || 0);
            setHasNext(!!res.data?.has_next);
            setItems((prev) => append ? [...prev, ...(res.data?.results || [])] : (res.data?.results || []));
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            append ? setLoadingMore(false) : setLoading(false);
        }
    }, [enqueueSnackbar]);

    useEffect(() => {
        setPage(1);
        fetchPage(1, filter, false);
    }, [filter, fetchPage]);

    const handleLoadMore = () => {
        const next = page + 1;
        setPage(next);
        fetchPage(next, filter, true);
    };

    const handleItemClick = async (n) => {
        if (!n.is_read) {
            setItems((prev) => prev.map((i) => (i.id === n.id ? {...i, is_read: true} : i)));
            setUnreadCount((c) => Math.max(0, c - 1));
            try {
                await service_api.post(NEXT_API_ENDPOINTS.WORKFLOW.NOTIFICATIONS_READ(n.id));
            } catch (e) {
                // sakit fail
            }
        }
        if (n.link) router.push(n.link);
    };

    const handleMarkAllRead = async () => {
        setItems((prev) => prev.map((i) => ({...i, is_read: true})));
        setUnreadCount(0);
        try {
            await service_api.post(NEXT_API_ENDPOINTS.WORKFLOW.NOTIFICATIONS_READ_ALL);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
            fetchPage(1, filter, false);
        }
    };

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        Ana səhifə
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Bildirişlər</span>
                </Typography>

                <Box sx={{display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3}}>
                    <Box>
                        <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>
                            Bildirişlər
                        </Typography>
                        <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5}}>
                            {unreadCount > 0 ? `${unreadCount} oxunmamış bildiriş` : 'Bütün bildirişlər oxunub'}
                        </Typography>
                    </Box>
                    {unreadCount > 0 && (
                        <Button
                            onClick={handleMarkAllRead} startIcon={<DoneAllIcon sx={{fontSize: 16}}/>}
                            sx={{
                                textTransform: 'none', fontWeight: 700, fontSize: 12.5, color: GOV.navyMid,
                                border: `1px solid ${GOV.cardBorder}`, backgroundColor: '#fff', px: 2,
                            }}
                        >
                            Hamısını oxu
                        </Button>
                    )}
                </Box>

                <ToggleButtonGroup
                    value={filter} exclusive size="small"
                    onChange={(e, v) => v && setFilter(v)}
                    sx={{mb: 2.5, backgroundColor: '#fff'}}
                >
                    <ToggleButton value="all" sx={{textTransform: 'none', fontWeight: 700, fontSize: 12.5, px: 2}}>
                        Hamısı
                    </ToggleButton>
                    <ToggleButton value="unread" sx={{textTransform: 'none', fontWeight: 700, fontSize: 12.5, px: 2}}>
                        Oxunmamış
                    </ToggleButton>
                </ToggleButtonGroup>

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                    {loading ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                            <CircularProgress size={26}/>
                        </Box>
                    ) : items.length === 0 ? (
                        <Box sx={{textAlign: 'center', py: 6}}>
                            <NotificationsNoneOutlinedIcon sx={{fontSize: 28, color: GOV.textMuted, mb: 1}}/>
                            <Typography sx={{fontSize: 14, color: GOV.textMuted}}>
                                {filter === 'unread' ? 'Oxunmamış bildiriş yoxdur.' : 'Bildiriş yoxdur.'}
                            </Typography>
                        </Box>
                    ) : (
                        <>
                            {items.map((n) => (
                                <Box
                                    key={n.id} onClick={() => handleItemClick(n)}
                                    sx={{
                                        display: 'flex', alignItems: 'flex-start', gap: 1.5,
                                        px: 2.5, py: 2, cursor: n.link ? 'pointer' : 'default',
                                        borderBottom: `1px solid ${GOV.cardBorder}`,
                                        backgroundColor: n.is_read ? 'transparent' : `${GOV.gold}0F`,
                                        '&:hover': {backgroundColor: GOV.pageBg},
                                        '&:last-of-type': {borderBottom: 'none'},
                                    }}
                                >
                                    <Box sx={{
                                        width: 8, height: 8, borderRadius: '50%', mt: 0.7, flexShrink: 0,
                                        backgroundColor: n.is_read ? 'transparent' : GOV.gold,
                                    }}/>
                                    <Box sx={{flex: 1, minWidth: 0}}>
                                        <Typography sx={{fontSize: 13.5, fontWeight: n.is_read ? 500 : 700, color: GOV.textPrimary}}>
                                            {n.title}
                                        </Typography>
                                        {n.body && (
                                            <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mt: 0.4}}>
                                                {n.body}
                                            </Typography>
                                        )}
                                        <Typography sx={{fontSize: 11.5, color: GOV.textMuted, mt: 0.6}}>
                                            {timeAgo(n.created_at)}
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}

                            {hasNext && (
                                <Box sx={{display: 'flex', justifyContent: 'center', py: 2}}>
                                    <Button
                                        onClick={handleLoadMore} disabled={loadingMore}
                                        sx={{textTransform: 'none', fontWeight: 700, fontSize: 12.5, color: GOV.navyMid}}
                                    >
                                        {loadingMore ? 'Yüklənir…' : 'Daha çox göstər'}
                                    </Button>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </Box>
        </AppShell>
    );
}
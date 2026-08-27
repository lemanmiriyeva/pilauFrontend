"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import PermissionGrid from "@/components/atoms/licenses/PermissionGrid";

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [pendingKey, setPendingKey] = useState(null);

    // Qurum seçimi üçün state-lər
    const [organizations, setOrganizations] = useState([]);
    const [selectedOrgId, setSelectedOrgId] = useState('');

    // 2-ci mərhələ state-ləri
    const [stage2Settings, setStage2Settings] = useState({});
    const [stage2DocTypes, setStage2DocTypes] = useState([]);
    const [stage2Loading, setStage2Loading] = useState(true);
    const [stage2SavingKey, setStage2SavingKey] = useState(null);

    // Məlumatları çəkən funksiyalar (organization parametri ilə)
    const load = async (orgId) => {
        setLoading(true);
        try {
            const params = orgId ? {organization: orgId} : {};
            const res = await service_api.get(NEXT_API_ENDPOINTS.WORKFLOW.STAGE1_PERMISSIONS, {params});
            setData(res.data);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };

    const loadStage2Settings = async (orgId) => {
        setStage2Loading(true);
        try {
            const params = orgId ? {organization: orgId} : {};
            const res = await service_api.get(NEXT_API_ENDPOINTS.WORKFLOW.STAGE2_SETTINGS, {params});
            setStage2DocTypes(res.data?.doc_types || []);
            setStage2Settings(res.data?.settings || {});
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setStage2Loading(false);
        }
    };

    // Səhifə açılan kimi əvvəlcə qurumları yoxlayırıq ki, boş sorğu gedib 400 verməsin
    useEffect(() => {
        const init = async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.AUTHENTICATION.MY_ORGANIZATION_OPTIONS);
                if (res.data && res.data.length > 0) {
                    setOrganizations(res.data);
                    const firstOrgId = res.data[0].id;
                    setSelectedOrgId(firstOrgId);
                    load(firstOrgId);
                    loadStage2Settings(firstOrgId);
                } else {
                    load(null);
                    loadStage2Settings(null);
                }
            } catch (e) {
                // Nazirlik admini deyilsə və ya bu endpoint tələb olunmursa
                load(null);
                loadStage2Settings(null);
            }
        };
        init();
    }, []);

    // Dropdown-dan başqa qurum seçildikdə
    const handleOrgChange = (newOrgId) => {
        setSelectedOrgId(newOrgId);
        load(newOrgId);
        loadStage2Settings(newOrgId);
    };

    const handleStage2Toggle = async (docType, active) => {
        const skipValue = !active;
        setStage2SavingKey(docType);
        setStage2Settings((prev) => ({...prev, [docType]: skipValue}));
        try {
            await service_api.post(NEXT_API_ENDPOINTS.WORKFLOW.STAGE2_SETTINGS, {
                doc_type: docType,
                skip_stage2: skipValue,
                ...(selectedOrgId ? {organization: selectedOrgId} : {})
            });
            enqueueSnackbar(
                active
                    ? 'Bu kateqoriyada 2-ci mərhələ yenidən aktivləşdirildi.'
                    : 'Bu kateqoriyada 2-ci mərhələ (MSN təsdiqi) söndürüldü.',
                {variant: 'success', autoHideDuration: 2500}
            );
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
            setStage2Settings((prev) => ({...prev, [docType]: !skipValue}));
        } finally {
            setStage2SavingKey(null);
        }
    };

    const handleToggle = async (userId, docType, value) => {
        const key = `${userId}:${docType}`;
        setPendingKey(key);
        // Optimistik UI
        setData((prev) => ({
            ...prev,
            users: prev.users.map((u) => u.id === userId
                ? {...u, permissions: {...u.permissions, [docType]: value}}
                : u),
        }));
        try {
            await service_api.post(NEXT_API_ENDPOINTS.WORKFLOW.STAGE1_PERMISSIONS, {
                user: userId,
                doc_type: docType,
                value,
                ...(selectedOrgId ? {organization: selectedOrgId} : {})
            });
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
            setData((prev) => ({
                ...prev,
                users: prev.users.map((u) => u.id === userId
                    ? {...u, permissions: {...u.permissions, [docType]: !value}}
                    : u),
            }));
        } finally {
            setPendingKey(null);
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
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Qurum yoxlaması icazələri</span>
                </Typography>

                <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 1.5}}>
                    <Box>
                        <Typography sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5}}>
                            LİSENZİYA VƏ SƏNƏDLƏR · 1-Cİ MƏRHƏLƏ
                        </Typography>
                        <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>
                            Qurum yoxlaması icazələri
                        </Typography>
                    </Box>

                    {organizations.length > 0 && (
                        <FormControl size="small" sx={{minWidth: 260, backgroundColor: '#fff'}}>
                            <InputLabel>Qurum seçin</InputLabel>
                            <Select
                                value={selectedOrgId}
                                label="Qurum seçin"
                                onChange={(e) => handleOrgChange(e.target.value)}
                            >
                                {organizations.map((org) => (
                                    <MenuItem key={org.id} value={org.id}>
                                        {org.name || org.full_name}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    )}
                </Box>

                <Typography sx={{fontSize: 13, color: GOV.textMuted, mb: 3}}>
                    {data?.organization?.full_name
                        ? `${data.organization.full_name} təşkilatının işçilərinə hansı lisenziya kateqoriyalarını ilkin yoxlaya biləcəklərini təyin edin.`
                        : 'Təşkilatınızın işçilərinə hansı lisenziya kateqoriyalarını ilkin yoxlaya biləcəklərini təyin edin.'}
                </Typography>

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                    <PermissionGrid
                        loading={loading}
                        docTypes={data?.doc_types || []}
                        users={data?.users || []}
                        pendingKey={pendingKey}
                        onToggle={handleToggle}
                        emptyText="Təşkilatda aktiv istifadəçi tapılmadı."
                    />
                </Box>

                <Typography sx={{fontSize: 20, fontWeight: 800, color: GOV.textPrimary, mt: 5, mb: 0.5}}>
                    2-ci mərhələ (MSN təsdiqi)
                </Typography>
                <Typography sx={{fontSize: 13, color: GOV.textMuted, mb: 2.5}}>
                    Hər lisenziya kateqoriyası üçün ayrılıqda seçin - açıq olduqda sənədlər 1-ci mərhələdən
                    (qurum yoxlaması) sonra Nazirliyin son təsdiqini gözləyir; söndürsəniz, 1-ci mərhələ
                    təsdiqləndiyi kimi sənəd birbaşa aktivləşir.
                </Typography>
                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                    {stage2Loading ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}>
                            <CircularProgress size={22}/>
                        </Box>
                    ) : stage2DocTypes.length === 0 ? (
                        <Typography sx={{fontSize: 13, color: GOV.textMuted, px: 2.5, py: 3}}>
                            Lisenziya kateqoriyası tapılmadı.
                        </Typography>
                    ) : (
                        stage2DocTypes.map((dt, i) => {
                            const enabled = !stage2Settings[dt.key];
                            const saving = stage2SavingKey === dt.key;
                            return (
                                <Box
                                    key={dt.key}
                                    sx={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        px: 2.5, py: 1.75,
                                        borderTop: i === 0 ? 'none' : `1px solid ${GOV.cardBorder}`,
                                    }}
                                >
                                    <Box>
                                        <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>
                                            {dt.label}
                                        </Typography>
                                        <Typography sx={{fontSize: 11, color: GOV.textMuted, mt: 0.3}}>
                                            {enabled ? 'MSN son təsdiqini gözləyir' : 'Sənədlər birbaşa aktiv olur'}
                                        </Typography>
                                    </Box>
                                    {saving ? (
                                        <CircularProgress size={16}/>
                                    ) : (
                                        <Switch
                                            size="small" checked={enabled}
                                            onChange={(e) => handleStage2Toggle(dt.key, e.target.checked)}
                                            sx={{
                                                '& .MuiSwitch-switchBase.Mui-checked': {color: GOV.navy},
                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                    backgroundColor: GOV.navySoft,
                                                },
                                            }}
                                        />
                                    )}
                                </Box>
                            );
                        })
                    )}
                </Box>
            </Box>
        </AppShell>
    );
}
"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import Switch from '@mui/material/Switch';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ApartmentIcon from '@mui/icons-material/Apartment';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import {Autocomplete, Grid, Button, Chip, Avatar} from "@mui/material";
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import axios from "axios";
import TextField from "@mui/material/TextField";

const selectSx = {
    backgroundColor: '#fff', fontSize: 13.5, borderRadius: 1.5,
    transition: 'box-shadow .15s',
    '& .MuiSelect-select': {py: 1},
    '& .MuiOutlinedInput-notchedOutline': {borderColor: GOV.cardBorder},
    '&:hover .MuiOutlinedInput-notchedOutline': {borderColor: GOV.navySoft},
};

// Ad-soyaddan baş hərfləri çıxarır (məs. "Aygün Məmmədova" -> "AM"). Yalnız görüntü üçün.
function initials(fullName) {
    if (!fullName) return '?';
    const parts = fullName.trim().split(/\s+/);
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
}

function UserAvatar({name, size = 22, tone = GOV.navy}) {
    return (
        <Avatar sx={{
            width: size, height: size, fontSize: size * 0.42, fontWeight: 700,
            backgroundColor: `${tone}1A`, color: tone,
        }}>
            {initials(name)}
        </Avatar>
    );
}

function StagePill({active, icon, label}) {
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.25, py: 0.5,
            borderRadius: 1.5, fontSize: 11.5, fontWeight: 700,
            backgroundColor: active ? `${GOV.gold}22` : `${GOV.textMuted}14`,
            color: active ? GOV.goldDark : GOV.textMuted,
        }}>
            {icon}
            {label}
        </Box>
    );
}

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();
    const [rows, setRows] = useState(null);
    const [loading, setLoading] = useState(true);
    const [savingKey, setSavingKey] = useState(null);
    // doc_type -> boolean. Hər kateqoriya öz ayrıca açar/bağlıdır (bir-birinə təsir etmir).
    const [settingsByDocType, setSettingsByDocType] = useState({});
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsSavingKey, setSettingsSavingKey] = useState(null);
    // doc_type -> [{organization_id, organization_name, users, selected_user_ids}, ...]
    const [stage1Organizations, setStage1Organizations] = useState({});
    const [stage1OrgSavingKey, setStage1OrgSavingKey] = useState(null);

    const loadSettings = async () => {
        setSettingsLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.LICENSES.APPROVAL_SETTINGS);
            const map = {};
            (res.data || []).forEach((row) => {
                map[row.doc_type] = !!row.staged_approval_enabled;
            });
            setSettingsByDocType(map);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleToggleStagedApproval = async (docType, e) => {
        const value = e.target.checked;
        setSettingsSavingKey(docType);
        setSettingsByDocType((prev) => ({...prev, [docType]: value}));
        try {
            await service_api.patch(NEXT_API_ENDPOINTS.LICENSES.APPROVAL_SETTINGS, {
                doc_type: docType, staged_approval_enabled: value,
            });
            enqueueSnackbar(
                value ? 'Bu kateqoriyada mərhələli təsdiq aktivləşdirildi.' : 'Bu kateqoriyada mərhələli təsdiq söndürüldü.',
                {variant: 'success', autoHideDuration: 2500}
            );
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
            setSettingsByDocType((prev) => ({...prev, [docType]: !value}));
        } finally {
            setSettingsSavingKey(null);
        }
    };

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.WORKFLOW.WORKFLOW_CONFIG);
            setRows(res.data);
            // "Qurum" rejimindəki sətirlər üçün dərhal yüklə - defolt dəyər "Qurum" olduğundan
            // Select-in özü heç vaxt dəyişmirdi (onChange atəşlənmirdi), ona görə əvvəllər bu
            // bölmə istifadəçi əl ilə toxunmayınca həmişə boş qalırdı.
            (res.data || [])
                .filter((row) => row.stage1_mode === 'qurum')
                .forEach((row) => loadStage1Organizations(row.doc_type));
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };

    const loadStage1Organizations = async (docType) => {
        try {
            const response = await service_api.get(
                NEXT_API_ENDPOINTS.WORKFLOW.STAGE1_ORGANIZATION_USERS,
                {params: {doc_type: docType}}
            );
            setStage1Organizations((prev) => ({...prev, [docType]: response.data}));
        } catch (error) {
            enqueueSnackbar(handleError(error), {variant: 'error'});
            setStage1Organizations((prev) => ({...prev, [docType]: []}));
        }
    };

    useEffect(() => {
        load();
        loadSettings();
    }, []);

    const patchRow = (docType, patch) => {
        setRows((prev) => prev.map((r) => (r.doc_type === docType ? {...r, ...patch} : r)));
    };

    const persist = async (docType, payload) => {
        setSavingKey(docType);
        try {
            await service_api.put(NEXT_API_ENDPOINTS.WORKFLOW.WORKFLOW_CONFIG, {
                doc_type: docType, ...payload,
            });
            enqueueSnackbar('Yadda saxlanıldı.', {variant: 'success', autoHideDuration: 1800});
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
            load();
        } finally {
            setSavingKey(null);
        }
    };

    const handleStage1ModeChange = (row, mode) => {
        patchRow(row.doc_type, {stage1_mode: mode, ...(mode === 'qurum' ? {stage1_user: null} : {})});

        if (mode === 'qurum') {
            // Qurum rejiminə keçid dərhal saxlanıla bilər, stage1_user lazım deyil
            persist(row.doc_type, {
                stage1_mode: mode, stage1_user: null,
                stage2_enabled: row.stage2_enabled, stage2_user: row.stage2_user,
            });
            loadStage1Organizations(row.doc_type);
            return;
        }

        // mode === 'msn'
        if (row.stage1_user) {
            persist(row.doc_type, {
                stage1_mode: mode, stage1_user: row.stage1_user,
                stage2_enabled: row.stage2_enabled, stage2_user: row.stage2_user,
            });
        }
        // Əks halda (hələ icraçı seçilməyib) - heç nə saxlanmır, UI icraçı seçimi
        // üçün dropdown göstərir, real save handleStage1UserChange-də baş verir.
    };

    const handleStage1UserChange = (row, userId) => {
        patchRow(row.doc_type, {stage1_user: userId});
        persist(row.doc_type, {stage1_mode: 'msn', stage1_user: userId, stage2_enabled: row.stage2_enabled, stage2_user: row.stage2_user});
    };

    const handleStage2UserChange = (row, userId) => {
        patchRow(row.doc_type, {stage2_user: userId});
        persist(row.doc_type, {stage1_mode: row.stage1_mode, stage1_user: row.stage1_user, stage2_user: userId, stage2_enabled: row.stage2_enabled});
    };

    const handleStage2EnabledChange = (row, checked) => {
        patchRow(row.doc_type, {stage2_enabled: checked});
        persist(row.doc_type, {
            stage1_mode: row.stage1_mode, stage1_user: row.stage1_user,
            stage2_enabled: checked, stage2_user: checked ? row.stage2_user : null,
        });
    };

    // "Qurum" rejimindəki bir sənəd növü üçün, hər təşkilatda seçilmiş təsdiqçiləri backend-ə
    // göndərir. Əvvəllər bu funksiya ÜMUMİYYƏTLƏ YOX İDİ - Autocomplete-dən seçim etmək yalnız
    // lokal state-i dəyişirdi, heç nə saxlanmırdı.
    const persistStage1Organizations = async (row) => {
        const orgs = stage1Organizations[row.doc_type] || [];
        setStage1OrgSavingKey(row.doc_type);
        try {
            await service_api.put(NEXT_API_ENDPOINTS.WORKFLOW.WORKFLOW_CONFIG, {
                doc_type: row.doc_type,
                stage1_mode: 'qurum',
                stage1_user: null,
                stage2_enabled: row.stage2_enabled,
                stage2_user: row.stage2_user,
                organization_stage1_approvers: orgs.map((org) => ({
                    organization_id: org.organization_id,
                    user_ids: org.selected_user_ids || [],
                })),
            });
            enqueueSnackbar('Təsdiqçilər yadda saxlanıldı.', {variant: 'success', autoHideDuration: 1800});
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setStage1OrgSavingKey(null);
        }
    };

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        İnzibatçı paneli
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Təsdiq axını</span>
                </Typography>

                <Typography sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5}}>
                    LİSENZİYA VƏ SƏNƏDLƏR · MƏRHƏLƏLİ TƏSDİQ
                </Typography>
                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary, mb: 2}}>
                    Təsdiq axını
                </Typography>

                <Box sx={{
                    display: 'flex', gap: 1.5, alignItems: 'flex-start',
                    backgroundColor: `${GOV.navy}08`, border: `1px solid ${GOV.navy}1A`,
                    borderRadius: 2, px: 2.5, py: 2, mb: 3, maxWidth: 900,
                }}>
                    <InfoOutlinedIcon sx={{fontSize: 19, color: GOV.navy, mt: 0.2, flexShrink: 0}}/>
                    <Typography sx={{fontSize: 13, color: GOV.textMuted, lineHeight: 1.6}}>
                        Hər sənəd növü üçün 1-ci mərhələnin kimə (Qurum admininə, ya da təyin etdiyiniz konkret
                        MSN işçisinə) və 2-ci mərhələnin (MSN) hansı işçiyə gedəcəyini seçin. Sənəd
                        göndəriləndə müvafiq şəxsə həm bildiriş, həm də e-poçt avtomatik göndərilir. "Mərhələli
                        təsdiq" sütunundan hər kateqoriyanı ayrı-ayrılıqda söndürə bilərsiniz - digər
                        kateqoriyalara təsir etmir. "MSN (2-ci mərhələ)" sütunu isə yalnız Nazirliyin son
                        təsdiqini (2-ci mərhələni) söndürür - açıq olduqda 1-ci mərhələdən sonra sənəd MSN-in
                        son təsdiqini gözləyir, söndürsəniz 1-ci mərhələ təsdiqi ilə sənəd birbaşa aktivləşir.
                    </Typography>
                </Box>

                <Box sx={{
                    backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2,
                    overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
                }}>
                    {loading ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                            <CircularProgress size={26}/>
                        </Box>
                    ) : !rows || rows.length === 0 ? (
                        <Box sx={{textAlign: 'center', py: 6}}>
                            <InfoOutlinedIcon sx={{fontSize: 28, color: GOV.textMuted, mb: 1}}/>
                            <Typography sx={{fontSize: 14, color: GOV.textMuted}}>
                                Sənəd növü tapılmadı.
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={{overflowX: 'auto'}}>
                            <Box component="table" sx={{width: '100%', borderCollapse: 'collapse', minWidth: 820}}>
                                <Box component="thead">
                                    <Box component="tr" sx={{borderBottom: `1px solid ${GOV.cardBorder}`, backgroundColor: GOV.pageBg}}>
                                        {['Sənəd növü', 'Mərhələli təsdiq', '1-ci mərhələ', '1-ci mərhələ icraçısı', 'MSN (2-ci mərhələ)', '2-ci mərhələ icraçısı (MSN)'].map((h) => (
                                            <Box component="th" key={h} sx={{
                                                textAlign: 'left', fontSize: 11, fontWeight: 700, color: GOV.textMuted,
                                                textTransform: 'uppercase', letterSpacing: 0.4, px: 2.5, py: 1.5,
                                            }}>
                                                {h}
                                            </Box>
                                        ))}
                                    </Box>
                                </Box>
                                <Box component="tbody">
                                    {rows.map((row) => {
                                        const eligible = row.eligible_users || [];
                                        const saving = savingKey === row.doc_type;
                                        const stagedEnabled = settingsByDocType[row.doc_type] ?? true;
                                        const settingsSaving = settingsSavingKey === row.doc_type;
                                        const stage1User = eligible.find((u) => u.id === row.stage1_user);
                                        const stage2User = eligible.find((u) => u.id === row.stage2_user);

                                        return (
                                            <React.Fragment key={row.doc_type}>
                                                <Box component="tr" sx={{
                                                    borderBottom: `1px solid ${GOV.cardBorder}`,
                                                    '&:hover': {backgroundColor: `${GOV.navy}05`},
                                                    opacity: saving ? 0.6 : 1, transition: 'opacity .15s, background-color .15s',
                                                }}>
                                                    <Box component="td" sx={{px: 2.5, py: 2}}>
                                                        <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>
                                                            {row.label}
                                                        </Typography>
                                                        {!stagedEnabled && (
                                                            <Typography sx={{fontSize: 11, color: GOV.textMuted, mt: 0.3}}>
                                                                Sənədlər birbaşa aktiv olur
                                                            </Typography>
                                                        )}
                                                    </Box>

                                                    <Box component="td" sx={{px: 2.5, py: 2}}>
                                                        {settingsLoading ? (
                                                            <CircularProgress size={16}/>
                                                        ) : (
                                                            <Switch
                                                                size="small" checked={stagedEnabled} disabled={settingsSaving}
                                                                onChange={(e) => handleToggleStagedApproval(row.doc_type, e)}
                                                                sx={{
                                                                    '& .MuiSwitch-switchBase.Mui-checked': {color: GOV.navy},
                                                                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                                        backgroundColor: GOV.navySoft,
                                                                    },
                                                                }}
                                                            />
                                                        )}
                                                    </Box>

                                                    <Box component="td" sx={{
                                                        px: 2.5, py: 2,
                                                        opacity: stagedEnabled ? 1 : 0.4,
                                                        pointerEvents: stagedEnabled ? 'auto' : 'none',
                                                    }}>
                                                        <FormControl size="small" sx={{minWidth: 150}}>
                                                            <Select
                                                                value={row.stage1_mode} disabled={saving}
                                                                onChange={(e) => handleStage1ModeChange(row, e.target.value)}
                                                                sx={selectSx}
                                                            >
                                                                <MenuItem value="qurum">
                                                                    <StagePill active={false} icon={<ApartmentIcon sx={{fontSize: 15}}/>} label="Qurum"/>
                                                                </MenuItem>
                                                                <MenuItem value="msn">
                                                                    <StagePill active icon={<AccountBalanceIcon sx={{fontSize: 15}}/>} label="MSN"/>
                                                                </MenuItem>
                                                            </Select>
                                                        </FormControl>
                                                    </Box>

                                                    <Box component="td" sx={{
                                                        px: 2.5, py: 2,
                                                        opacity: stagedEnabled ? 1 : 0.4,
                                                        pointerEvents: stagedEnabled ? 'auto' : 'none',
                                                    }}>
                                                        {row.stage1_mode === 'msn' ? (
                                                            <FormControl size="small" sx={{minWidth: 240}}>
                                                                <Select
                                                                    displayEmpty value={row.stage1_user || ''} disabled={saving}
                                                                    onChange={(e) => handleStage1UserChange(row, e.target.value)}
                                                                    sx={selectSx}
                                                                    renderValue={(val) => {
                                                                        if (!val) {
                                                                            return <em style={{color: GOV.textMuted, fontStyle: 'normal'}}>Seçin...</em>;
                                                                        }
                                                                        return (
                                                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                                                <UserAvatar name={stage1User?.full_name}/>
                                                                                <Typography sx={{fontSize: 13, fontWeight: 600, color: GOV.textPrimary}}>
                                                                                    {stage1User?.full_name || '—'}
                                                                                </Typography>
                                                                            </Box>
                                                                        );
                                                                    }}
                                                                >
                                                                    <MenuItem value="" disabled>
                                                                        <em style={{color: GOV.textMuted, fontStyle: 'normal'}}>Seçin...</em>
                                                                    </MenuItem>
                                                                    {eligible.length === 0 && (
                                                                        <MenuItem value="" disabled>
                                                                            Uyğun icazəli istifadəçi yoxdur
                                                                        </MenuItem>
                                                                    )}
                                                                    {eligible.map((u) => (
                                                                        <MenuItem key={u.id} value={u.id}>
                                                                            <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                                                <UserAvatar name={u.full_name} size={24}/>
                                                                                <Box>
                                                                                    <Typography sx={{fontSize: 13}}>{u.full_name}</Typography>
                                                                                    {(u.department || u.position) && (
                                                                                        <Typography sx={{fontSize: 11, color: GOV.textMuted, lineHeight: 1.2}}>
                                                                                            {[u.department, u.position].filter(Boolean).join(' · ')}
                                                                                        </Typography>
                                                                                    )}
                                                                                </Box>
                                                                            </Box>
                                                                        </MenuItem>
                                                                    ))}
                                                                </Select>
                                                            </FormControl>
                                                        ) : (
                                                            <Box sx={{
                                                                display: 'inline-flex', alignItems: 'center', gap: 0.5,
                                                                fontSize: 11.5, color: GOV.textMuted, fontStyle: 'italic',
                                                                backgroundColor: `${GOV.gold}14`, px: 1.25, py: 0.5, borderRadius: 1.5,
                                                            }}>
                                                                Aşağıda, təşkilat üzrə seçin ↓
                                                            </Box>
                                                        )}
                                                    </Box>

                                                    <Box component="td" sx={{
                                                        px: 2.5, py: 2,
                                                        opacity: stagedEnabled ? 1 : 0.4,
                                                        pointerEvents: stagedEnabled ? 'auto' : 'none',
                                                    }}>
                                                        <Switch
                                                            size="small" checked={row.stage2_enabled !== false} disabled={saving}
                                                            onChange={(e) => handleStage2EnabledChange(row, e.target.checked)}
                                                            sx={{
                                                                '& .MuiSwitch-switchBase.Mui-checked': {color: GOV.navy},
                                                                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                                                                    backgroundColor: GOV.navySoft,
                                                                },
                                                            }}
                                                        />
                                                        {row.stage2_enabled === false && (
                                                            <Typography sx={{fontSize: 10.5, color: GOV.textMuted, mt: 0.3}}>
                                                                Söndürülüb
                                                            </Typography>
                                                        )}
                                                    </Box>

                                                    <Box component="td" sx={{
                                                        px: 2.5, py: 2,
                                                        opacity: (stagedEnabled && row.stage2_enabled !== false) ? 1 : 0.4,
                                                        pointerEvents: (stagedEnabled && row.stage2_enabled !== false) ? 'auto' : 'none',
                                                    }}>
                                                        <FormControl size="small" sx={{minWidth: 240}}>
                                                            <Select
                                                                displayEmpty value={row.stage2_user || ''} disabled={saving}
                                                                onChange={(e) => handleStage2UserChange(row, e.target.value)}
                                                                sx={selectSx}
                                                                renderValue={(val) => {
                                                                    if (!val) {
                                                                        return <em style={{color: GOV.textMuted, fontStyle: 'normal'}}>Seçin...</em>;
                                                                    }
                                                                    return (
                                                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                                            <UserAvatar name={stage2User?.full_name} tone={GOV.goldDark}/>
                                                                            <Typography sx={{fontSize: 13, fontWeight: 600, color: GOV.textPrimary}}>
                                                                                {stage2User?.full_name || '—'}
                                                                            </Typography>
                                                                        </Box>
                                                                    );
                                                                }}
                                                            >
                                                                <MenuItem value="" disabled>
                                                                    <em style={{color: GOV.textMuted, fontStyle: 'normal'}}>Seçin...</em>
                                                                </MenuItem>
                                                                {eligible.length === 0 && (
                                                                    <MenuItem value="" disabled>
                                                                        Uyğun icazəli istifadəçi yoxdur
                                                                    </MenuItem>
                                                                )}
                                                                {eligible.map((u) => (
                                                                    <MenuItem key={u.id} value={u.id}>
                                                                        <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                                                            <UserAvatar name={u.full_name} size={24} tone={GOV.goldDark}/>
                                                                            <Box>
                                                                                <Typography sx={{fontSize: 13}}>{u.full_name}</Typography>
                                                                                {(u.department || u.position) && (
                                                                                    <Typography sx={{fontSize: 11, color: GOV.textMuted, lineHeight: 1.2}}>
                                                                                        {[u.department, u.position].filter(Boolean).join(' · ')}
                                                                                    </Typography>
                                                                                )}
                                                                            </Box>
                                                                        </Box>
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    </Box>
                                                </Box>

                                                <Box component="tr">
                                                    <Box component="td" colSpan={6} sx={{p: 0, borderBottom: `1px solid ${GOV.cardBorder}`}}>
                                                        {row.stage1_mode === "qurum" && (
                                                            <Box sx={{
                                                                mx: 2.5, my: 2,
                                                                borderLeft: `3px solid ${GOV.gold}`,
                                                                backgroundColor: `${GOV.gold}0A`,
                                                                overflow: 'hidden',
                                                            }}>
                                                                {/* Başlıq zolağı */}
                                                                <Box sx={{
                                                                    display: 'flex', alignItems: 'center', gap: 1,
                                                                    px: 2, py: 1.25, backgroundColor: `${GOV.gold}12`,
                                                                }}>
                                                                    <ApartmentOutlinedIcon sx={{fontSize: 15, color: GOV.goldDark}}/>
                                                                    <Typography sx={{fontSize: 12.5, fontWeight: 700, color: GOV.goldDark}}>
                                                                        {row.label} · Qurum üzrə 1-ci mərhələ təsdiqçiləri
                                                                    </Typography>
                                                                </Box>

                                                                {/* Təşkilat sətirləri - ağ fon üzərində */}
                                                                <Box sx={{backgroundColor: '#fff'}}>
                                                                    {(stage1Organizations[row.doc_type] || []).length === 0 ? (
                                                                        <Typography sx={{fontSize: 12.5, color: GOV.textMuted, px: 2, py: 2.5}}>
                                                                            Təşkilat tapılmadı.
                                                                        </Typography>
                                                                    ) : (
                                                                        (stage1Organizations[row.doc_type] || []).map((organization, idx) => (
                                                                            <Box
                                                                                key={organization.organization_id}
                                                                                sx={{
                                                                                    display: 'flex', alignItems: 'center', gap: 2,
                                                                                    px: 2, py: 1.5, width: '100%',
                                                                                    borderTop: idx === 0 ? 'none' : `1px solid ${GOV.cardBorder}`,
                                                                                    '&:hover': {backgroundColor: GOV.pageBg},
                                                                                }}
                                                                            >
                                                                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1, width: 200, flexShrink: 0}}>
                                                                                    <Avatar sx={{
                                                                                        width: 28, height: 28,
                                                                                        backgroundColor: `${GOV.gold}1E`, color: GOV.goldDark,
                                                                                    }}>
                                                                                        <ApartmentOutlinedIcon sx={{fontSize: 15}}/>
                                                                                    </Avatar>
                                                                                    <Typography sx={{
                                                                                        fontSize: 13, fontWeight: 600, color: GOV.textPrimary,
                                                                                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                                                                    }}>
                                                                                        {organization.organization_name}
                                                                                    </Typography>
                                                                                </Box>

                                                                                <Autocomplete
                                                                                    multiple
                                                                                    size="small"
                                                                                    options={organization.users || []}
                                                                                    value={(organization.users || []).filter((u) =>
                                                                                        (organization.selected_user_ids || []).includes(u.id)
                                                                                    )}
                                                                                    getOptionLabel={(u) => u.full_name}
                                                                                    isOptionEqualToValue={(o, v) => o.id === v.id}
                                                                                    onChange={(e, values) => {
                                                                                        const userIds = values.map((u) => u.id);
                                                                                        setStage1Organizations((prev) => ({
                                                                                            ...prev,
                                                                                            [row.doc_type]: (prev[row.doc_type] || []).map((item) =>
                                                                                                item.organization_id === organization.organization_id
                                                                                                    ? {...item, selected_user_ids: userIds}
                                                                                                    : item
                                                                                            ),
                                                                                        }));
                                                                                    }}
                                                                                    sx={{flex: 1, minWidth: 0}}
                                                                                    renderTags={(value, getTagProps) =>
                                                                                        value.map((user, i) => {
                                                                                            const {key, ...tagProps} = getTagProps({index: i});
                                                                                            return (
                                                                                                <Chip
                                                                                                    key={key} {...tagProps} size="small"
                                                                                                    label={user.full_name}
                                                                                                    sx={{
                                                                                                        fontSize: 11.5, fontWeight: 600,
                                                                                                        backgroundColor: user.is_org_admin ? `${GOV.gold}22` : GOV.pageBg,
                                                                                                        color: user.is_org_admin ? GOV.goldDark : GOV.textPrimary,
                                                                                                    }}
                                                                                                />
                                                                                            );
                                                                                        })
                                                                                    }
                                                                                    renderOption={(props, user) => (
                                                                                        <Box component="li" {...props} key={user.id} sx={{
                                                                                            display: 'flex', alignItems: 'center', gap: 1,
                                                                                        }}>
                                                                                            <Typography sx={{fontSize: 13}}>{user.full_name}</Typography>
                                                                                            {user.is_org_admin && (
                                                                                                <Chip
                                                                                                    label="Qurum admini" size="small"
                                                                                                    sx={{
                                                                                                        fontSize: 10, height: 18, fontWeight: 700,
                                                                                                        backgroundColor: `${GOV.gold}22`, color: GOV.goldDark,
                                                                                                    }}
                                                                                                />
                                                                                            )}
                                                                                        </Box>
                                                                                    )}
                                                                                    renderInput={(params) => (
                                                                                        <TextField
                                                                                            {...params}
                                                                                            placeholder={
                                                                                                (organization.selected_user_ids || []).length === 0
                                                                                                    ? "Əməkdaş seçin"
                                                                                                    : ""
                                                                                            }
                                                                                            sx={{
                                                                                                '& .MuiOutlinedInput-root': {backgroundColor: GOV.pageBg, fontSize: 13},
                                                                                            }}
                                                                                        />
                                                                                    )}
                                                                                />
                                                                            </Box>
                                                                        ))
                                                                    )}
                                                                </Box>

                                                                {/* Saxla düyməsi */}
                                                                <Box sx={{
                                                                    display: 'flex', justifyContent: 'flex-end',
                                                                    px: 2, py: 1.25, backgroundColor: '#fff',
                                                                    borderTop: `1px solid ${GOV.cardBorder}`,
                                                                }}>
                                                                    <Button
                                                                        size="small" variant="contained"
                                                                        disabled={stage1OrgSavingKey === row.doc_type}
                                                                        onClick={() => persistStage1Organizations(row)}
                                                                        sx={{
                                                                            textTransform: 'none', fontWeight: 700, fontSize: 12.5,
                                                                            backgroundColor: GOV.navy, boxShadow: 'none', px: 2.25,
                                                                            '&:hover': {backgroundColor: GOV.navySoft, boxShadow: 'none'},
                                                                        }}
                                                                    >
                                                                        {stage1OrgSavingKey === row.doc_type ? 'Saxlanılır...' : 'Təsdiqçiləri yadda saxla'}
                                                                    </Button>
                                                                </Box>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </React.Fragment>
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>

                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.75, mt: 2}}>
                    <InfoOutlinedIcon sx={{fontSize: 14, color: GOV.textMuted}}/>
                    <Typography sx={{fontSize: 12, color: GOV.textMuted}}>
                        Yalnız "Təsdiq hüquqları" bölməsində həmin sənəd növü üzrə yoxlama icazəsi verilmiş
                        istifadəçilər dropdown-da görünür.
                    </Typography>
                </Box>
            </Box>
        </AppShell>
    );
}
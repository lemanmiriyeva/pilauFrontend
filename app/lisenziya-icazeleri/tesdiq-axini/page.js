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
import {Autocomplete} from "@mui/material";
import axios from "axios";
import TextField from "@mui/material/TextField";

const selectSx = {
    backgroundColor: '#fff', fontSize: 13.5,
    '& .MuiSelect-select': {py: 1},
};

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
    const [stage1Users, setStage1Users] = useState([]);
    const [selectedStage1Users, setSelectedStage1Users] = useState([]);

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
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
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

    const loadStage1Users = async (organizationId, docType) => {
        if (!organizationId || !docType) {
            setStage1Users([]);
            return;
        }

        try {
            const response = await service_api.get(
                NEXT_API_ENDPOINTS.WORKFLOW.STAGE1_ORGANIZATION_USERS,
                {
                    params: {
                        organization_id: organizationId,
                        doc_type: docType,
                    },
                }
            );

            setStage1Users(response.data);
        } catch (error) {
            console.error("1-ci mərhələ təsdiqçiləri yüklənmədi:", error);
            setStage1Users([]);
        }
    };

    const handleStage1ModeChange = async (row, mode) => {
        patchRow(row.doc_type, {
            stage1_mode: mode,
        });

        if (mode === "qurum" && row.organization_id) {
            await loadStage1Users(
                row.organization_id,
                row.doc_type
            );
        }
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
                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>
                    Təsdiq axını
                </Typography>
                <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5, mb: 3, maxWidth: 780}}>
                    Hər sənəd növü üçün 1-ci mərhələnin kimə (Qurum admininə, ya da təyin etdiyiniz konkret
                    MSN işçisinə) və 2-ci mərhələnin (MSN) hansı işçiyə gedəcəyini seçin. Sənəd
                    göndəriləndə müvafiq şəxsə həm bildiriş, həm də e-poçt avtomatik göndərilir. "Mərhələli
                    təsdiq" sütunundan hər kateqoriyanı ayrı-ayrılıqda söndürə bilərsiniz - digər
                    kateqoriyalara təsir etmir. "MSN (2-ci mərhələ)" sütunu isə yalnız Nazirliyin son
                    təsdiqini (2-ci mərhələni) söndürür - açıq olduqda 1-ci mərhələdən sonra sənəd MSN-in
                    son təsdiqini gözləyir, söndürsəniz 1-ci mərhələ təsdiqi ilə sənəd birbaşa aktivləşir.
                </Typography>

                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
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
                            <Box component="table" sx={{width: '100%', borderCollapse: 'collapse', minWidth: 780}}>
                                <Box component="thead">
                                    <Box component="tr" sx={{borderBottom: `1px solid ${GOV.cardBorder}`}}>
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
                                        return (
                                            <Box component="tr" key={row.doc_type} sx={{
                                                borderBottom: `1px solid ${GOV.cardBorder}`,
                                                '&:last-of-type': {borderBottom: 'none'},
                                                opacity: saving ? 0.6 : 1, transition: 'opacity .15s',
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
                                                        <FormControl size="small" sx={{minWidth: 220}}>
                                                            <Select
                                                                displayEmpty value={row.stage1_user || ''} disabled={saving}
                                                                onChange={(e) => handleStage1UserChange(row, e.target.value)}
                                                                sx={selectSx}
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
                                                                        {u.full_name}
                                                                        {(u.department || u.position) && (
                                                                            <Typography component="span" sx={{fontSize: 11.5, color: GOV.textMuted, ml: 0.75}}>
                                                                                {[u.department, u.position].filter(Boolean).join(' · ')}
                                                                            </Typography>
                                                                        )}
                                                                    </MenuItem>
                                                                ))}
                                                            </Select>
                                                        </FormControl>
                                                    ) : (
                                                        <Autocomplete
                                                            multiple
                                                            options={stage1Users}
                                                            value={stage1Users.filter((user) =>
                                                                selectedStage1Users.includes(user.id)
                                                            )}
                                                            getOptionLabel={(option) =>
                                                                `${option.full_name}${option.is_org_admin ? " — Qurum admini" : ""}`
                                                            }
                                                            isOptionEqualToValue={(option, value) =>
                                                                option.id === value.id
                                                            }
                                                            onChange={(event, values) => {
                                                                setSelectedStage1Users(
                                                                    values.map((user) => user.id)
                                                                );
                                                            }}
                                                            renderInput={(params) => (
                                                                <TextField
                                                                    {...params}
                                                                    label="1-ci mərhələ təsdiqçiləri"
                                                                    placeholder="İşçiləri seçin"
                                                                />
                                                            )}
                                                        />
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
                                                    <FormControl size="small" sx={{minWidth: 220}}>
                                                        <Select
                                                            displayEmpty value={row.stage2_user || ''} disabled={saving}
                                                            onChange={(e) => handleStage2UserChange(row, e.target.value)}
                                                            sx={selectSx}
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
                                                                    {u.full_name}
                                                                    {(u.department || u.position) && (
                                                                        <Typography component="span" sx={{fontSize: 11.5, color: GOV.textMuted, ml: 0.75}}>
                                                                            {[u.department, u.position].filter(Boolean).join(' · ')}
                                                                        </Typography>
                                                                    )}
                                                                </MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                </Box>
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>

                <Typography sx={{fontSize: 12, color: GOV.textMuted, mt: 2}}>
                    Yalnız "Təsdiq hüquqları" bölməsində həmin sənəd növü üzrə yoxlama icazəsi verilmiş
                    istifadəçilər dropdown-da görünür.
                </Typography>
            </Box>
        </AppShell>
    );
}
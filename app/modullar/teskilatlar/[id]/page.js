"use client"
import React, {useCallback, useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import {useRouter, useParams} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import EmployeesTab from "@/components/atoms/organizations/profile/EmployeesTab";
import DocumentsTab from "@/components/atoms/organizations/profile/DocumentsTab";
import NomenclatureTab from "@/components/atoms/organizations/profile/NomenclatureTab";
import ActivityDocsTab from "@/components/atoms/organizations/profile/ActivityDocsTab";
import SubordinatesTab from "@/components/atoms/organizations/profile/SubordinatesTab";
import EquipmentTab from "@/components/atoms/organizations/profile/EquipmentTab";
import TurnoverTab from "@/components/atoms/organizations/profile/TurnoverTab";
import ModulesTab from "@/components/atoms/organizations/profile/ModulesTab";
import ApprovalFlowTab from "@/components/atoms/organizations/profile/ApprovalFlowTab";
import {formatDate} from "@/components/atoms/organizations/profile/shared";

function InfoItem({label, value}) {
    return (
        <Box sx={{minWidth: 0}}>
            <Typography sx={{fontSize: 11, fontWeight: 700, color: GOV.textMuted, letterSpacing: 0.5, mb: 0.4}}>
                {label}
            </Typography>
            <Typography sx={{fontSize: 14, fontWeight: 600, color: GOV.textPrimary, wordBreak: 'break-word'}}>
                {value || '—'}
            </Typography>
        </Box>
    );
}

function StatTile({label, value, onClick}) {
    return (
        <Box
            onClick={onClick}
            sx={{
                flex: '1 1 150px', backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2,
                px: 2.25, py: 1.75, cursor: 'pointer', transition: 'border-color .15s, box-shadow .15s',
                '&:hover': {borderColor: GOV.gold, boxShadow: '0 4px 14px rgba(15,23,55,0.07)'},
            }}
        >
            <Typography sx={{fontSize: 26, fontWeight: 800, color: GOV.textPrimary, lineHeight: 1.1}}>{value ?? 0}</Typography>
            <Typography sx={{fontSize: 12, color: GOV.textMuted, mt: 0.5}}>{label}</Typography>
        </Box>
    );
}

const TABS = [
    {key: 'info', label: 'Ümumi məlumat'},
    {key: 'employees', label: 'İşçilər', count: 'employee_count'},
    {key: 'licenses', label: 'Lisenziyalar', count: 'license_count'},
    {key: 'permits', label: 'İcazə sənədləri', count: 'permit_count'},
    {key: 'nomenclature', label: 'Nomenklatura', count: 'nomenclature_count'},
    {key: 'activity', label: 'Fəaliyyətə dair sənədlər', count: 'activity_document_count'},
    {key: 'subordinates', label: 'Tabeli qurumlar', count: 'subordinate_count'},
    {key: 'equipment', label: 'Əsas avadanlıqlar', count: 'equipment_count'},
    {key: 'turnover', label: 'Dövriyyələr'},
    {key: 'flow', label: 'Təsdiq axını'},
    {key: 'modules', label: 'Modul icazələri'},
];

export default function Page() {
    const router = useRouter();
    const params = useParams();
    const {enqueueSnackbar} = useSnackbar();

    const [org, setOrg] = useState(null);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState('info');

    const [editOpen, setEditOpen] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    const loadProfile = useCallback(async () => {
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.PROFILE(params.id));
            setOrg(res.data);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
            router.push('/');
        } finally {
            setLoading(false);
        }
    }, [params.id]);

    useEffect(() => { loadProfile(); }, [loadProfile]);

    const openEdit = () => {
        setForm({
            full_name: org.full_name || '', director_name: org.director_name || '',
            director_phone: org.director_phone || '', director_email: org.director_email || '', address: org.address || '',
            email: org.email || '', phone: org.phone || '',
        });
        setEditOpen(true);
    };

    const saveEdit = async () => {
        if (!form.full_name.trim()) {
            enqueueSnackbar('Təşkilatın adı boş ola bilməz.', {variant: 'warning'});
            return;
        }
        setSaving(true);
        try {
            await service_api.patch(NEXT_API_ENDPOINTS.ORGANIZATIONS.DETAIL(params.id), form);
            enqueueSnackbar('Dəyişikliklər yadda saxlanıldı.', {variant: 'success'});
            setEditOpen(false);
            await loadProfile();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    };

    const set = (k) => (e) => setForm((p) => ({...p, [k]: e.target.value}));

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    {org?.can_edit_all_fields ? (
                        <Link component="button" onClick={() => router.push(APP_ROUTES.TESKILATLAR)}
                              sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                            Təşkilatlar
                        </Link>
                    ) : <span>Mənim təşkilatım</span>}
                    {' / '}
                    <span>{org?.full_name || '...'}</span>
                </Typography>

                {loading || !org ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}><CircularProgress size={24}/></Box>
                ) : (
                    <>
                        {/* HEADER */}
                        <Box sx={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2, flexWrap: 'wrap',
                            backgroundColor: GOV.navyMid, color: GOV.textOnNavy, borderRadius: 3, px: {xs: 2.5, md: 4}, py: 3, mb: 2.5,
                            borderBottom: `3px solid ${GOV.gold}`,
                        }}>
                            <Box sx={{minWidth: 0}}>
                                <Typography sx={{color: GOV.gold, fontSize: 11.5, fontWeight: 700, letterSpacing: 1.2, mb: 0.5}}>
                                    TƏŞKİLAT
                                </Typography>
                                <Typography sx={{fontSize: {xs: 20, md: 26}, fontWeight: 800, lineHeight: 1.2, wordBreak: 'break-word'}}>
                                    {org.full_name}
                                </Typography>
                                <Box sx={{display: 'flex', gap: 2, alignItems: 'center', mt: 1, flexWrap: 'wrap'}}>
                                    <Typography sx={{fontSize: 13, color: GOV.textOnNavyMuted}}>VÖEN: {org.voen}</Typography>
                                    <Box sx={{
                                        display: 'inline-flex', alignItems: 'center', gap: 0.75, fontSize: 12, fontWeight: 700,
                                        px: 1.25, py: 0.35, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.1)',
                                    }}>
                                        <Box sx={{width: 7, height: 7, borderRadius: '50%', backgroundColor: org.is_active ? '#4CC38A' : '#E5677D'}}/>
                                        {org.is_active ? 'Aktiv' : 'Deaktiv'}
                                    </Box>
                                </Box>
                            </Box>
                            <Box sx={{display: 'flex', gap: 1.25, flexWrap: 'wrap'}}>
                                {org.can_edit && (
                                    <Button
                                        variant="contained" startIcon={<EditOutlinedIcon/>} onClick={() => router.push(`${APP_ROUTES.TESKILATLAR}/${params.id}/redakte`)}
                                        sx={{backgroundColor: GOV.gold, color: GOV.navy, textTransform: 'none', fontWeight: 700, '&:hover': {backgroundColor: GOV.goldSoft}}}
                                    >
                                        Redaktə et
                                    </Button>
                                )}
                            </Box>
                        </Box>

                        {/* STATS */}
                        <Box sx={{display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 2.5}}>
                            <StatTile label="İşçi" value={org.employee_count} onClick={() => setTab('employees')}/>
                            <StatTile label="Lisenziya" value={org.license_count} onClick={() => setTab('licenses')}/>
                            <StatTile label="İcazə sənədi" value={org.permit_count} onClick={() => setTab('permits')}/>
                            <StatTile label="Nomenklatura" value={org.nomenclature_count} onClick={() => setTab('nomenclature')}/>
                            <StatTile label="Fəaliyyət sənədi" value={org.activity_document_count} onClick={() => setTab('activity')}/>
                            <StatTile label="Tabeli qurum" value={org.subordinate_count} onClick={() => setTab('subordinates')}/>
                            <StatTile label="Əsas avadanlıq" value={org.equipment_count} onClick={() => setTab('equipment')}/>
                        </Box>

                        {/* TABS */}
                        <Box sx={{borderBottom: `1px solid ${GOV.cardBorder}`, mb: 2.5}}>
                            <Tabs
                                value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto"
                                TabIndicatorProps={{sx: {backgroundColor: GOV.gold, height: 3}}}
                            >
                                {TABS.map((t) => (
                                    <Tab
                                        key={t.key} value={t.key}
                                        label={t.count ? `${t.label} (${org[t.count] ?? 0})` : t.label}
                                        sx={{textTransform: 'none', fontWeight: 700, fontSize: 13.5, color: GOV.textMuted, '&.Mui-selected': {color: GOV.textPrimary}}}
                                    />
                                ))}
                            </Tabs>
                        </Box>

                        {tab === 'info' && (
                            <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, p: {xs: 2.5, md: 3.5}}}>
                                <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', md: '1fr 1fr 1fr'}, gap: 3}}>
                                    <InfoItem label="DİREKTOR" value={org.director_name}/>
                                    <InfoItem label="DİREKTORUN TELEFONU" value={org.director_phone}/>
                                    <InfoItem label="DİREKTORUN E-POÇTU" value={org.director_email}/>
                                    <InfoItem label="ÜNVAN" value={org.address}/>
                                    <InfoItem label="DÖVLƏT QEYDİYYAT NÖMRƏSİ" value={org.state_reg_number}/>
                                    <InfoItem label="TELEFON" value={org.phone}/>
                                    <InfoItem label="E-POÇT" value={org.email}/>
                                    <InfoItem label="TABE OLDUĞU TƏŞKİLAT" value={org.parent_name}/>
                                    <InfoItem label="SİSTEMƏ ƏLAVƏ OLUNUB" value={formatDate(org.created_at)}/>
                                </Box>
                                {org.notes && (
                                    <Box sx={{mt: 3}}><InfoItem label="ƏLAVƏ MƏLUMAT" value={org.notes}/></Box>
                                )}
                            </Box>
                        )}
                        {tab === 'employees' && <EmployeesTab orgId={params.id} canCreate={org.can_create} canEdit={org.can_edit} onChanged={loadProfile}/>}
                        {tab === 'licenses' && <DocumentsTab orgId={params.id} group="license"/>}
                        {tab === 'permits' && <DocumentsTab orgId={params.id} group="permit"/>}
                        {tab === 'nomenclature' && <NomenclatureTab orgId={params.id} canCreate={org.can_create} canEdit={org.can_edit} canDelete={org.can_delete} onChanged={loadProfile}/>}
                        {tab === 'subordinates' && <SubordinatesTab orgId={params.id} onChanged={loadProfile}/>}
                        {tab === 'equipment' && <EquipmentTab orgId={params.id} canCreate={org.can_create} canEdit={org.can_edit} canDelete={org.can_delete} onChanged={loadProfile}/>}
                        {tab === 'turnover' && <TurnoverTab/>}
                        {tab === 'flow' && <ApprovalFlowTab orgId={params.id}/>}
                        {tab === 'modules' && <ModulesTab orgId={params.id}/>}
                        {tab === 'activity' && <ActivityDocsTab orgId={params.id} canCreate={org.can_create} canDelete={org.can_delete} onChanged={loadProfile}/>}
                    </>
                )}
            </Box>

            {/* EDIT DIALOG */}
            <Dialog open={editOpen} onClose={() => !saving && setEditOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{fontWeight: 800}}>Təşkilatı redaktə et</DialogTitle>
                <DialogContent>
                    <Box sx={{display: 'grid', gap: 2, mt: 1}}>
                        <TextField size="small" label="Təşkilatın adı *" value={form.full_name || ''} onChange={set('full_name')}/>
                        <TextField size="small" label="Direktor (ad, soyad)" value={form.director_name || ''} onChange={set('director_name')}/>
                        <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2}}>
                            <TextField size="small" label="Direktorun telefonu" value={form.director_phone || ''} onChange={set('director_phone')}/>
                            <TextField size="small" label="Direktorun e-poçtu" value={form.director_email || ''} onChange={set('director_email')}/>
                        </Box>
                        <TextField size="small" label="Ünvan" value={form.address || ''} onChange={set('address')} multiline minRows={2}/>
                        <Box sx={{display: 'grid', gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'}, gap: 2}}>
                            <TextField size="small" label="Telefon" value={form.phone || ''} onChange={set('phone')}/>
                            <TextField size="small" label="E-poçt" value={form.email || ''} onChange={set('email')}/>
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2}}>
                    <Button onClick={() => setEditOpen(false)} disabled={saving} sx={{textTransform: 'none'}}>Ləğv et</Button>
                    <Button
                        variant="contained" onClick={saveEdit} disabled={saving}
                        sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, '&:hover': {backgroundColor: GOV.navyMid}}}
                    >
                        {saving ? 'Yadda saxlanır...' : 'Yadda saxla'}
                    </Button>
                </DialogActions>
            </Dialog>
        </AppShell>
    );
}

"use client"
import React, {useEffect, useMemo, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import CircularProgress from '@mui/material/CircularProgress';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import InputAdornment from '@mui/material/InputAdornment';
import ApartmentOutlinedIcon from '@mui/icons-material/ApartmentOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";

const TYPE_META = {
    department: {label: 'Departament', color: GOV.navy, bg: `${GOV.navy}12`, icon: ApartmentOutlinedIcon},
    position: {label: 'Vəzifə', color: GOV.goldDark, bg: `${GOV.gold}20`, icon: BadgeOutlinedIcon},
};

function StatCard({icon: Icon, label, value, tint}) {
    return (
        <Box sx={{
            flex: 1, minWidth: 150, backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`,
            borderRadius: 2, p: 2.25, display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
            <Box sx={{
                width: 38, height: 38, borderRadius: 1.5, backgroundColor: tint,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
                <Icon sx={{fontSize: 19, color: '#fff'}}/>
            </Box>
            <Box>
                <Typography sx={{fontSize: 20, fontWeight: 800, color: GOV.textPrimary, lineHeight: 1.1}}>
                    {value}
                </Typography>
                <Typography sx={{fontSize: 11.5, color: GOV.textMuted, mt: 0.25}}>
                    {label}
                </Typography>
            </Box>
        </Box>
    );
}

function TypeChip({type}) {
    const meta = TYPE_META[type];
    const Icon = meta.icon;
    return (
        <Box sx={{
            display: 'inline-flex', alignItems: 'center', gap: 0.5, px: 1.1, py: 0.4,
            borderRadius: 5, backgroundColor: meta.bg, color: meta.color,
            fontSize: 11.5, fontWeight: 700,
        }}>
            <Icon sx={{fontSize: 13}}/>
            {meta.label}
        </Box>
    );
}

export default function Page() {
    const router = useRouter();
    const {enqueueSnackbar} = useSnackbar();

    const [orgs, setOrgs] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [positions, setPositions] = useState([]);
    const [loading, setLoading] = useState(true);

    const [orgFilter, setOrgFilter] = useState('');
    const [typeFilter, setTypeFilter] = useState('all'); // all | department | position
    const [search, setSearch] = useState('');

    const [adding, setAdding] = useState(false);
    const [newType, setNewType] = useState('department');
    const [newOrg, setNewOrg] = useState('');
    const [newName, setNewName] = useState('');
    const [saving, setSaving] = useState(false);

    const [editingKey, setEditingKey] = useState(null); // `${type}:${id}`
    const [editingName, setEditingName] = useState('');
    const [busyKey, setBusyKey] = useState(null);

    const loadAll = async () => {
        setLoading(true);
        try {
            const [orgRes, depRes, posRes] = await Promise.all([
                service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.SUMMARY),
                service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.DEPARTMENTS_LIST),
                service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.POSITIONS_LIST),
            ]);
            setOrgs(Array.isArray(orgRes.data) ? orgRes.data : (orgRes.data?.results || []));
            setDepartments(Array.isArray(depRes.data) ? depRes.data : (depRes.data?.results || []));
            setPositions(Array.isArray(posRes.data) ? posRes.data : (posRes.data?.results || []));
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAll();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const rows = useMemo(() => {
        const combined = [
            ...departments.map((d) => ({...d, type: 'department'})),
            ...positions.map((p) => ({...p, type: 'position'})),
        ];
        return combined
            .filter((r) => (typeFilter === 'all' ? true : r.type === typeFilter))
            .filter((r) => (orgFilter ? String(r.organization) === String(orgFilter) : true))
            .filter((r) => (search ? r.name.toLowerCase().includes(search.toLowerCase()) : true))
            .sort((a, b) => (a.organization_name || '').localeCompare(b.organization_name || '') || a.name.localeCompare(b.name));
    }, [departments, positions, typeFilter, orgFilter, search]);

    const openAdd = (type) => {
        setNewType(type);
        setNewOrg(orgFilter || '');
        setNewName('');
        setAdding(true);
    };

    const cancelAdd = () => {
        setAdding(false);
        setNewName('');
    };

    const handleCreate = async () => {
        if (!newOrg || !newName.trim()) {
            enqueueSnackbar('Təşkilat və ad tələb olunur.', {variant: 'warning'});
            return;
        }
        setSaving(true);
        try {
            const endpoint = newType === 'department'
                ? NEXT_API_ENDPOINTS.ORGANIZATIONS.DEPARTMENTS_LIST
                : NEXT_API_ENDPOINTS.ORGANIZATIONS.POSITIONS_LIST;
            const res = await service_api.post(endpoint, {organization: newOrg, name: newName.trim()});
            if (newType === 'department') {
                setDepartments((prev) => [...prev, res.data]);
            } else {
                setPositions((prev) => [...prev, res.data]);
            }
            enqueueSnackbar(`${TYPE_META[newType].label} əlavə olundu.`, {variant: 'success'});
            cancelAdd();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setSaving(false);
        }
    };

    const startEdit = (row) => {
        setEditingKey(`${row.type}:${row.id}`);
        setEditingName(row.name);
    };

    const cancelEdit = () => {
        setEditingKey(null);
        setEditingName('');
    };

    const saveEdit = async (row) => {
        if (!editingName.trim()) return;
        setBusyKey(`${row.type}:${row.id}`);
        try {
            const endpoint = row.type === 'department'
                ? NEXT_API_ENDPOINTS.ORGANIZATIONS.DEPARTMENT_DETAIL(row.id)
                : NEXT_API_ENDPOINTS.ORGANIZATIONS.POSITION_DETAIL(row.id);
            const res = await service_api.patch(endpoint, {name: editingName.trim()});
            const setter = row.type === 'department' ? setDepartments : setPositions;
            setter((prev) => prev.map((item) => (item.id === row.id ? res.data : item)));
            enqueueSnackbar('Yadda saxlanıldı.', {variant: 'success', autoHideDuration: 1500});
            cancelEdit();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setBusyKey(null);
        }
    };

    const handleDelete = async (row) => {
        setBusyKey(`${row.type}:${row.id}`);
        try {
            const endpoint = row.type === 'department'
                ? NEXT_API_ENDPOINTS.ORGANIZATIONS.DEPARTMENT_DETAIL(row.id)
                : NEXT_API_ENDPOINTS.ORGANIZATIONS.POSITION_DETAIL(row.id);
            await service_api.delete(endpoint);
            const setter = row.type === 'department' ? setDepartments : setPositions;
            setter((prev) => prev.filter((item) => item.id !== row.id));
            enqueueSnackbar(`${TYPE_META[row.type].label} silindi.`, {variant: 'success', autoHideDuration: 1500});
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setBusyKey(null);
        }
    };

    const orgsWithCatalog = useMemo(() => {
        const ids = new Set([...departments, ...positions].map((r) => r.organization));
        return ids.size;
    }, [departments, positions]);

    return (
        <AppShell>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        İnzibatçı paneli
                    </Link>
                    {' / '}
                    <span style={{fontWeight: 700, color: GOV.textPrimary}}>Departamentlər və Vəzifələr</span>
                </Typography>

                <Typography sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5}}>
                    TƏŞKİLAT KATALOQU
                </Typography>
                <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>
                    Departamentlər və Vəzifələr
                </Typography>
                <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5, mb: 3, maxWidth: 720}}>
                    Hər təşkilatın öz departament/vəzifə siyahısını burada tərtib edin - bu siyahı
                    Şəxsi Kabinet və istifadəçi formalarında əl ilə yazmaq əvəzinə seçim (select)
                    kimi görünür.
                </Typography>

                {/* Stat kartları */}
                <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3}}>
                    <StatCard icon={ApartmentOutlinedIcon} label="Cəmi departament" value={departments.length} tint={GOV.navy}/>
                    <StatCard icon={BadgeOutlinedIcon} label="Cəmi vəzifə" value={positions.length} tint={GOV.goldDark}/>
                    <StatCard icon={CategoryOutlinedIcon} label="Kataloqu olan təşkilat" value={orgsWithCatalog} tint="#5B6B8C"/>
                </Box>

                {/* Toolbar */}
                <Box sx={{
                    display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'center',
                    backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2,
                    p: 2, mb: 2,
                }}>
                    <FormControl size="small" sx={{minWidth: 220}}>
                        <Select
                            displayEmpty value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}
                            sx={{backgroundColor: '#fff', fontSize: 13.5}}
                        >
                            <MenuItem value="">Bütün təşkilatlar</MenuItem>
                            {orgs.map((org) => (
                                <MenuItem key={org.id} value={org.id}>{org.full_name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    <ToggleButtonGroup
                        value={typeFilter} exclusive size="small"
                        onChange={(e, v) => v && setTypeFilter(v)}
                    >
                        <ToggleButton value="all" sx={{textTransform: 'none', fontWeight: 700, fontSize: 12.5, px: 1.75}}>
                            Hamısı
                        </ToggleButton>
                        <ToggleButton value="department" sx={{textTransform: 'none', fontWeight: 700, fontSize: 12.5, px: 1.75}}>
                            Departamentlər
                        </ToggleButton>
                        <ToggleButton value="position" sx={{textTransform: 'none', fontWeight: 700, fontSize: 12.5, px: 1.75}}>
                            Vəzifələr
                        </ToggleButton>
                    </ToggleButtonGroup>

                    <TextField
                        size="small" placeholder="Axtar..." value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        sx={{minWidth: 180, backgroundColor: '#fff'}}
                        InputProps={{startAdornment: (
                                <InputAdornment position="start"><SearchIcon sx={{fontSize: 17, color: GOV.textMuted}}/></InputAdornment>
                            )}}
                    />

                    <Box sx={{flexGrow: 1}}/>

                    <Button
                        onClick={() => openAdd('department')} startIcon={<AddIcon sx={{fontSize: 16}}/>}
                        sx={{
                            textTransform: 'none', fontWeight: 700, fontSize: 12.5, color: GOV.navy,
                            border: `1px solid ${GOV.cardBorder}`, px: 1.75,
                        }}
                    >
                        Departament
                    </Button>
                    <Button
                        onClick={() => openAdd('position')} startIcon={<AddIcon sx={{fontSize: 16}}/>}
                        sx={{
                            textTransform: 'none', fontWeight: 700, fontSize: 12.5, color: '#fff',
                            backgroundColor: GOV.navy, px: 1.75, '&:hover': {backgroundColor: GOV.navySoft},
                        }}
                    >
                        Vəzifə
                    </Button>
                </Box>

                {/* Cədvəl */}
                <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                    {loading ? (
                        <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                            <CircularProgress size={26}/>
                        </Box>
                    ) : (
                        <Box sx={{overflowX: 'auto'}}>
                            <Box component="table" sx={{width: '100%', borderCollapse: 'collapse', minWidth: 640}}>
                                <Box component="thead">
                                    <Box component="tr" sx={{borderBottom: `1px solid ${GOV.cardBorder}`}}>
                                        {['Növ', 'Ad', 'Təşkilat', ''].map((h) => (
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
                                    {adding && (
                                        <Box component="tr" sx={{
                                            borderBottom: `1px solid ${GOV.cardBorder}`, backgroundColor: `${GOV.gold}0C`,
                                        }}>
                                            <Box component="td" sx={{px: 2.5, py: 1.5}}>
                                                <ToggleButtonGroup
                                                    value={newType} exclusive size="small"
                                                    onChange={(e, v) => v && setNewType(v)}
                                                >
                                                    <ToggleButton value="department" sx={{fontSize: 11, px: 1.25, py: 0.4, textTransform: 'none'}}>
                                                        Departament
                                                    </ToggleButton>
                                                    <ToggleButton value="position" sx={{fontSize: 11, px: 1.25, py: 0.4, textTransform: 'none'}}>
                                                        Vəzifə
                                                    </ToggleButton>
                                                </ToggleButtonGroup>
                                            </Box>
                                            <Box component="td" sx={{px: 2.5, py: 1.5}}>
                                                <TextField
                                                    size="small" autoFocus placeholder="Ad daxil edin"
                                                    value={newName} onChange={(e) => setNewName(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                                                    sx={{backgroundColor: '#fff', minWidth: 200}}
                                                />
                                            </Box>
                                            <Box component="td" sx={{px: 2.5, py: 1.5}}>
                                                <FormControl size="small" sx={{minWidth: 200}}>
                                                    <Select
                                                        displayEmpty value={newOrg} onChange={(e) => setNewOrg(e.target.value)}
                                                        sx={{backgroundColor: '#fff', fontSize: 13}}
                                                    >
                                                        <MenuItem value="" disabled>
                                                            <em style={{color: GOV.textMuted, fontStyle: 'normal'}}>Təşkilat seçin</em>
                                                        </MenuItem>
                                                        {orgs.map((org) => (
                                                            <MenuItem key={org.id} value={org.id}>{org.full_name}</MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            </Box>
                                            <Box component="td" sx={{px: 2.5, py: 1.5, whiteSpace: 'nowrap'}}>
                                                <IconButton size="small" disabled={saving} onClick={handleCreate} sx={{color: '#1E7A3C'}}>
                                                    {saving ? <CircularProgress size={16}/> : <CheckIcon sx={{fontSize: 18}}/>}
                                                </IconButton>
                                                <IconButton size="small" disabled={saving} onClick={cancelAdd} sx={{color: GOV.textMuted}}>
                                                    <CloseIcon sx={{fontSize: 18}}/>
                                                </IconButton>
                                            </Box>
                                        </Box>
                                    )}

                                    {rows.length === 0 && !adding ? (
                                        <Box component="tr">
                                            <Box component="td" colSpan={4} sx={{textAlign: 'center', py: 6}}>
                                                <CategoryOutlinedIcon sx={{fontSize: 28, color: GOV.textMuted, mb: 1}}/>
                                                <Typography sx={{fontSize: 13.5, color: GOV.textMuted}}>
                                                    {search || orgFilter || typeFilter !== 'all'
                                                        ? 'Bu filtrə uyğun nəticə tapılmadı.'
                                                        : 'Hələ departament/vəzifə əlavə olunmayıb.'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    ) : (
                                        rows.map((row) => {
                                            const key = `${row.type}:${row.id}`;
                                            const isEditing = editingKey === key;
                                            const isBusy = busyKey === key;
                                            return (
                                                <Box component="tr" key={key} sx={{
                                                    borderBottom: `1px solid ${GOV.cardBorder}`,
                                                    '&:last-of-type': {borderBottom: 'none'},
                                                    '&:hover .row-actions': {opacity: 1},
                                                    opacity: isBusy ? 0.5 : 1, transition: 'opacity .15s',
                                                }}>
                                                    <Box component="td" sx={{px: 2.5, py: 1.75}}>
                                                        <TypeChip type={row.type}/>
                                                    </Box>
                                                    <Box component="td" sx={{px: 2.5, py: 1.75}}>
                                                        {isEditing ? (
                                                            <TextField
                                                                size="small" autoFocus value={editingName}
                                                                onChange={(e) => setEditingName(e.target.value)}
                                                                onKeyDown={(e) => e.key === 'Enter' && saveEdit(row)}
                                                                sx={{backgroundColor: '#fff', minWidth: 200}}
                                                            />
                                                        ) : (
                                                            <Typography sx={{fontSize: 13.5, fontWeight: 600, color: GOV.textPrimary}}>
                                                                {row.name}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                    <Box component="td" sx={{px: 2.5, py: 1.75}}>
                                                        <Typography sx={{fontSize: 13, color: GOV.textMuted}}>
                                                            {row.organization_name}
                                                        </Typography>
                                                    </Box>
                                                    <Box component="td" sx={{px: 2.5, py: 1.75, whiteSpace: 'nowrap'}}>
                                                        {isEditing ? (
                                                            <>
                                                                <IconButton size="small" onClick={() => saveEdit(row)} sx={{color: '#1E7A3C'}}>
                                                                    <CheckIcon sx={{fontSize: 17}}/>
                                                                </IconButton>
                                                                <IconButton size="small" onClick={cancelEdit} sx={{color: GOV.textMuted}}>
                                                                    <CloseIcon sx={{fontSize: 17}}/>
                                                                </IconButton>
                                                            </>
                                                        ) : (
                                                            <Box className="row-actions" sx={{
                                                                display: 'inline-flex', opacity: {xs: 1, sm: 0}, transition: 'opacity .12s',
                                                            }}>
                                                                <IconButton size="small" onClick={() => startEdit(row)} sx={{color: GOV.textMuted}}>
                                                                    <EditOutlinedIcon sx={{fontSize: 16}}/>
                                                                </IconButton>
                                                                <IconButton size="small" onClick={() => handleDelete(row)} sx={{color: '#B91C1C'}}>
                                                                    <DeleteOutlineIcon sx={{fontSize: 16}}/>
                                                                </IconButton>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Box>
                                            );
                                        })
                                    )}
                                </Box>
                            </Box>
                        </Box>
                    )}
                </Box>
            </Box>
        </AppShell>
    );
}
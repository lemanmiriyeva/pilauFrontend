"use client"
import React, {useEffect, useRef, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import Link from '@mui/material/Link';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {GOV} from "@/components/theme/govColors";
import {SimpleTable, formatDate} from "./shared";

export default function ActivityDocsTab({orgId, canCreate, canDelete, onChanged}) {
    const {enqueueSnackbar} = useSnackbar();
    const fileRef = useRef(null);
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [busyId, setBusyId] = useState(null);

    const load = async () => {
        setLoading(true);
        try {
            const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.ACTIVITY_DOCUMENTS(orgId));
            setRows(Array.isArray(res.data) ? res.data : []);
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { load(); }, [orgId]);

    const upload = async () => {
        setError('');
        if (!title.trim()) return setError('Sənədin adını yazın.');
        if (!file) return setError('Fayl seçin.');
        setSaving(true);
        try {
            const fd = new FormData();
            fd.append('title', title.trim());
            fd.append('file', file);
            await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.ACTIVITY_DOCUMENTS(orgId), fd);
            enqueueSnackbar('Sənəd yükləndi.', {variant: 'success'});
            setOpen(false); setTitle(''); setFile(null);
            await load();
            onChanged && onChanged();
        } catch (e) {
            const d = e?.response?.data;
            setError(d?.title || d?.file || d?.detail || handleError(e));
        } finally {
            setSaving(false);
        }
    };

    const remove = async (row) => {
        if (!window.confirm(`"${row.title}" sənədi silinsin?`)) return;
        setBusyId(row.id);
        try {
            await service_api.delete(NEXT_API_ENDPOINTS.ORGANIZATIONS.ACTIVITY_DOCUMENT(row.id));
            setRows((prev) => prev.filter((r) => r.id !== row.id));
            onChanged && onChanged();
        } catch (e) {
            enqueueSnackbar(handleError(e), {variant: 'error'});
        } finally {
            setBusyId(null);
        }
    };

    const columns = [
        {label: 'SƏNƏDİN ADI', width: '2fr', render: (r) => <b>{r.title}</b>},
        {label: 'FAYL', width: '1.6fr', render: (r) => r.filename},
        {label: 'YÜKLƏNMƏ TARİXİ', width: '1fr', render: (r) => formatDate(r.created_at)},
        {label: 'YÜKLƏYƏN', width: '1fr', render: (r) => r.uploaded_by || '—'},
        {
            label: '', width: '1.1fr', render: (r) => (
                <Box sx={{display: 'flex', gap: 2}}>
                    <Link
                        href={`/api/${NEXT_API_ENDPOINTS.ORGANIZATIONS.ACTIVITY_DOCUMENT_DOWNLOAD(r.id)}`}
                        target="_blank" rel="noopener noreferrer"
                        sx={{fontSize: 12.5, fontWeight: 600, color: GOV.navySoft, textDecoration: 'none'}}
                    >
                        Yüklə
                    </Link>
                    {canDelete && (
                        <Link
                            component="button" disabled={busyId === r.id} onClick={() => remove(r)}
                            sx={{fontSize: 12.5, fontWeight: 600, color: '#B0374D', textDecoration: 'none'}}
                        >
                            Sil
                        </Link>
                    )}
                </Box>
            ),
        },
    ];

    return (
        <Box>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2, flexWrap: 'wrap'}}>
                <Typography sx={{fontSize: 13, color: GOV.textMuted}}>
                    Təşkilatın fəaliyyətinə dair sənədlər (nizamnamə, qeydiyyat şəhadətnaməsi və s.).
                </Typography>
                {canCreate && (
                    <Button
                        variant="contained" startIcon={<UploadFileIcon/>} onClick={() => setOpen(true)}
                        sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, fontSize: 13, '&:hover': {backgroundColor: GOV.navyMid}}}
                    >
                        Sənəd yüklə
                    </Button>
                )}
            </Box>

            {loading ? (
                <Box sx={{display: 'flex', justifyContent: 'center', py: 5}}><CircularProgress size={22}/></Box>
            ) : (
                <SimpleTable columns={columns} rows={rows} empty="Fəaliyyətə dair sənəd yüklənməyib."/>
            )}

            <Dialog open={open} onClose={() => !saving && setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle sx={{fontWeight: 800}}>Sənəd yüklə</DialogTitle>
                <DialogContent>
                    <TextField
                        size="small" fullWidth label="Sənədin adı *" value={title}
                        onChange={(e) => setTitle(e.target.value)} sx={{mt: 1, mb: 2}}
                    />
                    <input ref={fileRef} type="file" hidden onChange={(e) => setFile(e.target.files?.[0] || null)}/>
                    <Button
                        variant="outlined" onClick={() => fileRef.current?.click()}
                        sx={{textTransform: 'none', fontWeight: 600, color: GOV.textPrimary, borderColor: GOV.cardBorder}}
                    >
                        {file ? file.name : 'Fayl seç (maks. 15 MB)'}
                    </Button>
                    {error && <Typography sx={{fontSize: 12.5, color: '#d32f2f', mt: 2}}>{error}</Typography>}
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2}}>
                    <Button onClick={() => setOpen(false)} disabled={saving} sx={{textTransform: 'none'}}>Ləğv et</Button>
                    <Button
                        variant="contained" onClick={upload} disabled={saving}
                        sx={{backgroundColor: GOV.navy, textTransform: 'none', fontWeight: 700, '&:hover': {backgroundColor: GOV.navyMid}}}
                    >
                        {saving ? 'Yüklənir...' : 'Yüklə'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

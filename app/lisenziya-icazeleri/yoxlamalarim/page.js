"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import {useRouter} from "next/navigation";
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";

   function DocRow({doc, onApprove, onReject, busy}) {
           return (
                   <Box sx={{
                           display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2,
                           px: 2.5, py: 2, borderBottom: `1px solid ${GOV.cardBorder}`,
                           '&:last-of-type': {borderBottom: 'none'}, opacity: busy ? 0.55 : 1,
                           transition: 'opacity .15s',
                       }}>
                           <Box sx={{minWidth: 0}}>
                               <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>
                                   {doc.title || doc.category} · {doc.number}
                               </Typography>
                               <Typography sx={{fontSize: 12, color: GOV.textMuted, mt: 0.3}}>
                                   {doc.category} · {doc.applicant_name || 'Müəssisə göstərilməyib'}
                               </Typography>
                           </Box>
                           <Box sx={{display: 'flex', gap: 1, flexShrink: 0}}>
                               <Button
                                   size="small" variant="outlined" color="error" disabled={busy}
                                   startIcon={<HighlightOffIcon sx={{fontSize: 16}}/>}
                                   onClick={() => onReject(doc)}
                                   sx={{textTransform: 'none', fontSize: 12.5, fontWeight: 700}}
                               >
                                   Rədd et
                               </Button>
                               <Button
                                   size="small" variant="contained" disabled={busy}
                                   startIcon={<CheckCircleOutlineIcon sx={{fontSize: 16}}/>}
                                   onClick={() => onApprove(doc)}
                                   sx={{
                                       backgroundColor: GOV.navy, textTransform: 'none', fontSize: 12.5, fontWeight: 700,
                                       '&:hover': {backgroundColor: GOV.navyMid},
                                   }}
                               >
                                   Təsdiqlə
                               </Button>
                       </Box>
               </Box>
           );
       }

export default function Page() {
       const router = useRouter();
       const {enqueueSnackbar} = useSnackbar();
       const [stage, setStage] = useState(1);
       const [docsByStage, setDocsByStage] = useState({1: null, 2: null});
       const [loading, setLoading] = useState(true);
       const [busyId, setBusyId] = useState(null);
       const [rejectTarget, setRejectTarget] = useState(null);
       const [rejectReason, setRejectReason] = useState('');
   
           const load = async (targetStage) => {
               setLoading(true);
               try {
                       const res = await service_api.get(
                               `${NEXT_API_ENDPOINTS.LICENSES.PERMIT_LIST}?approval_stage=${targetStage}`
                           );
                       setDocsByStage((prev) => ({...prev, [targetStage]: res.data}));
                   } catch (e) {
                       enqueueSnackbar(handleError(e), {variant: 'error'});
                       setDocsByStage((prev) => ({...prev, [targetStage]: []}));
                   } finally {
                       setLoading(false);
                   }
           };
   
           useEffect(() => {
                   load(1);
                   load(2);
               }, []);
   
           const removeFromList = (docId) => {
               setDocsByStage((prev) => ({
                       ...prev,
                       [stage]: (prev[stage] || []).filter((d) => d.id !== docId),
                   }));
           };
   
           const handleApprove = async (doc) => {
               setBusyId(doc.id);
               try {
                       await service_api.post(NEXT_API_ENDPOINTS.LICENSES.PERMIT_APPROVE(doc.id), {});
                       enqueueSnackbar(`${doc.number} təsdiqləndi.`, {variant: 'success', autoHideDuration: 2500});
                       removeFromList(doc.id);
                   } catch (e) {
                       enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
                   } finally {
                       setBusyId(null);
                   }
           };
   
           const openReject = (doc) => {
               setRejectTarget(doc);
               setRejectReason('');
           };
   
           const handleReject = async () => {
               if (!rejectTarget) return;
               if (!rejectReason.trim()) {
                       enqueueSnackbar('Rədd səbəbi tələb olunur.', {variant: 'warning'});
                       return;
                   }
               setBusyId(rejectTarget.id);
               try {
                       await service_api.post(NEXT_API_ENDPOINTS.LICENSES.PERMIT_REJECT(rejectTarget.id), {
                               reason: rejectReason.trim(),
                           });
                       enqueueSnackbar(`${rejectTarget.number} rədd edildi.`, {variant: 'info', autoHideDuration: 2500});
                       removeFromList(rejectTarget.id);
                       setRejectTarget(null);
                   } catch (e) {
                       enqueueSnackbar(e?.response?.data?.detail || handleError(e), {variant: 'error'});
                   } finally {
                       setBusyId(null);
                   }
           };
   
           const docs = docsByStage[stage];
       const stage1Count = docsByStage[1]?.length ?? null;
       const stage2Count = docsByStage[2]?.length ?? null;
   
           return (
               <AppShell>
                       <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                           <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 1}}>
                               <Link component="button" onClick={() => router.push(APP_ROUTES.HOME)}
                                     sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                                   Ana Səhifə
                               </Link>
                               {' / '}
                               <span style={{fontWeight: 700, color: GOV.textPrimary}}>Yoxlamalarım</span>
                           </Typography>
           
                           <Typography sx={{fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5}}>
                               LİSENZİYA VƏ SƏNƏDLƏR · MƏRHƏLƏLİ TƏSDİQ
                           </Typography>
                           <Typography sx={{fontSize: 24, fontWeight: 800, color: GOV.textPrimary}}>
                               Yoxlamalarım
                           </Typography>
                           <Typography sx={{fontSize: 13, color: GOV.textMuted, mt: 0.5, mb: 3}}>
                               Sizə göndərilmiş, hazırda gözləyən sənədlər. Yalnız sizin icraçı təyin olunduğunuz
                               mərhələdəki sənədlər göstərilir.
                           </Typography>
           
                           <Tabs
                               value={stage} onChange={(e, v) => setStage(v)}
                               sx={{mb: 2, minHeight: 36, '& .MuiTab-root': {minHeight: 36, textTransform: 'none', fontWeight: 700, fontSize: 13}}}
                           >
                               <Tab value={1} label={`1-ci mərhələ${stage1Count !== null ? ` (${stage1Count})` : ''}`}/>
                               <Tab value={2} label={`2-ci mərhələ${stage2Count !== null ? ` (${stage2Count})` : ''}`}/>
                           </Tabs>
       
                       <Box sx={{backgroundColor: '#fff', border: `1px solid ${GOV.cardBorder}`, borderRadius: 2, overflow: 'hidden'}}>
                               {loading && docs === null ? (
                                   <Box sx={{display: 'flex', justifyContent: 'center', py: 6}}>
                                           <CircularProgress size={26}/>
                                       </Box>
                               ) : !docs || docs.length === 0 ? (
                                   <Box sx={{textAlign: 'center', py: 6}}>
                                           <InfoOutlinedIcon sx={{fontSize: 28, color: GOV.textMuted, mb: 1}}/>
                                           <Typography sx={{fontSize: 14, color: GOV.textMuted}}>
                                               Gözləyən sənəd yoxdur.
                                           </Typography>
                                       </Box>
                               ) : (
                                   docs.map((doc) => (
                                           <DocRow
                                           key={doc.id} doc={doc} busy={busyId === doc.id}
                                           onApprove={handleApprove} onReject={openReject}
                                       />
                                   ))
                               )}
                           </Box>
                   </Box>
   
                   <Dialog open={!!rejectTarget} onClose={() => setRejectTarget(null)} fullWidth maxWidth="xs">
                           <DialogTitle sx={{fontSize: 16, fontWeight: 700}}>
                               Sənədi rədd et
                           </DialogTitle>
                           <DialogContent>
                               <Typography sx={{fontSize: 13, color: GOV.textMuted, mb: 2}}>
                                   {rejectTarget?.number} nömrəli sənədi rədd etmək üzrəsiniz. Səbəbi qeyd edin.
                               </Typography>
                               <TextField
                                   fullWidth multiline minRows={3} autoFocus
                                   placeholder="Rədd səbəbi..." value={rejectReason}
                                   onChange={(e) => setRejectReason(e.target.value)}
                               />
                           </DialogContent>
                           <DialogActions sx={{px: 3, pb: 2.5}}>
                               <Button onClick={() => setRejectTarget(null)} sx={{textTransform: 'none'}}>
                                   Ləğv et
                               </Button>
                               <Button
                                   variant="contained" color="error" onClick={handleReject}
                                   disabled={busyId === rejectTarget?.id}
                                   sx={{textTransform: 'none', fontWeight: 700}}
                               >
                                   Rədd et
                               </Button>
                           </DialogActions>
               </Dialog>
           </AppShell>
       );
   }
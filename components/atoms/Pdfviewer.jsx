"use client"
import React, {useEffect, useRef, useState} from 'react';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import {GOV} from "@/components/theme/govColors";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;
const DEFAULT_SCALE = 1.15;

/**
 * pdfjs-dist ilə tam funksional PDF baxıcısı: səhifələmə, böyütmə/kiçiltmə, tam ekran.
 * Brauzerin öz (kiçik, məhdud) PDF plaginini <iframe>-ə etibar etmək əvəzinə sənədi canvas-a
 * özümüz render edirik ki, görünüş həmişə eyni, tam ölçülü və idarə edilə bilən olsun.
 */
export default function Pdfviewer({src, title}) {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const pdfDocRef = useRef(null);
    const renderTaskRef = useRef(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [numPages, setNumPages] = useState(0);
    const [pageNum, setPageNum] = useState(1);
    const [scale, setScale] = useState(DEFAULT_SCALE);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // Sənədi yüklə (src dəyişəndə yenidən).
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setError(null);
        setNumPages(0);
        setPageNum(1);

        (async () => {
            try {
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
                    'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
                ).toString();

                const res = await fetch(src, {credentials: 'same-origin'});
                if (!res.ok) throw new Error('Sənəd yüklənmədi.');
                const buffer = await res.arrayBuffer();
                if (cancelled) return;

                const pdf = await pdfjsLib.getDocument({data: buffer}).promise;
                if (cancelled) return;

                pdfDocRef.current = pdf;
                setNumPages(pdf.numPages);
                setLoading(false);
            } catch (e) {
                if (!cancelled) {
                    setError('Sənəd göstərilə bilmədi.');
                    setLoading(false);
                }
            }
        })();

        return () => {
            cancelled = true;
            pdfDocRef.current = null;
        };
    }, [src]);

    // Cari səhifəni (və ya scale dəyişəndə eyni səhifəni) canvas-a render et.
    useEffect(() => {
        const pdf = pdfDocRef.current;
        if (!pdf || !canvasRef.current) return;

        let cancelled = false;

        (async () => {
            const page = await pdf.getPage(pageNum);
            if (cancelled) return;

            const viewport = page.getViewport({scale});
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            const outputScale = window.devicePixelRatio || 1;
            canvas.width = Math.floor(viewport.width * outputScale);
            canvas.height = Math.floor(viewport.height * outputScale);
            canvas.style.width = `${Math.floor(viewport.width)}px`;
            canvas.style.height = `${Math.floor(viewport.height)}px`;

            if (renderTaskRef.current) {
                renderTaskRef.current.cancel();
            }
            const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;
            const task = page.render({canvasContext: ctx, viewport, transform});
            renderTaskRef.current = task;
            try {
                await task.promise;
            } catch (e) {
                // RenderingCancelledException - normaldır (sürətli səhifə/scale dəyişəndə əvvəlki render ləğv olunur).
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [pageNum, scale, numPages]);

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const goPrev = () => setPageNum((p) => Math.max(1, p - 1));
    const goNext = () => setPageNum((p) => Math.min(numPages, p + 1));
    const zoomIn = () => setScale((s) => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)));
    const zoomOut = () => setScale((s) => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)));
    const resetZoom = () => setScale(DEFAULT_SCALE);

    const toggleFullscreen = () => {
        if (!containerRef.current) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            containerRef.current.requestFullscreen?.();
        }
    };

    return (
        <Box
            ref={containerRef}
            sx={{
                border: `1px solid ${GOV.cardBorder}`, borderRadius: 1.5, overflow: 'hidden',
                backgroundColor: isFullscreen ? '#fff' : GOV.pageBg,
                display: 'flex', flexDirection: 'column',
                height: isFullscreen ? '100vh' : {xs: 560, sm: 720, md: 860},
            }}
        >
            {/* Alət paneli */}
            <Box sx={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
                px: 1.5, py: 1, backgroundColor: '#fff', borderBottom: `1px solid ${GOV.cardBorder}`, flexShrink: 0,
            }}>
                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                    <Tooltip title="Əvvəlki səhifə">
                        <span>
                            <IconButton size="small" onClick={goPrev} disabled={loading || pageNum <= 1}>
                                <ChevronLeftIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Typography sx={{fontSize: 12.5, fontWeight: 600, color: GOV.textPrimary, minWidth: 72, textAlign: 'center'}}>
                        {loading ? '—' : `${pageNum} / ${numPages}`}
                    </Typography>
                    <Tooltip title="Növbəti səhifə">
                        <span>
                            <IconButton size="small" onClick={goNext} disabled={loading || pageNum >= numPages}>
                                <ChevronRightIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>

                <Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>
                    <Tooltip title="Kiçilt">
                        <span>
                            <IconButton size="small" onClick={zoomOut} disabled={loading || scale <= MIN_SCALE}>
                                <ZoomOutIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Typography sx={{fontSize: 12.5, fontWeight: 600, color: GOV.textMuted, minWidth: 42, textAlign: 'center'}}>
                        {Math.round(scale / DEFAULT_SCALE * 100)}%
                    </Typography>
                    <Tooltip title="Böyüt">
                        <span>
                            <IconButton size="small" onClick={zoomIn} disabled={loading || scale >= MAX_SCALE}>
                                <ZoomInIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Miqyası sıfırla">
                        <span>
                            <IconButton size="small" onClick={resetZoom} disabled={loading}>
                                <RestartAltIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title={isFullscreen ? 'Tam ekrandan çıx' : 'Tam ekran'}>
                        <IconButton size="small" onClick={toggleFullscreen}>
                            {isFullscreen ? <FullscreenExitIcon fontSize="small"/> : <FullscreenIcon fontSize="small"/>}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Sənəd sahəsi */}
            <Box sx={{
                flexGrow: 1, overflow: 'auto', display: 'flex',
                justifyContent: 'center', alignItems: loading || error ? 'center' : 'flex-start',
                p: loading || error ? 0 : 2.5,
            }}>
                {loading && <CircularProgress size={26}/>}
                {error && (
                    <Typography sx={{fontSize: 13, color: GOV.textMuted}}>{error}</Typography>
                )}
                {!loading && !error && (
                    <Box
                        component="canvas" ref={canvasRef} role="img"
                        aria-label={title || 'Sənəd'}
                        sx={{boxShadow: '0 2px 12px rgba(2, 6, 36, 0.12)', backgroundColor: '#fff'}}
                    />
                )}
            </Box>
        </Box>
    );
}
"use client";

import React, {useEffect, useRef, useState} from "react";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Tooltip from "@mui/material/Tooltip";

import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

import {GOV} from "@/components/theme/govColors";

const MIN_SCALE = 0.5;
const MAX_SCALE = 3;
const SCALE_STEP = 0.25;
const DEFAULT_SCALE = 1.15;

export default function PdfViewer({src, title}) {
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

    /**
     * PDF sənədini yüklə
     */
    useEffect(() => {
        let cancelled = false;

        const loadPdf = async () => {
            setLoading(true);
            setError(null);
            setNumPages(0);
            setPageNum(1);

            try {
                // pdfjs-dist-i yalnız client tərəfdə yükləyirik
                const pdfjsLib = await import("pdfjs-dist");

                // Worker public qovluğundan gəlir
                pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

                const response = await fetch(src, {
                    credentials: "same-origin",
                });

                if (!response.ok) {
                    throw new Error(`PDF yüklənmədi. HTTP status: ${response.status}`);
                }

                const buffer = await response.arrayBuffer();

                if (cancelled) return;

                const pdf = await pdfjsLib
                    .getDocument({
                        data: buffer,
                    }).promise;

                if (cancelled) {
                    await pdf.destroy();
                    return;
                }

                pdfDocRef.current = pdf;

                setNumPages(pdf.numPages);
                setPageNum(1);
                setLoading(false);
            } catch (e) {
                console.error("PDF loading error:", e);

                if (!cancelled) {
                    setError("Sənəd göstərilə bilmədi.");
                    setLoading(false);
                }
            }
        };

        if (src) {
            loadPdf();
        } else {
            setError("PDF faylı göstərilməyib.");
            setLoading(false);
        }

        return () => {
            cancelled = true;

            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch (e) {
                    // ignore
                }

                renderTaskRef.current = null;
            }

            if (pdfDocRef.current) {
                try {
                    pdfDocRef.current.destroy();
                } catch (e) {
                    // ignore
                }

                pdfDocRef.current = null;
            }
        };
    }, [src]);

    /**
     * Cari səhifəni canvas-a render et
     */
    useEffect(() => {
        const pdf = pdfDocRef.current;
        const canvas = canvasRef.current;

        if (!pdf || !canvas || !numPages) {
            return;
        }

        let cancelled = false;

        const renderPage = async () => {
            try {
                // Əvvəlki render prosesini dayandır
                if (renderTaskRef.current) {
                    try {
                        renderTaskRef.current.cancel();
                    } catch (e) {
                        // ignore
                    }

                    renderTaskRef.current = null;
                }

                const page = await pdf.getPage(pageNum);

                if (cancelled) return;

                const viewport = page.getViewport({
                    scale,
                });

                const context = canvas.getContext("2d");

                if (!context) {
                    throw new Error("Canvas context tapılmadı.");
                }

                const outputScale = window.devicePixelRatio || 1;

                canvas.width = Math.floor(viewport.width * outputScale);

                canvas.height = Math.floor(viewport.height * outputScale);

                canvas.style.width = `${Math.floor(viewport.width)}px`;
                canvas.style.height = `${Math.floor(viewport.height)}px`;

                const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0,] : null;

                const renderTask = page.render({
                    canvasContext: context, viewport, transform,
                });

                renderTaskRef.current = renderTask;

                await renderTask.promise;

                if (!cancelled) {
                    renderTaskRef.current = null;
                }
            } catch (e) {
                // Səhifə dəyişəndə və ya zoom ediləndə əvvəlki
                // render prosesinin cancel olunması normaldır.
                if (e?.name === "RenderingCancelledException" || cancelled) {
                    return;
                }

                console.error("PDF render error:", e);
            }
        };

        renderPage();

        return () => {
            cancelled = true;

            if (renderTaskRef.current) {
                try {
                    renderTaskRef.current.cancel();
                } catch (e) {
                    // ignore
                }

                renderTaskRef.current = null;
            }
        };
    }, [pageNum, scale, numPages]);

    /**
     * Fullscreen statusunu izlə
     */
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
        };
    }, []);

    /**
     * Səhifə dəyişmə
     */
    const goPrev = () => {
        setPageNum((current) => Math.max(1, current - 1));
    };

    const goNext = () => {
        setPageNum((current) => Math.min(numPages, current + 1));
    };

    /**
     * Zoom
     */
    const zoomIn = () => {
        setScale((current) => Math.min(MAX_SCALE, +(current + SCALE_STEP).toFixed(2)));
    };

    const zoomOut = () => {
        setScale((current) => Math.max(MIN_SCALE, +(current - SCALE_STEP).toFixed(2)));
    };

    const resetZoom = () => {
        setScale(DEFAULT_SCALE);
    };

    /**
     * Fullscreen
     */
    const toggleFullscreen = async () => {
        if (!containerRef.current) {
            return;
        }

        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            } else {
                await containerRef.current.requestFullscreen();
            }
        } catch (e) {
            console.error("Fullscreen error:", e);
        }
    };

    /**
     * Zoom faizini göstər
     */
    const zoomPercentage = Math.round((scale / DEFAULT_SCALE) * 100);

    return (<Box
            ref={containerRef}
            sx={{
                border: `1px solid ${GOV.cardBorder}`,
                borderRadius: 1.5,
                overflow: "hidden",
                backgroundColor: isFullscreen ? "#fff" : GOV.pageBg,
                display: "flex",
                flexDirection: "column",
                height: isFullscreen ? "100vh" : {
                    xs: 560, sm: 720, md: 860,
                },
            }}
        >
            {/* Alət paneli */}
            <Box
                sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    backgroundColor: "#fff",
                    borderBottom: `1px solid ${GOV.cardBorder}`,
                    flexShrink: 0,
                }}
            >
                {/* Səhifələmə */}
                <Box
                    sx={{
                        display: "flex", alignItems: "center", gap: 0.5,
                    }}
                >
                    <Tooltip title="Əvvəlki səhifə">
                        <span>
                            <IconButton
                                size="small"
                                onClick={goPrev}
                                disabled={loading || pageNum <= 1}
                            >
                                <ChevronLeftIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Typography
                        sx={{
                            fontSize: 12.5, fontWeight: 600, color: GOV.textPrimary, minWidth: 72, textAlign: "center",
                        }}
                    >
                        {loading ? "—" : `${pageNum} / ${numPages}`}
                    </Typography>

                    <Tooltip title="Növbəti səhifə">
                        <span>
                            <IconButton
                                size="small"
                                onClick={goNext}
                                disabled={loading || pageNum >= numPages}
                            >
                                <ChevronRightIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>

                {/* Zoom və fullscreen */}
                <Box
                    sx={{
                        display: "flex", alignItems: "center", gap: 0.5,
                    }}
                >
                    <Tooltip title="Kiçilt">
                        <span>
                            <IconButton
                                size="small"
                                onClick={zoomOut}
                                disabled={loading || scale <= MIN_SCALE}
                            >
                                <ZoomOutIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Typography
                        sx={{
                            fontSize: 12.5, fontWeight: 600, color: GOV.textMuted, minWidth: 42, textAlign: "center",
                        }}
                    >
                        {zoomPercentage}%
                    </Typography>

                    <Tooltip title="Böyüt">
                        <span>
                            <IconButton
                                size="small"
                                onClick={zoomIn}
                                disabled={loading || scale >= MAX_SCALE}
                            >
                                <ZoomInIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Tooltip title="Miqyası sıfırla">
                        <span>
                            <IconButton
                                size="small"
                                onClick={resetZoom}
                                disabled={loading}
                            >
                                <RestartAltIcon fontSize="small"/>
                            </IconButton>
                        </span>
                    </Tooltip>

                    <Tooltip
                        title={isFullscreen ? "Tam ekrandan çıx" : "Tam ekran"}
                    >
                        <IconButton
                            size="small"
                            onClick={toggleFullscreen}
                            disabled={loading}
                        >
                            {isFullscreen ? (<FullscreenExitIcon fontSize="small"/>) : (
                                <FullscreenIcon fontSize="small"/>)}
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {/* Sənəd sahəsi */}
            <Box
                sx={{
                    flexGrow: 1,
                    overflow: "auto",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: loading || error ? "center" : "flex-start",
                    p: loading || error ? 0 : 2.5,
                }}
            >
                {/* Loading */}
                {loading && (<CircularProgress size={26}/>)}

                {/* Error */}
                {error && (<Typography
                        sx={{
                            fontSize: 13, color: GOV.textMuted,
                        }}
                    >
                        {error}
                    </Typography>)}

                {/* PDF Canvas */}
                {!loading && !error && (<Box
                        component="canvas"
                        ref={canvasRef}
                        role="img"
                        aria-label={title || "Sənəd"}
                        sx={{
                            boxShadow: "0 2px 12px rgba(2, 6, 36, 0.12)",
                            backgroundColor: "#fff",
                            maxWidth: "none",
                            display: "block",
                        }}
                    />)}
            </Box>
        </Box>);
}
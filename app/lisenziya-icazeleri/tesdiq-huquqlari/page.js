"use client";

import React, {useEffect, useState} from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

import SearchIcon from "@mui/icons-material/Search";

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
    const [search, setSearch] = useState("");


    // ========================================================================
    // LOAD
    // ========================================================================

    const load = async () => {

        setLoading(true);

        try {

            const res = await service_api.get(NEXT_API_ENDPOINTS.WORKFLOW.STAGE2_PERMISSIONS);

            setData(res.data);

        } catch (e) {

            enqueueSnackbar(handleError(e), {
                variant: "error"
            });

        } finally {

            setLoading(false);

        }
    };


    useEffect(() => {

        load();

    }, []);


    // ========================================================================
    // TOGGLE
    // ========================================================================

    const handleToggle = async (stage, userId, docType, value) => {

        const key = `${stage}:${userId}:${docType}`;

        setPendingKey(key);


        const usersKey = stage === "stage1" ? "stage1_users" : "stage2_users";


        // --------------------------------------------------------------------
        // OPTIMISTIC UPDATE
        // --------------------------------------------------------------------

        setData((prev) => {

            if (!prev) {
                return prev;
            }

            return {

                ...prev,

                [usersKey]: (prev[usersKey] || []).map((user) => {

                    if (user.id !== userId) {
                        return user;
                    }

                    return {

                        ...user,

                        permissions: {

                            ...user.permissions,

                            [docType]: value,

                        },

                    };

                }),

            };

        });


        // --------------------------------------------------------------------
        // ENDPOINT
        // --------------------------------------------------------------------

        const endpoint = stage === "stage1" ? NEXT_API_ENDPOINTS.WORKFLOW.STAGE1_PERMISSIONS : NEXT_API_ENDPOINTS.WORKFLOW.STAGE2_PERMISSIONS;


        try {

            await service_api.post(endpoint, {
                user: userId, doc_type: docType, value,
            });

        } catch (e) {

            enqueueSnackbar(handleError(e), {
                variant: "error"
            });


            // ---------------------------------------------------------------
            // ROLLBACK
            // ---------------------------------------------------------------

            setData((prev) => {

                if (!prev) {
                    return prev;
                }

                return {

                    ...prev,

                    [usersKey]: (prev[usersKey] || []).map((user) => {

                        if (user.id !== userId) {
                            return user;
                        }

                        return {

                            ...user,

                            permissions: {

                                ...user.permissions,

                                [docType]: !value,

                            },

                        };

                    }),

                };

            });

        } finally {

            setPendingKey(null);

        }

    };


    // ========================================================================
    // SEARCH
    // ========================================================================

    const q = search
        .trim()
        .toLowerCase();


    const filterUsers = (users) => {

        if (!q) {
            return users || [];
        }

        return (users || []).filter((user) => {

            return (

                user.full_name
                    ?.toLowerCase()
                    .includes(q)

                ||

                user.username
                    ?.toLowerCase()
                    .includes(q)

                ||

                user.department
                    ?.toLowerCase()
                    .includes(q)

                ||

                user.position
                    ?.toLowerCase()
                    .includes(q)

            );

        });

    };


    const stage1Users = filterUsers(data?.stage1_users);


    const stage2Users = filterUsers(data?.stage2_users);


    // ========================================================================
    // RENDER
    // ========================================================================

    return (

        <AppShell>

            <Box
                sx={{
                    maxWidth: "90%", mx: "auto", px: {
                        xs: 2, md: 4
                    }, py: {
                        xs: 4, md: 6
                    },
                }}
            >

                {/* ============================================================
                    BREADCRUMB
                ============================================================ */}

                <Typography
                    sx={{
                        fontSize: 12.5, color: GOV.textMuted, mb: 1,
                    }}
                >

                    <Link
                        component="button"
                        onClick={() => router.push(APP_ROUTES.INZIBATCI)}
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, textDecoration: "none",
                        }}
                    >
                        İnzibatçı paneli
                    </Link>

                    {" / "}

                    <span
                        style={{
                            fontWeight: 700, color: GOV.textPrimary,
                        }}
                    >
                        Təsdiq hüquqları
                    </span>

                </Typography>


                {/* ============================================================
                    TITLE
                ============================================================ */}

                <Typography
                    sx={{
                        fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, color: GOV.gold, mb: 0.5,
                    }}
                >
                    LİSENZİYA VƏ SƏNƏDLƏR · İCAZƏLƏR
                </Typography>


                <Typography
                    sx={{
                        fontSize: 24, fontWeight: 800, color: GOV.textPrimary,
                    }}
                >
                    Təsdiq hüquqları
                </Typography>


                <Typography
                    sx={{
                        fontSize: 13, color: GOV.textMuted, mt: 0.5, mb: 3,
                    }}
                >
                    İstifadəçilərin 1-ci və 2-ci mərhələ üzrə
                    sənəd yoxlama və təsdiq hüquqlarını idarə edin.
                </Typography>


                {/* ============================================================
                    SEARCH
                ============================================================ */}

                <TextField
                    size="small"
                    placeholder="İstifadəçi axtar..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    sx={{
                        mb: 3, minWidth: 280, backgroundColor: "#fff",
                    }}
                    InputProps={{
                        startAdornment: (<InputAdornment position="start">
                                <SearchIcon
                                    sx={{
                                        fontSize: 18, color: GOV.textMuted,
                                    }}
                                />
                            </InputAdornment>),
                    }}
                />


                {/* ============================================================
                    STAGE 1
                ============================================================ */}

                <Box sx={{mb: 5}}>

                    <Typography
                        sx={{
                            fontSize: 17, fontWeight: 800, color: GOV.textPrimary, mb: 0.5,
                        }}
                    >
                        1-ci mərhələ — Yoxlama hüquqları
                    </Typography>


                    <Typography
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, mb: 1.5,
                        }}
                    >
                        Sənədləri 1-ci mərhələdə yoxlama
                        hüququ olan istifadəçilər.
                    </Typography>


                    <Box
                        sx={{
                            backgroundColor: "#fff",
                            border: `1px solid ${GOV.cardBorder}`,
                            borderRadius: 2,
                            overflow: "hidden",
                        }}
                    >

                        <PermissionGrid
                            loading={loading}
                            docTypes={data?.doc_types || []}
                            users={stage1Users}
                            pendingKey={pendingKey}
                            onToggle={(userId, docType, value) => handleToggle("stage1", userId, docType, value)}
                            emptyText={"1-ci mərhələdə icazəsi olan istifadəçi tapılmadı."}
                        />

                    </Box>

                </Box>


                {/* ============================================================
                    STAGE 2
                ============================================================ */}

                <Box>

                    <Typography
                        sx={{
                            fontSize: 17, fontWeight: 800, color: GOV.textPrimary, mb: 0.5,
                        }}
                    >
                        2-ci mərhələ — Təsdiq hüquqları
                    </Typography>


                    <Typography
                        sx={{
                            fontSize: 12.5, color: GOV.textMuted, mb: 1.5,
                        }}
                    >
                        Sənədləri 2-ci mərhələdə təsdiqləmək
                        hüququ olan istifadəçilər.
                    </Typography>


                    <Box
                        sx={{
                            backgroundColor: "#fff",
                            border: `1px solid ${GOV.cardBorder}`,
                            borderRadius: 2,
                            overflow: "hidden",
                        }}
                    >

                        <PermissionGrid
                            loading={loading}
                            docTypes={data?.doc_types || []}
                            users={stage2Users}
                            pendingKey={pendingKey}
                            onToggle={(userId, docType, value) => handleToggle("stage2", userId, docType, value)}
                            emptyText={"2-ci mərhələdə təsdiq hüququ olan istifadəçi tapılmadı."}
                        />

                    </Box>

                </Box>

            </Box>

        </AppShell>

    );

}
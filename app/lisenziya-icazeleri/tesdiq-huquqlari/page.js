"use client";

import React, {useEffect, useState} from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import Autocomplete from "@mui/material/Autocomplete";
import CircularProgress from "@mui/material/CircularProgress";

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


    // =========================================================================
    // STATE
    // =========================================================================

    const [organizations, setOrganizations] = useState([]);

    const [selectedOrganization, setSelectedOrganization] = useState(null);

    const [organizationsLoading, setOrganizationsLoading] = useState(true);

    const [loading, setLoading] = useState(false);

    const [data, setData] = useState({
        doc_types: [],
        stage1_users: [],
        stage2_users: [],
    });

    const [pendingKey, setPendingKey] = useState(null);

    const [search, setSearch] = useState("");


    // =========================================================================
    // LOAD ORGANIZATIONS
    // =========================================================================

    const loadOrganizations = async () => {

        setOrganizationsLoading(true);

        try {

            const response = await service_api.get(
                NEXT_API_ENDPOINTS.ORGANIZATIONS.LIST
            );

            const responseData = response.data;

            let list = [];

            if (Array.isArray(responseData)) {

                list = responseData;

            } else if (Array.isArray(responseData?.results)) {

                list = responseData.results;

            } else if (Array.isArray(responseData?.organizations)) {

                list = responseData.organizations;
            }

            setOrganizations(list);

        } catch (e) {

            enqueueSnackbar(
                handleError(e),
                {
                    variant: "error",
                }
            );

        } finally {

            setOrganizationsLoading(false);
        }
    };


    // =========================================================================
    // LOAD PERMISSIONS
    // =========================================================================

    const loadPermissions = async (organizationId) => {

        if (!organizationId) {

            setData({
                doc_types: [],
                stage1_users: [],
                stage2_users: [],
            });

            return;
        }


        setLoading(true);

        try {

            // -----------------------------------------------------------------
            // STAGE 1
            // -----------------------------------------------------------------

            const stage1Response = await service_api.get(
                NEXT_API_ENDPOINTS.WORKFLOW.STAGE1_PERMISSIONS,
                {
                    params: {
                        organization: organizationId,
                    },
                }
            );


            // -----------------------------------------------------------------
            // STAGE 2
            // -----------------------------------------------------------------

            const stage2Response = await service_api.get(
                NEXT_API_ENDPOINTS.WORKFLOW.STAGE2_PERMISSIONS,
                {
                    params: {
                        organization: organizationId,
                    },
                }
            );


            const stage1Data = stage1Response.data;

            const stage2Data = stage2Response.data;


            // -----------------------------------------------------------------
            // SET DATA
            // -----------------------------------------------------------------

            setData({

                doc_types:
                    stage1Data?.doc_types ||
                    stage2Data?.doc_types ||
                    [],

                stage1_users:
                    stage1Data?.users || [],

                stage2_users:
                    stage2Data?.users || [],
            });

        } catch (e) {

            enqueueSnackbar(
                handleError(e),
                {
                    variant: "error",
                }
            );

            setData({
                doc_types: [],
                stage1_users: [],
                stage2_users: [],
            });

        } finally {

            setLoading(false);
        }
    };


    // =========================================================================
    // INITIAL LOAD
    // =========================================================================

    useEffect(() => {

        loadOrganizations();

    }, []);


    // =========================================================================
    // ORGANIZATION CHANGE
    // =========================================================================

    useEffect(() => {

        if (!selectedOrganization) {

            setData({
                doc_types: [],
                stage1_users: [],
                stage2_users: [],
            });

            return;
        }


        loadPermissions(
            selectedOrganization.id
        );

    }, [selectedOrganization]);


    // =========================================================================
    // TOGGLE
    // =========================================================================

    const handleToggle = async (
        stage,
        userId,
        docType,
        value
    ) => {

        if (!selectedOrganization) {

            enqueueSnackbar(
                "Əvvəlcə təşkilat seçin.",
                {
                    variant: "warning",
                }
            );

            return;
        }


        const key =
            `${stage}:${userId}:${docType}`;


        setPendingKey(key);


        // ---------------------------------------------------------------------
        // USERS KEY
        // ---------------------------------------------------------------------

        const usersKey =
            stage === "stage1"
                ? "stage1_users"
                : "stage2_users";


        // ---------------------------------------------------------------------
        // OPTIMISTIC UPDATE
        // ---------------------------------------------------------------------

        setData((prev) => ({

            ...prev,

            [usersKey]:
                prev[usersKey].map((user) =>

                    user.id === userId

                        ? {

                            ...user,

                            permissions: {

                                ...user.permissions,

                                [docType]: value,
                            },
                        }

                        : user
                ),
        }));


        // ---------------------------------------------------------------------
        // ENDPOINT
        // ---------------------------------------------------------------------

        const endpoint =
            stage === "stage1"

                ? NEXT_API_ENDPOINTS.WORKFLOW.STAGE1_PERMISSIONS

                : NEXT_API_ENDPOINTS.WORKFLOW.STAGE2_PERMISSIONS;


        try {

            await service_api.post(
                endpoint,
                {

                    organization:
                    selectedOrganization.id,

                    user: userId,

                    doc_type: docType,

                    value,
                }
            );


        } catch (e) {

            enqueueSnackbar(
                handleError(e),
                {
                    variant: "error",
                }
            );


            // -----------------------------------------------------------------
            // ROLLBACK
            // -----------------------------------------------------------------

            setData((prev) => ({

                ...prev,

                [usersKey]:
                    prev[usersKey].map((user) =>

                        user.id === userId

                            ? {

                                ...user,

                                permissions: {

                                    ...user.permissions,

                                    [docType]: !value,
                                },
                            }

                            : user
                    ),
            }));

        } finally {

            setPendingKey(null);
        }
    };


    // =========================================================================
    // SEARCH
    // =========================================================================

    const q =
        search
            .trim()
            .toLowerCase();


    const filterUsers = (users) => {

        if (!q) {

            return users;
        }


        return users.filter((user) => {

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


    const filteredStage1Users =
        filterUsers(
            data.stage1_users
        );


    const filteredStage2Users =
        filterUsers(
            data.stage2_users
        );


    // =========================================================================
    // RENDER
    // =========================================================================

    return (

        <AppShell>

            <Box
                sx={{
                    maxWidth: "90%",
                    mx: "auto",
                    px: {
                        xs: 2,
                        md: 4,
                    },
                    py: {
                        xs: 4,
                        md: 6,
                    },
                }}
            >

                {/* =============================================================
                    BREADCRUMB
                ============================================================= */}

                <Typography
                    sx={{
                        fontSize: 12.5,
                        color: GOV.textMuted,
                        mb: 1,
                    }}
                >

                    <Link
                        component="button"
                        onClick={() =>
                            router.push(
                                APP_ROUTES.INZIBATCI
                            )
                        }
                        sx={{
                            fontSize: 12.5,
                            color: GOV.textMuted,
                            textDecoration: "none",
                        }}
                    >
                        İnzibatçı paneli
                    </Link>

                    {" / "}

                    <span
                        style={{
                            fontWeight: 700,
                            color: GOV.textPrimary,
                        }}
                    >
                        Təsdiq hüquqları
                    </span>

                </Typography>


                {/* =============================================================
                    TITLE
                ============================================================= */}

                <Typography
                    sx={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        color: GOV.gold,
                        mb: 0.5,
                    }}
                >
                    LİSENZİYA VƏ SƏNƏDLƏR
                </Typography>


                <Typography
                    sx={{
                        fontSize: 24,
                        fontWeight: 800,
                        color: GOV.textPrimary,
                    }}
                >
                    Təsdiq hüquqları
                </Typography>


                <Typography
                    sx={{
                        fontSize: 13,
                        color: GOV.textMuted,
                        mt: 0.5,
                        mb: 3,
                    }}
                >
                    İstifadəçilərin sənədlərin 1-ci və 2-ci
                    mərhələlərində hansı hüquqlara malik olduğunu
                    müəyyən edin.
                </Typography>


                {/* =============================================================
                    ORGANIZATION
                ============================================================= */}

                <Box
                    sx={{
                        mb: 3,
                        maxWidth: 600,
                    }}
                >

                    <Typography
                        sx={{
                            fontSize: 12.5,
                            fontWeight: 700,
                            color: GOV.textPrimary,
                            mb: 0.8,
                        }}
                    >
                        Təşkilat
                    </Typography>


                    <Autocomplete
                        options={organizations}
                        value={selectedOrganization}
                        loading={organizationsLoading}
                        onChange={(
                            event,
                            newValue
                        ) => {

                            setSelectedOrganization(
                                newValue
                            );

                            setSearch("");
                        }}
                        getOptionLabel={(option) =>
                            option?.full_name ||
                            option?.name ||
                            option?.title ||
                            ""
                        }
                        isOptionEqualToValue={(
                            option,
                            value
                        ) =>
                            option?.id === value?.id
                        }
                        noOptionsText="Təşkilat tapılmadı"
                        loadingText="Yüklənir..."
                        renderInput={(params) => (

                            <TextField
                                {...params}
                                size="small"
                                placeholder="Təşkilat seçin..."
                                InputProps={{
                                    ...params.InputProps,

                                    endAdornment: (

                                        <>
                                            {
                                                organizationsLoading
                                                    ? (
                                                        <CircularProgress
                                                            size={18}
                                                        />
                                                    )
                                                    : null
                                            }

                                            {
                                                params.InputProps
                                                    .endAdornment
                                            }
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />

                </Box>


                {/* =============================================================
                    CONTENT
                ============================================================= */}

                {!selectedOrganization ? (

                    <Box
                        sx={{
                            backgroundColor: "#fff",
                            border:
                                `1px solid ${GOV.cardBorder}`,
                            borderRadius: 2,
                            p: 4,
                            textAlign: "center",
                        }}
                    >

                        <Typography
                            sx={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: GOV.textPrimary,
                            }}
                        >
                            Təşkilat seçin
                        </Typography>


                        <Typography
                            sx={{
                                fontSize: 12.5,
                                color: GOV.textMuted,
                                mt: 0.5,
                            }}
                        >
                            İcazələri görmək üçün əvvəlcə
                            təşkilat seçilməlidir.
                        </Typography>

                    </Box>

                ) : (

                    <>

                        {/* =====================================================
                            SELECTED ORGANIZATION
                        ===================================================== */}

                        <Box
                            sx={{
                                mb: 2.5,
                                px: 2,
                                py: 1.5,
                                backgroundColor: "#fff",
                                border:
                                    `1px solid ${GOV.cardBorder}`,
                                borderRadius: 2,
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize: 12,
                                    color: GOV.textMuted,
                                }}
                            >
                                Seçilmiş təşkilat
                            </Typography>


                            <Typography
                                sx={{
                                    fontSize: 14,
                                    fontWeight: 800,
                                    color: GOV.textPrimary,
                                }}
                            >
                                {
                                    selectedOrganization.full_name ||
                                    selectedOrganization.name
                                }
                            </Typography>

                        </Box>


                        {/* =====================================================
                            SEARCH
                        ===================================================== */}

                        <TextField
                            size="small"
                            placeholder="İstifadəçi axtar..."
                            value={search}
                            onChange={(e) =>
                                setSearch(
                                    e.target.value
                                )
                            }
                            sx={{
                                mb: 3,
                                minWidth: 280,
                                backgroundColor: "#fff",
                            }}
                            InputProps={{
                                startAdornment: (

                                    <InputAdornment
                                        position="start"
                                    >

                                        <SearchIcon
                                            sx={{
                                                fontSize: 18,
                                                color:
                                                GOV.textMuted,
                                            }}
                                        />

                                    </InputAdornment>
                                ),
                            }}
                        />


                        {/* =====================================================
                            STAGE 1
                        ===================================================== */}

                        <Box
                            sx={{
                                mb: 5,
                            }}
                        >

                            <Typography
                                sx={{
                                    fontSize: 15,
                                    fontWeight: 800,
                                    color: GOV.textPrimary,
                                    mb: 1,
                                }}
                            >
                                1-ci mərhələ — Yoxlama hüquqları
                            </Typography>


                            <Typography
                                sx={{
                                    fontSize: 12.5,
                                    color: GOV.textMuted,
                                    mb: 1.5,
                                }}
                            >
                                Sənədləri 1-ci mərhələdə yoxlama
                                hüququ olan istifadəçilər.
                            </Typography>


                            <Box
                                sx={{
                                    backgroundColor: "#fff",
                                    border:
                                        `1px solid ${GOV.cardBorder}`,
                                    borderRadius: 2,
                                    overflow: "hidden",
                                }}
                            >

                                <PermissionGrid
                                    loading={loading}
                                    docTypes={
                                        data.doc_types
                                    }
                                    users={
                                        filteredStage1Users
                                    }
                                    pendingKey={
                                        pendingKey
                                    }
                                    onToggle={(
                                        userId,
                                        docType,
                                        value
                                    ) =>
                                        handleToggle(
                                            "stage1",
                                            userId,
                                            docType,
                                            value
                                        )
                                    }
                                    emptyText={
                                        "1-ci mərhələdə icazəsi olan " +
                                        "istifadəçi tapılmadı."
                                    }
                                />

                            </Box>

                        </Box>


                        {/* =====================================================
                            STAGE 2
                        ===================================================== */}

                        <Box>

                            <Typography
                                sx={{
                                    fontSize: 15,
                                    fontWeight: 800,
                                    color: GOV.textPrimary,
                                    mb: 1,
                                }}
                            >
                                2-ci mərhələ — Təsdiq hüquqları
                            </Typography>


                            <Typography
                                sx={{
                                    fontSize: 12.5,
                                    color: GOV.textMuted,
                                    mb: 1.5,
                                }}
                            >
                                Sənədləri 2-ci mərhələdə təsdiqləmək
                                hüququ olan istifadəçilər.
                            </Typography>


                            <Box
                                sx={{
                                    backgroundColor: "#fff",
                                    border:
                                        `1px solid ${GOV.cardBorder}`,
                                    borderRadius: 2,
                                    overflow: "hidden",
                                }}
                            >

                                <PermissionGrid
                                    loading={loading}
                                    docTypes={
                                        data.doc_types
                                    }
                                    users={
                                        filteredStage2Users
                                    }
                                    pendingKey={
                                        pendingKey
                                    }
                                    onToggle={(
                                        userId,
                                        docType,
                                        value
                                    ) =>
                                        handleToggle(
                                            "stage2",
                                            userId,
                                            docType,
                                            value
                                        )
                                    }
                                    emptyText={
                                        "2-ci mərhələdə icazəsi olan " +
                                        "istifadəçi tapılmadı."
                                    }
                                />

                            </Box>

                        </Box>

                    </>

                )}

            </Box>

        </AppShell>
    );
}
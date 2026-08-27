"use client";

import React, {useEffect, useState} from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
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

    const [data, setData] = useState(null);

    const [organizations, setOrganizations] = useState([]);

    const [organization, setOrganization] = useState("");

    const [loading, setLoading] = useState(false);
    const [organizationsLoading, setOrganizationsLoading] = useState(true);

    const [pendingKey, setPendingKey] = useState(null);

    const [search, setSearch] = useState("");


    // ========================================================================
    // ORGANIZATIONS
    // ========================================================================

    const loadOrganizations = async () => {

        setOrganizationsLoading(true);

        try {

            /*
             * Burada sənin təşkilat API endpoint-in olmalıdır.
             *
             * Əgər artıq başqa səhifədə istifadə etdiyin endpoint varsa,
             * aşağıdakı endpoint-i həmin endpoint ilə dəyiş.
             */

            const res = await service_api.get(
                NEXT_API_ENDPOINTS.ORGANIZATIONS.LIST
            );

            const list =
                Array.isArray(res.data)
                    ? res.data
                    : (
                        res.data?.results ||
                        res.data?.organizations ||
                        []
                    );

            setOrganizations(list);

        } catch (e) {

            enqueueSnackbar(
                handleError(e),
                {variant: "error"}
            );

        } finally {

            setOrganizationsLoading(false);

        }
    };


    // ========================================================================
    // LOAD PERMISSIONS
    // ========================================================================

    const loadPermissions = async (organizationId) => {

        if (!organizationId) {
            setData(null);
            return;
        }

        setLoading(true);

        try {

            const [stage1Res, stage2Res] = await Promise.all([
                service_api.get(
                    `${NEXT_API_ENDPOINTS.WORKFLOW.STAGE1_PERMISSIONS}?organization=${organizationId}`
                ),
                service_api.get(
                    `${NEXT_API_ENDPOINTS.WORKFLOW.STAGE2_PERMISSIONS}?organization=${organizationId}`
                ),
            ]);

            setData({
                organization: stage1Res.data.organization,

                doc_types:
                    stage1Res.data.doc_types ||
                    stage2Res.data.doc_types ||
                    [],

                stage1_users:
                    stage1Res.data.users || [],

                stage2_users:
                    stage2Res.data.users || [],
            });

        } catch (e) {

            enqueueSnackbar(
                handleError(e),
                {variant: "error"}
            );

            setData(null);

        } finally {

            setLoading(false);

        }
    };

    // ========================================================================
    // INITIAL LOAD
    // ========================================================================

    useEffect(() => {

        loadOrganizations();

    }, []);


    // ========================================================================
    // ORGANIZATION CHANGE
    // ========================================================================

    useEffect(() => {

        if (!organization) {

            setData(null);

            return;
        }

        loadPermissions(organization);

    }, [organization]);


    // ========================================================================
    // SEARCH
    // ========================================================================

    const filterUsers = (users) => {

        const list = users || [];

        if (!search.trim()) {
            return list;
        }

        const q = search
            .trim()
            .toLowerCase();

        return list.filter((user) => {

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


    // ========================================================================
    // STAGE 1 USERS
    // ========================================================================

    const filteredStage1Users = filterUsers(
        data?.stage1_users
    );


    // ========================================================================
    // STAGE 2 USERS
    // ========================================================================

    const filteredStage2Users = filterUsers(
        data?.stage2_users
    );


    // ========================================================================
    // TOGGLE
    // ========================================================================

    const handleToggle = async (
        stage,
        userId,
        docType,
        value
    ) => {

        const key =
            `${stage}:${userId}:${docType}`;

        setPendingKey(key);


        // ------------------------------------------------------------
        // USER LIST
        // ------------------------------------------------------------

        const usersKey =
            stage === "stage1"
                ? "stage1_users"
                : "stage2_users";


        // ------------------------------------------------------------
        // OPTIMISTIC UPDATE
        // ------------------------------------------------------------

        setData((prev) => {

            if (!prev) {
                return prev;
            }

            return {

                ...prev,

                [usersKey]: (
                    prev[usersKey] || []
                ).map((user) => {

                    if (user.id !== userId) {
                        return user;
                    }

                    return {

                        ...user,

                        permissions: {

                            ...(user.permissions || {}),

                            [docType]: value,

                        },

                    };

                }),

            };

        });


        try {

            /*
             * Çox vacib:
             *
             * organization mütləq POST-a gedir.
             *
             * Backend artıq seçilmiş təşkilata görə
             * icazəni dəyişir.
             */

            await service_api.post(
                stage === "stage1"
                    ? NEXT_API_ENDPOINTS.WORKFLOW.STAGE1_PERMISSIONS
                    : NEXT_API_ENDPOINTS.WORKFLOW.STAGE2_PERMISSIONS,

                {

                    organization: organization,

                    user: userId,

                    doc_type: docType,

                    value: value,

                }
            );


        } catch (e) {

            enqueueSnackbar(
                handleError(e),
                {
                    variant: "error",
                }
            );


            // --------------------------------------------------------
            // ROLLBACK
            // --------------------------------------------------------

            setData((prev) => {

                if (!prev) {
                    return prev;
                }

                return {

                    ...prev,

                    [usersKey]: (
                        prev[usersKey] || []
                    ).map((user) => {

                        if (user.id !== userId) {
                            return user;
                        }

                        return {

                            ...user,

                            permissions: {

                                ...(user.permissions || {}),

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
    // SELECTED ORGANIZATION
    // ========================================================================

    const selectedOrganization =
        organizations.find(
            (item) =>
                String(
                    item.id
                ) === String(
                    organization
                )
        );


    // ========================================================================
    // RENDER
    // ========================================================================

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

                {/* ============================================================
                    BREADCRUMB
                ============================================================ */}

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


                {/* ============================================================
                    HEADER
                ============================================================ */}

                <Typography
                    sx={{
                        fontSize: 11.5,
                        fontWeight: 700,
                        letterSpacing: 0.6,
                        color: GOV.gold,
                        mb: 0.5,
                    }}
                >
                    LİSENZİYA VƏ SƏNƏDLƏR · WORKFLOW
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
                    Təşkilatı seçin və həmin təşkilatda 1-ci və
                    2-ci mərhələ üzrə təsdiq və yoxlama hüquqlarını
                    idarə edin.
                </Typography>


                {/* ============================================================
                    ORGANIZATION SELECT
                ============================================================ */}

                <Box
                    sx={{
                        display: "flex",
                        gap: 2,
                        flexWrap: "wrap",
                        alignItems: "center",
                        mb: 3,
                    }}
                >

                    <FormControl
                        size="small"
                        sx={{
                            minWidth: {
                                xs: "100%",
                                sm: 380,
                            },
                            backgroundColor: "#fff",
                        }}
                    >

                        <InputLabel>
                            Təşkilat
                        </InputLabel>

                        <Select
                            value={organization}
                            label="Təşkilat"
                            onChange={(e) =>
                                setOrganization(
                                    e.target.value
                                )
                            }
                        >

                            {organizationsLoading ? (

                                <MenuItem disabled>

                                    <Box
                                        sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 1,
                                        }}
                                    >

                                        <CircularProgress
                                            size={16}
                                        />

                                        Təşkilatlar yüklənir...

                                    </Box>

                                </MenuItem>

                            ) : (

                                organizations.map(
                                    (item) => (

                                        <MenuItem
                                            key={item.id}
                                            value={item.id}
                                        >
                                            {
                                                item.full_name ||
                                                item.name ||
                                                item.title ||
                                                `Təşkilat #${item.id}`
                                            }
                                        </MenuItem>

                                    )
                                )

                            )}

                        </Select>

                    </FormControl>


                    {/* ========================================================
                        SEARCH
                    ======================================================== */}

                    <TextField
                        size="small"
                        placeholder="İstifadəçi axtar..."
                        value={search}
                        onChange={(e) =>
                            setSearch(
                                e.target.value
                            )
                        }
                        disabled={!organization}
                        sx={{
                            minWidth: {
                                xs: "100%",
                                sm: 280,
                            },
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
                                            color: GOV.textMuted,
                                        }}
                                    />
                                </InputAdornment>
                            ),
                        }}
                    />

                </Box>


                {/* ============================================================
                    SELECTED ORGANIZATION
                ============================================================ */}

                {selectedOrganization && (

                    <Box
                        sx={{
                            mb: 3,
                            px: 2,
                            py: 1.5,
                            backgroundColor: "#fff",
                            border: `1px solid ${GOV.cardBorder}`,
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
                                fontSize: 15,
                                fontWeight: 800,
                                color: GOV.textPrimary,
                            }}
                        >
                            {
                                selectedOrganization.full_name ||
                                selectedOrganization.name ||
                                selectedOrganization.title
                            }
                        </Typography>

                    </Box>

                )}


                {/* ============================================================
                    NO ORGANIZATION
                ============================================================ */}

                {!organization && (

                    <Box
                        sx={{
                            backgroundColor: "#fff",
                            border: `1px solid ${GOV.cardBorder}`,
                            borderRadius: 2,
                            p: 5,
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

                )}


                {/* ============================================================
                    LOADING
                ============================================================ */}

                {organization && loading && (

                    <Box
                        sx={{
                            backgroundColor: "#fff",
                            border: `1px solid ${GOV.cardBorder}`,
                            borderRadius: 2,
                            p: 6,
                            display: "flex",
                            justifyContent: "center",
                        }}
                    >

                        <CircularProgress />

                    </Box>

                )}


                {/* ============================================================
                    CONTENT
                ============================================================ */}

                {organization && !loading && data && (

                    <Box
                        sx={{
                            display: "flex",
                            flexDirection: "column",
                            gap: 4,
                        }}
                    >


                        {/* ====================================================
                            STAGE 1
                        ==================================================== */}

                        <Box>

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
                                Seçilmiş təşkilatda 1-ci mərhələdə
                                yoxlama hüququ olan istifadəçilər.
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

                                    loading={false}

                                    docTypes={
                                        data?.doc_types || []
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
                                        "Bu təşkilatda 1-ci mərhələ üzrə " +
                                        "yoxlama hüququ olan istifadəçi yoxdur."
                                    }

                                />

                            </Box>

                        </Box>


                        {/* ====================================================
                            STAGE 2
                        ==================================================== */}

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
                                Seçilmiş təşkilatda 2-ci mərhələdə
                                təsdiq hüququ olan istifadəçilər.
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

                                    loading={false}

                                    docTypes={
                                        data?.doc_types || []
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
                                        "Bu təşkilatda 2-ci mərhələ üzrə " +
                                        "təsdiq hüququ olan istifadəçi yoxdur."
                                    }

                                />

                            </Box>

                        </Box>

                    </Box>

                )}


                {/* ============================================================
                    EMPTY RESPONSE
                ============================================================ */}

                {organization &&
                    !loading &&
                    !data && (

                        <Box
                            sx={{
                                backgroundColor: "#fff",
                                border: `1px solid ${GOV.cardBorder}`,
                                borderRadius: 2,
                                p: 5,
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
                                Məlumat tapılmadı
                            </Typography>

                        </Box>

                    )}

            </Box>

        </AppShell>
    );
}
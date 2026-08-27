"use client"

import React, {useEffect, useRef, useState} from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Switch from "@mui/material/Switch";
import CircularProgress from "@mui/material/CircularProgress";

import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {GOV} from "@/components/theme/govColors";


const STATUS_FIELDS = [{
    key: "can_view", label: "BAXIŞ"
}, {
    key: "can_create", label: "YARATMA"
}, {
    key: "can_edit", label: "REDAKTƏ"
}, {
    key: "can_approve", label: "TƏSDİQ"
}];


const ADMIN_MODULE_KEY = "inzibatci-paneli";


const DEFAULT_STATUS = {
    can_view: true, can_create: false, can_edit: false, can_approve: false
};


export default function ModulePermissionsPicker({
                                                    initialModules = [], isOrgAdmin = false, onChange
                                                }) {

    const [tree, setTree] = useState([]);

    const [loading, setLoading] = useState(true);

    const [enabled, setEnabled] = useState({});

    const [status, setStatus] = useState(DEFAULT_STATUS);


    /*
    |--------------------------------------------------------------------------
    | INITIAL DATA
    |--------------------------------------------------------------------------
    |
    | Parent component hər renderdə yeni array yarada bilər.
    | Ona görə initialModules-i ref-də saxlayırıq.
    |
    */

    const initialModulesRef = useRef(initialModules || []);


    /*
    |--------------------------------------------------------------------------
    | INITIALIZATION
    |--------------------------------------------------------------------------
    */

    const initializedRef = useRef(false);


    /*
    |--------------------------------------------------------------------------
    | LAST SENT PAYLOAD
    |--------------------------------------------------------------------------
    |
    | Eyni payload parent-ə təkrar göndərilməsin.
    |
    */

    const lastPayloadRef = useRef("");


    /*
    |--------------------------------------------------------------------------
    | ON CHANGE REF
    |--------------------------------------------------------------------------
    |
    | Parent-dən gələn onChange hər renderdə yeni function ola bilər.
    |
    | Bunu dependency array-ə salmaq əvəzinə ref-də saxlayırıq.
    |
    */

    const onChangeRef = useRef(onChange);


    useEffect(() => {

        onChangeRef.current = onChange;

    }, [onChange]);


    /*
    |--------------------------------------------------------------------------
    | LOAD MODULES
    |--------------------------------------------------------------------------
    |
    | API yalnız component mount zamanı 1 dəfə çağırılır.
    |
    */

    useEffect(() => {

        let cancelled = false;


        const loadModules = async () => {

            try {

                const res = await service_api.get(NEXT_API_ENDPOINTS.PERMISSIONS.MODULES);


                if (cancelled) {
                    return;
                }


                /*
                |--------------------------------------------------------------------------
                | ALL MODULES
                |--------------------------------------------------------------------------
                */

                const all = Array.isArray(res.data) ? res.data
                    .slice()
                    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) : [];


                /*
                |--------------------------------------------------------------------------
                | GROUP BY PARENT
                |--------------------------------------------------------------------------
                */

                const byParent = {};


                all.forEach((module) => {

                    const parentId = module.parent && typeof module.parent === "object" ? module.parent.id : module.parent || null;


                    if (!byParent[parentId]) {
                        byParent[parentId] = [];
                    }


                    byParent[parentId].push(module);

                });


                /*
                |--------------------------------------------------------------------------
                | BUILD TREE
                |--------------------------------------------------------------------------
                */

                const buildTree = (parentId = null) => {

                    return (byParent[parentId] || []).map((module) => ({

                        ...module,

                        children: buildTree(module.id)

                    }));

                };


                const builtTree = buildTree();


                setTree(builtTree);


                /*
                |--------------------------------------------------------------------------
                | INITIAL PERMISSIONS
                |--------------------------------------------------------------------------
                */

                if (!initializedRef.current) {

                    const modules = initialModulesRef.current || [];


                    /*
                    |--------------------------------------------------------------------------
                    | ADMIN MODULE ID
                    |--------------------------------------------------------------------------
                    */

                    const adminModule = findModuleByKey(builtTree, ADMIN_MODULE_KEY);


                    /*
                    |--------------------------------------------------------------------------
                    | INITIAL ENABLED MAP
                    |--------------------------------------------------------------------------
                    */

                    const enabledMap = {};


                    modules.forEach((item) => {

                        /*
                        | Backend:
                        | module: 5
                        */

                        let moduleId;


                        if (item.module && typeof item.module === "object") {

                            moduleId = item.module.id;

                        } else {

                            moduleId = item.module;

                        }


                        /*
                        |--------------------------------------------------------------------------
                        | Əgər backend key göndərirsə
                        |--------------------------------------------------------------------------
                        */

                        if (item.key === ADMIN_MODULE_KEY) {
                            return;
                        }


                        if (item.module && typeof item.module === "object" && item.module.key === ADMIN_MODULE_KEY) {
                            return;
                        }


                        if (moduleId !== undefined && moduleId !== null) {

                            enabledMap[moduleId] = true;

                        }

                    });


                    /*
                    |--------------------------------------------------------------------------
                    | QURUM ADMİNİ
                    |--------------------------------------------------------------------------
                    |
                    | Qurum adminidirsə inzibatçı panelini avtomatik seçirik.
                    |
                    */

                    if (isOrgAdmin && adminModule) {

                        enabledMap[adminModule.id] = true;

                    }


                    setEnabled(enabledMap);


                    /*
                    |--------------------------------------------------------------------------
                    | INITIAL STATUS
                    |--------------------------------------------------------------------------
                    */

                    const first = modules.find((item) => {

                        if (item.key === ADMIN_MODULE_KEY) {
                            return false;
                        }


                        if (item.module && typeof item.module === "object" && item.module.key === ADMIN_MODULE_KEY) {
                            return false;
                        }


                        return true;

                    });


                    if (first) {

                        setStatus({

                            can_view: !!first.can_view,

                            can_create: !!first.can_create,

                            can_edit: !!first.can_edit,

                            can_approve: !!first.can_approve

                        });

                    }


                    initializedRef.current = true;

                }

            } catch (error) {

                console.error("Permission modules load error:", error);

            } finally {

                if (!cancelled) {
                    setLoading(false);
                }

            }

        };


        loadModules();


        return () => {

            cancelled = true;

        };

    }, []);


    /*
    |--------------------------------------------------------------------------
    | FIND MODULE
    |--------------------------------------------------------------------------
    */

    function findModuleByKey(nodes, key) {

        for (const module of nodes) {

            if (module.key === key) {
                return module;
            }


            if (module.children && module.children.length) {

                const found = findModuleByKey(module.children, key);


                if (found) {
                    return found;
                }

            }

        }


        return null;

    }


    /*
    |--------------------------------------------------------------------------
    | FIND MODULE BY ID
    |--------------------------------------------------------------------------
    */

    function findModuleById(nodes, id) {

        for (const module of nodes) {

            if (String(module.id) === String(id)) {
                return module;
            }


            if (module.children && module.children.length) {

                const found = findModuleById(module.children, id);


                if (found) {
                    return found;
                }

            }

        }


        return null;

    }


    /*
    |--------------------------------------------------------------------------
    | GET ALL CHILD IDS
    |--------------------------------------------------------------------------
    */

    function getAllChildIds(module) {

        const ids = [];


        if (!module || !module.children || !module.children.length) {

            return ids;

        }


        module.children.forEach((child) => {

            ids.push(child.id);


            /*
            | Əgər child-in də child-i varsa,
            | onları da götür.
            */

            ids.push(...getAllChildIds(child));

        });


        return ids;

    }


    /*
    |--------------------------------------------------------------------------
    | MODULE CHANGE
    |--------------------------------------------------------------------------
    |
    | Parent ON:
    |   Parent + bütün child-lar ON
    |
    | Parent OFF:
    |   Parent + bütün child-lar OFF
    |
    | Child:
    |   yalnız həmin child dəyişir.
    |
    */

    const handleModuleChange = (module) => (event) => {

        const checked = event.target.checked;


        setEnabled((prev) => {

            const next = {
                ...prev
            };


            /*
            |--------------------------------------------------------------------------
            | CURRENT MODULE
            |--------------------------------------------------------------------------
            */

            next[module.id] = checked;


            /*
            |--------------------------------------------------------------------------
            | PARENT MODULEDURSA
            |--------------------------------------------------------------------------
            */

            if (module.children && module.children.length) {

                const childIds = getAllChildIds(module);


                childIds.forEach((childId) => {

                    next[childId] = checked;

                });

            }


            return next;

        });

    };


    /*
    |--------------------------------------------------------------------------
    | ADMIN MODULE SYNC
    |--------------------------------------------------------------------------
    |
    | Qurum admini:
    |
    | true  -> inzibatçı paneli ON
    | false -> inzibatçı paneli OFF
    |
    */

    useEffect(() => {

        if (loading) {
            return;
        }


        const adminModule = findModuleByKey(tree, ADMIN_MODULE_KEY);


        if (!adminModule) {
            return;
        }


        setEnabled((prev) => {

            const current = !!prev[adminModule.id];


            /*
            | Artıq düzgün vəziyyətdədirsə
            | yeni object yaratmırıq.
            */

            if (current === !!isOrgAdmin) {
                return prev;
            }


            return {
                ...prev, [adminModule.id]: !!isOrgAdmin
            };

        });

    }, [isOrgAdmin, loading, tree]);


    /*
    |--------------------------------------------------------------------------
    | SEND CHANGES
    |--------------------------------------------------------------------------
    |
    | Burada onChange dependency-dən çıxarılıb.
    |
    | Əsas səbəb:
    |
    | parent hər renderdə yeni onChange function yaradır.
    |
    */

    useEffect(() => {

        if (loading) {
            return;
        }


        const payload = Object.keys(enabled)

            .filter((id) => enabled[id])

            .map((id) => ({

                module: Number(id),

                ...status

            }));


        /*
        |--------------------------------------------------------------------------
        | ADMIN MODULE YOXDURSA
        |--------------------------------------------------------------------------
        |
        | Qurum admini deyilsə backend-ə inzibatçı paneli
        | heç vaxt göndərilməsin.
        |
        */

        const cleanedPayload = isOrgAdmin ? payload : payload.filter((item) => {

            const module = findModuleById(tree, item.module);


            return module?.key !== ADMIN_MODULE_KEY;

        });


        /*
        |--------------------------------------------------------------------------
        | PAYLOAD COMPARISON
        |--------------------------------------------------------------------------
        */

        const serialized = JSON.stringify(cleanedPayload);


        if (serialized === lastPayloadRef.current) {
            return;
        }


        lastPayloadRef.current = serialized;


        /*
        |--------------------------------------------------------------------------
        | PARENT CHANGE
        |--------------------------------------------------------------------------
        */

        onChangeRef.current?.(cleanedPayload);

    }, [enabled, status, loading, tree, isOrgAdmin]);


    /*
    |--------------------------------------------------------------------------
    | RENDER TREE
    |--------------------------------------------------------------------------
    */

    const renderRows = (nodes, depth = 0, path = {i: 0}) => {

        const rows = [];


        nodes.forEach((module) => {

            /*
            |--------------------------------------------------------------------------
            | İNZİBATÇI PANELİ
            |--------------------------------------------------------------------------
            |
            | Qurum admini deyilsə göstərmə.
            |
            */

            if (module.key === ADMIN_MODULE_KEY && !isOrgAdmin) {

                return;

            }


            const idx = path.i++;


            const hasChildren = module.children && module.children.length > 0;


            rows.push(<Box
                key={module.id}
                sx={{
                    display: "flex",

                    alignItems: "center",

                    justifyContent: "space-between",

                    pl: 2 + depth * 3,

                    pr: 2,

                    py: 1.25,

                    borderTop: idx === 0 ? "none" : `1px solid ${GOV.cardBorder}`,

                    backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#FAFAFC"
                }}
            >

                <Box
                    sx={{
                        display: "flex", alignItems: "center", minWidth: 0
                    }}
                >

                    {depth > 0 && (

                        <Typography
                            component="span"
                            sx={{
                                fontSize: 13, color: GOV.textMuted, mr: 0.5
                            }}
                        >
                            —
                        </Typography>

                    )}


                    <Typography
                        sx={{
                            fontSize: 13,

                            fontWeight: hasChildren ? 600 : 400,

                            color: depth ? GOV.textMuted : GOV.textPrimary
                        }}
                    >
                        {module.title}
                    </Typography>


                    {hasChildren && (

                        <Typography
                            sx={{
                                ml: 0.75,

                                fontSize: 10,

                                color: GOV.textMuted
                            }}
                        >
                            ({module.children.length})
                        </Typography>

                    )}

                </Box>


                <Switch
                    size="small"

                    checked={!!enabled[module.id]}

                    onChange={handleModuleChange(module)}
                />

            </Box>);


            /*
            |--------------------------------------------------------------------------
            | CHILDREN
            |--------------------------------------------------------------------------
            */

            if (hasChildren) {

                rows.push(...renderRows(module.children, depth + 1, path));

            }

        });


        return rows;

    };


    /*
    |--------------------------------------------------------------------------
    | LOADING
    |--------------------------------------------------------------------------
    */

    if (loading) {

        return (

            <Box
                sx={{
                    display: "flex", justifyContent: "center", py: 3
                }}
            >

                <CircularProgress
                    size={20}
                />

            </Box>

        );

    }


    /*
    |--------------------------------------------------------------------------
    | UI
    |--------------------------------------------------------------------------
    */

    return (

        <Box>

            {/* MODULES */}

            <Typography
                sx={{
                    fontSize: 11.5,

                    fontWeight: 700,

                    color: GOV.textMuted,

                    letterSpacing: 0.5,

                    mb: 1
                }}
            >
                İCAZƏ VERİLƏCƏK MODULLARI SEÇİN
            </Typography>


            <Box
                sx={{
                    border: `1px solid ${GOV.cardBorder}`,

                    borderRadius: 1.5,

                    overflow: "hidden",

                    mb: 3
                }}
            >

                {renderRows(tree)}


                {tree.length === 0 && (

                    <Typography
                        sx={{
                            fontSize: 12.5,

                            color: GOV.textMuted,

                            px: 2,

                            py: 2
                        }}
                    >
                        Modul tapılmadı.
                    </Typography>

                )}

            </Box>


            {/* STATUS */}

            <Typography
                sx={{
                    fontSize: 11.5,

                    fontWeight: 700,

                    color: GOV.textMuted,

                    letterSpacing: 0.5,

                    mb: 1
                }}
            >
                STATUS
            </Typography>


            <Box
                sx={{
                    border: `1px solid ${GOV.cardBorder}`,

                    borderRadius: 1.5,

                    overflow: "hidden"
                }}
            >

                {STATUS_FIELDS.map((field, index) => (

                    <Box
                        key={field.key}
                        sx={{
                            display: "flex",

                            alignItems: "center",

                            justifyContent: "space-between",

                            px: 2,

                            py: 1.25,

                            borderTop: index === 0 ? "none" : `1px solid ${GOV.cardBorder}`,

                            backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#FAFAFC"
                        }}
                    >

                        <Typography
                            sx={{
                                fontSize: 13,

                                color: GOV.textPrimary
                            }}
                        >
                            {field.label}
                        </Typography>


                        <Switch
                            size="small"

                            checked={!!status[field.key]}

                            onChange={(e) => {

                                setStatus((prev) => ({

                                    ...prev,

                                    [field.key]: e.target.checked

                                }));

                            }}
                        />

                    </Box>

                ))}

            </Box>

        </Box>

    );

}
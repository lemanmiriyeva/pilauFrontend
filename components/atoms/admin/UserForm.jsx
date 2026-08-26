"use client"

import {useEffect, useState} from "react";

import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import InputAdornment from "@mui/material/InputAdornment";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {GOV} from "@/components/theme/govColors";

import OrganizationSelect from "@/components/atoms/admin/OrganizationSelect";
import ModulePermissionsPicker from "@/components/atoms/admin/ModulePermissionsPicker";


const PHONE_PREFIX = "+994 ";
const ID_CARD_SERIES = ["AZE", "AA"];


const emptyForm = {
    first_name: "", last_name: "", username: "", email: "", phone: PHONE_PREFIX,

    organization: "", department: "", position: "",

    birth_date: "", fin_kod: "", id_card_serial: "",

    is_org_admin: false,
};


/*
|--------------------------------------------------------------------------
| FİN KOD ILLUSTRATION
|--------------------------------------------------------------------------
*/

function FinKodIllustration() {
    return (<Box sx={{p: 1, maxWidth: 240}}>
        <svg
            width="220"
            height="132"
            viewBox="0 0 220 132"
            xmlns="http://www.w3.org/2000/svg"
        >
            <rect
                x="1"
                y="1"
                width="218"
                height="130"
                rx="10"
                fill="#F4F6FA"
                stroke="#C9D0DD"
                strokeWidth="2"
            />

            <rect
                x="14"
                y="16"
                width="52"
                height="64"
                rx="4"
                fill="#DCE3EF"
                stroke="#B7C1D6"
            />

            <circle
                cx="40"
                cy="38"
                r="11"
                fill="#B7C1D6"
            />

            <path
                d="M22 74c0-10 8-16 18-16s18 6 18 16"
                fill="#B7C1D6"
            />

            <rect
                x="78"
                y="20"
                width="120"
                height="8"
                rx="2"
                fill="#C9D0DD"
            />

            <rect
                x="78"
                y="36"
                width="100"
                height="8"
                rx="2"
                fill="#C9D0DD"
            />

            <rect
                x="78"
                y="52"
                width="110"
                height="8"
                rx="2"
                fill="#C9D0DD"
            />

            <rect
                x="12"
                y="96"
                width="120"
                height="14"
                rx="3"
                fill="none"
                stroke="#D32F2F"
                strokeWidth="2"
            />

            <rect
                x="12"
                y="96"
                width="60"
                height="14"
                rx="3"
                fill="#D32F2F"
            />

            <text
                x="18"
                y="106"
                fontSize="9"
                fontWeight="700"
                fill="#FFFFFF"
                fontFamily="Arial, sans-serif"
            >
                FİN KODU
            </text>

            <text
                x="78"
                y="106"
                fontSize="9"
                fontWeight="700"
                fill="#D32F2F"
                fontFamily="Arial, sans-serif"
            >
                7XXXXXX
            </text>
        </svg>

        <Typography
            sx={{
                fontSize: 11.5, color: "#6B7280", mt: 0.75, lineHeight: 1.5
            }}
        >
            FİN kod şəxsiyyət vəsiqəsinin ön üzündə, şəklin sağında,
            "FİN KODU" başlığı altında yazılan 7 simvoldan ibarət koddur.
        </Typography>
    </Box>);
}


/*
|--------------------------------------------------------------------------
| USER FORM
|--------------------------------------------------------------------------
*/

export default function UserForm({
                                     mode = "create", initialData, initialModules = [], onSubmit, onCancel, submitting
                                 }) {

    /*
    |--------------------------------------------------------------------------
    | ID CARD
    |--------------------------------------------------------------------------
    */

    const parseIdCard = (value) => {

        const found = ID_CARD_SERIES.find((s) => (value || "")
            .toUpperCase()
            .startsWith(s));

        return found ? {
            series: found, number: (value || "").slice(found.length)
        } : {
            series: ID_CARD_SERIES[1], number: value || ""
        };
    };


    const initialPhone = initialData?.phone || PHONE_PREFIX;


    const initialParsedIdCard = parseIdCard(initialData?.id_card_serial || "");


    /*
    |--------------------------------------------------------------------------
    | STATE
    |--------------------------------------------------------------------------
    */

    const [form, setForm] = useState({
        ...emptyForm, ...(initialData || {}),

        phone: initialPhone,

        id_card_serial: `${initialParsedIdCard.series}${initialParsedIdCard.number}`,

        is_org_admin: Boolean(initialData?.is_org_admin),

    });


    const [idCardSeries, setIdCardSeries] = useState(initialParsedIdCard.series);


    const [idCardNumber, setIdCardNumber] = useState(initialParsedIdCard.number);


    const [modules, setModules] = useState(initialModules || []);


    const [errors, setErrors] = useState({});


    const [departments, setDepartments] = useState([]);


    const [positions, setPositions] = useState([]);


    const [loadingDepartments, setLoadingDepartments] = useState(false);


    const [loadingPositions, setLoadingPositions] = useState(false);


    /*
    |--------------------------------------------------------------------------
    | İMZALAMA / TƏSDİQ (2-Cİ MƏRHƏLƏ, MSN) HÜQUQLARI
    |--------------------------------------------------------------------------
    |
    | workflow.ApproverPermission-a uyğundur (bax "Təsdiq hüquqları" ekranı).
    | Bu istifadəçi hansı sənəd növlərini son olaraq təsdiqləyə/imzalaya bilər -
    | eyni siyahı "Təsdiq axını" ekranındakı "İmzalayan şəxs" seçimi üçün istifadə olunur.
    |--------------------------------------------------------------------------
    */

    const [docTypes, setDocTypes] = useState([]);


    const [loadingDocTypes, setLoadingDocTypes] = useState(true);


    const [approverDocTypes, setApproverDocTypes] = useState({});


    useEffect(() => {

        const loadApproverPermissions = async () => {

            setLoadingDocTypes(true);

            try {

                const res = await service_api.get(NEXT_API_ENDPOINTS.WORKFLOW.STAGE2_PERMISSIONS);

                setDocTypes(res.data?.doc_types || []);

                if (initialData?.id) {

                    const existing = (res.data?.users || []).find((u) => u.id === initialData.id);

                    setApproverDocTypes(existing?.permissions || {});

                }

            } catch (error) {

                console.error("Approver permissions load error:", error);

                setDocTypes([]);

            } finally {

                setLoadingDocTypes(false);

            }

        };


        loadApproverPermissions();

        // initialData.id dəyişməyəcək (form bir dəfə açılır), ona görə yalnız ilk render-də çağırılır
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);


    const handleApproverDocTypeChange = (key) => (e) => {

        setApproverDocTypes((prev) => ({
            ...prev, [key]: e.target.checked
        }));

    };


    /*
    |--------------------------------------------------------------------------
    | BASIC SET
    |--------------------------------------------------------------------------
    */

    const set = (field) => (e) => {

        setForm((f) => ({
            ...f, [field]: e.target.value
        }));

    };


    /*
    |--------------------------------------------------------------------------
    | PHONE
    |--------------------------------------------------------------------------
    */

    const handlePhoneChange = (e) => {

        let val = e.target.value;

        if (!val.startsWith("+994")) {
            val = PHONE_PREFIX;
        }

        setForm((f) => ({
            ...f, phone: val
        }));

    };


    const handlePhoneFocus = () => {

        if (!form.phone) {

            setForm((f) => ({
                ...f, phone: PHONE_PREFIX
            }));

        }

    };


    /*
    |--------------------------------------------------------------------------
    | ID CARD
    |--------------------------------------------------------------------------
    */

    const updateIdCard = (series, number) => {

        setIdCardSeries(series);
        setIdCardNumber(number);

        setForm((f) => ({
            ...f, id_card_serial: `${series}${number}`
        }));

    };


    /*
    |--------------------------------------------------------------------------
    | LOAD DEPARTMENTS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (!form.organization) {

            setDepartments([]);
            setPositions([]);

            return;
        }


        const loadDepartments = async () => {

            setLoadingDepartments(true);

            try {

                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.DEPARTMENTS(form.organization));


                const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);


                setDepartments(data);

            } catch (error) {

                console.error("Departments load error:", error);

                setDepartments([]);

            } finally {

                setLoadingDepartments(false);

            }

        };


        loadDepartments();

    }, [form.organization]);


    /*
    |--------------------------------------------------------------------------
    | LOAD POSITIONS
    |--------------------------------------------------------------------------
    */

    useEffect(() => {

        if (!form.organization) {

            setPositions([]);

            return;
        }


        const loadPositions = async () => {

            setLoadingPositions(true);

            try {

                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.POSITIONS(form.organization));


                const data = Array.isArray(res.data) ? res.data : (res.data?.results || []);


                setPositions(data);

            } catch (error) {

                console.error("Positions load error:", error);

                setPositions([]);

            } finally {

                setLoadingPositions(false);

            }

        };


        loadPositions();

    }, [form.organization]);


    /*
    |--------------------------------------------------------------------------
    | BUILD DEPARTMENT TREE
    |--------------------------------------------------------------------------
    */

    const buildDepartmentTree = (items) => {

        const map = {};
        const roots = [];


        items.forEach((item) => {

            map[item.id] = {
                ...item, children: []
            };

        });


        items.forEach((item) => {

            const current = map[item.id];

            const parentId = typeof item.parent === "object" ? item.parent?.id : item.parent;


            if (parentId && map[parentId]) {

                map[parentId].children.push(current);

            } else {

                roots.push(current);

            }

        });


        return roots;

    };


    const departmentTree = buildDepartmentTree(departments);


    /*
    |--------------------------------------------------------------------------
    | DEPARTMENT OPTIONS
    |--------------------------------------------------------------------------
    |
    | Parent + child dizaynı:
    |
    | İnformasiya Texnologiyaları şöbəsi
    |     Proqramlaşdırma sektoru
    |     Sistem inzibatçılığı sektoru
    |
    | Parent-in child-i varsa parent SELECT EDİLMİR.
    |
    | Child select edilə bilir.
    |--------------------------------------------------------------------------
    */

    const renderDepartmentOptions = (nodes, level = 0) => {

        const result = [];


        nodes.forEach((node) => {

            const hasChildren = node.children && node.children.length > 0;


            /*
            |--------------------------------------------------------------------------
            | PARENT / HEADER
            |--------------------------------------------------------------------------
            */

            if (hasChildren) {

                result.push(<MenuItem
                    key={`header-${node.id}`}
                    disabled
                    sx={{
                        pl: 2 + level * 3,

                        minHeight: 42,

                        fontSize: level === 0 ? 13 : 12.5,

                        fontWeight: 700,

                        color: `${GOV.navy} !important`,

                        backgroundColor: "#F7F9FC",

                        borderBottom: `1px solid ${GOV.cardBorder}`,

                        opacity: "1 !important",

                        cursor: "default",

                        "&.Mui-disabled": {
                            opacity: 1
                        }
                    }}
                >

                    <Box
                        sx={{
                            display: "flex", alignItems: "center", gap: 1
                        }}
                    >

                        <Box
                            sx={{
                                width: 6, height: 6, borderRadius: "50%", backgroundColor: GOV.navy
                            }}
                        />

                        {node.name}

                    </Box>

                </MenuItem>);

            } else {

                /*
                |--------------------------------------------------------------------------
                | SELECTABLE DEPARTMENT
                |--------------------------------------------------------------------------
                */

                result.push(<MenuItem
                    key={node.id}
                    value={node.id}
                    sx={{
                        pl: 2 + level * 3,

                        minHeight: 40,

                        fontSize: 12.5,

                        fontWeight: 500,

                        color: GOV.text,

                        "&:hover": {
                            backgroundColor: "#F5F7FA"
                        },

                        "&.Mui-selected": {
                            backgroundColor: "#E8EEF7",

                            fontWeight: 600,

                            "&:hover": {
                                backgroundColor: "#E8EEF7"
                            }
                        }
                    }}
                >

                    {node.name}

                </MenuItem>);

            }


            /*
            |--------------------------------------------------------------------------
            | CHILDREN
            |--------------------------------------------------------------------------
            */

            if (hasChildren) {

                result.push(...renderDepartmentOptions(node.children, level + 1));

            }

        });


        return result;

    };


    /*
    |--------------------------------------------------------------------------
    | FILTER POSITIONS
    |--------------------------------------------------------------------------
    */

    const filteredPositions = form.department ? positions.filter((position) => {

        const departmentId = typeof position.department === "object" ? position.department?.id : position.department;


        return String(departmentId) === String(form.department);

    }) : [];


    /*
    |--------------------------------------------------------------------------
    | ORGANIZATION CHANGE
    |--------------------------------------------------------------------------
    */

    const handleOrganizationChange = (value) => {

        setForm((f) => ({
            ...f,

            organization: value,

            department: "", position: "",

            /*
            | Təşkilat dəyişəndə əvvəlki
            | qurum admin statusunu sıfırlayırıq.
            */
            is_org_admin: false,
        }));


        setDepartments([]);
        setPositions([]);

    };


    /*
    |--------------------------------------------------------------------------
    | ORG ADMIN CHANGE
    |--------------------------------------------------------------------------
    */

    const handleOrgAdminChange = (e) => {

        setForm((f) => ({
            ...f, is_org_admin: e.target.checked
        }));

    };


    /*
    |--------------------------------------------------------------------------
    | VALIDATION
    |--------------------------------------------------------------------------
    */

    const validate = () => {

        const next = {};


        if (!form.first_name) {
            next.first_name = "Tələb olunur";
        }


        if (!form.last_name) {
            next.last_name = "Tələb olunur";
        }


        if (mode === "create" && !form.username) {
            next.username = "Tələb olunur";
        }


        if (!form.email) {
            next.email = "Tələb olunur";
        }


        if (!form.organization) {
            next.organization = "Təşkilat seçilməlidir";
        }


        setErrors(next);


        return Object.keys(next).length === 0;

    };


    /*
    |--------------------------------------------------------------------------
    | SUBMIT
    |--------------------------------------------------------------------------
    */

    const handleSubmit = () => {

        if (!validate()) {
            return;
        }


        onSubmit({

            ...form,

            /*
            | Boolean olaraq göndəririk.
            */
            is_org_admin: Boolean(form.is_org_admin),

            modules,

            approver_doc_types: docTypes.map((dt) => ({
                doc_type: dt.key,
                value: Boolean(approverDocTypes[dt.key]),
            })),

        });

    };


    /*
    |--------------------------------------------------------------------------
    | RENDER
    |--------------------------------------------------------------------------
    */

    return (

        <Box>

            <Box
                sx={{
                    display: "grid",

                    gap: 2.5,

                    gridTemplateColumns: {
                        xs: "1fr", sm: "1fr 1fr"
                    },

                    mb: 3
                }}
            >

                {/* AD */}

                <TextField
                    label="Ad"
                    size="small"
                    required
                    value={form.first_name}
                    onChange={set("first_name")}
                    error={!!errors.first_name}
                    helperText={errors.first_name}
                />


                {/* SOYAD */}

                <TextField
                    label="Soyad"
                    size="small"
                    required
                    value={form.last_name}
                    onChange={set("last_name")}
                    error={!!errors.last_name}
                    helperText={errors.last_name}
                />


                {/* USERNAME */}

                <TextField
                    label="İstifadəçi adı"
                    size="small"
                    required={mode === "create"}
                    disabled={mode === "edit"}
                    value={form.username}
                    onChange={set("username")}
                    error={!!errors.username}
                    helperText={errors.username}
                />


                {/* EMAIL */}

                <TextField
                    label="E-poçt"
                    size="small"
                    required
                    value={form.email}
                    onChange={set("email")}
                    error={!!errors.email}
                    helperText={errors.email}
                />


                {/* PHONE */}

                <TextField
                    label="Telefon"
                    size="small"
                    placeholder="+994 __ ___ __ __"
                    value={form.phone}
                    onChange={handlePhoneChange}
                    onFocus={handlePhoneFocus}
                />


                {/* BIRTH DATE */}

                <TextField
                    label="Doğum tarixi"
                    type="date"
                    size="small"
                    value={form.birth_date || ""}
                    onChange={set("birth_date")}
                    InputLabelProps={{
                        shrink: true
                    }}
                />


                {/* ORGANIZATION */}

                <OrganizationSelect
                    value={form.organization}
                    onChange={handleOrganizationChange}
                    error={!!errors.organization}
                    helperText={errors.organization}
                    required
                />


                {/* DEPARTMENT */}

                <TextField
                    select
                    label="Departament / Şöbə / Sektor"
                    size="small"
                    value={form.department || ""}
                    onChange={(e) => {

                        setForm((f) => ({
                            ...f,

                            department: e.target.value,

                            position: ""
                        }));

                    }}
                    disabled={!form.organization || loadingDepartments}
                    SelectProps={{
                        MenuProps: {
                            PaperProps: {
                                sx: {
                                    maxHeight: 400
                                }
                            }
                        }
                    }}
                >

                    <MenuItem value="">
                        Seçin
                    </MenuItem>


                    {loadingDepartments && (

                        <MenuItem disabled>
                            Departamentlər yüklənir...
                        </MenuItem>

                    )}


                    {!loadingDepartments && departments.length === 0 && (

                        <MenuItem disabled>
                            Departament tapılmadı
                        </MenuItem>

                    )}


                    {!loadingDepartments && departments.length > 0 && renderDepartmentOptions(departmentTree)}

                </TextField>


                {/* POSITION */}

                <TextField
                    select
                    label="Vəzifə"
                    size="small"
                    value={form.position || ""}
                    onChange={set("position")}
                    disabled={!form.organization || !form.department || loadingPositions}
                >

                    <MenuItem value="">
                        Seçin
                    </MenuItem>


                    {loadingPositions && (

                        <MenuItem disabled>
                            Vəzifələr yüklənir...
                        </MenuItem>

                    )}


                    {!loadingPositions && form.department && filteredPositions.length === 0 && (

                        <MenuItem disabled>
                            Bu departament üçün vəzifə tapılmadı
                        </MenuItem>

                    )}


                    {!loadingPositions && filteredPositions.map((item) => (

                        <MenuItem
                            key={item.id}
                            value={item.id}
                        >
                            {item.name}
                        </MenuItem>

                    ))}

                </TextField>


                {/* FIN */}

                <TextField
                    label="FİN kod"
                    size="small"
                    value={form.fin_kod}
                    onChange={set("fin_kod")}
                    InputProps={{
                        endAdornment: (

                            <InputAdornment position="end">

                                <Tooltip
                                    title={<FinKodIllustration/>}
                                    arrow
                                    placement="top"
                                    componentsProps={{
                                        tooltip: {
                                            sx: {
                                                backgroundColor: "#FFFFFF",

                                                boxShadow: "0 8px 24px rgba(15,23,55,0.18)",

                                                border: `1px solid ${GOV.cardBorder}`
                                            }
                                        }
                                    }}
                                >

                                    <InfoOutlinedIcon
                                        sx={{
                                            fontSize: 18, color: GOV.textMuted, cursor: "help"
                                        }}
                                    />

                                </Tooltip>

                            </InputAdornment>

                        )
                    }}
                />


                {/* ID CARD */}

                <Box
                    sx={{
                        display: "flex", gap: 1
                    }}
                >

                    <Select
                        size="small"
                        value={idCardSeries}
                        onChange={(e) => updateIdCard(e.target.value, idCardNumber)}
                        sx={{
                            width: 96, flexShrink: 0
                        }}
                    >

                        {ID_CARD_SERIES.map((s) => (

                            <MenuItem
                                key={s}
                                value={s}
                            >
                                {s}
                            </MenuItem>

                        ))}

                    </Select>


                    <TextField
                        label="Şəxsiyyət vəsiqəsinin seriya nömrəsi"
                        size="small"
                        fullWidth
                        value={idCardNumber}
                        onChange={(e) => updateIdCard(idCardSeries, e.target.value.replace(/\D/g, ""))}
                    />

                </Box>

            </Box>


            {/*
            |--------------------------------------------------------------------------
            | QURUM ADMİNİ
            |--------------------------------------------------------------------------
            */}

            <Box
                sx={{
                    mt: 1,
                    mb: 3,
                    p: 1.5,
                    border: `1px solid ${GOV.cardBorder}`,
                    borderRadius: 1.5,
                    backgroundColor: "#F8FAFC"
                }}
            >

                <FormGroup>

                    <FormControlLabel
                        control={<Checkbox
                            checked={Boolean(form.is_org_admin)}
                            onChange={handleOrgAdminChange}
                            disabled={!form.organization}
                            sx={{
                                color: GOV.navy,

                                "&.Mui-checked": {
                                    color: GOV.navy
                                }
                            }}
                        />}

                        label={<Box>

                            <Typography
                                sx={{
                                    fontSize: 13, fontWeight: 700, color: GOV.navy
                                }}
                            >
                                Qurum admini
                            </Typography>

                            <Typography
                                sx={{
                                    fontSize: 11.5, color: GOV.textMuted, mt: 0.25
                                }}
                            >
                                İstifadəçi seçilmiş təşkilatın
                                qurum administratoru olacaq.
                            </Typography>

                        </Box>}

                        sx={{
                            alignItems: "flex-start", ml: 0
                        }}
                    />

                </FormGroup>

            </Box>


            {/*
            |--------------------------------------------------------------------------
            | İMZALAMA / TƏSDİQ HÜQUQLARI (MSN)
            |--------------------------------------------------------------------------
            */}

            <Box
                sx={{
                    mt: 1,
                    mb: 3,
                    p: 1.5,
                    border: `1px solid ${GOV.cardBorder}`,
                    borderRadius: 1.5,
                    backgroundColor: "#F8FAFC"
                }}
            >

                <Typography
                    sx={{
                        fontSize: 13, fontWeight: 700, color: GOV.navy, mb: 0.25
                    }}
                >
                    İmzalama / Təsdiq hüquqları (MSN)
                </Typography>

                <Typography
                    sx={{
                        fontSize: 11.5, color: GOV.textMuted, mb: 1.5
                    }}
                >
                    İşarələnmiş kateqoriyalar üzrə istifadəçi 2-ci mərhələ (son) təsdiqini verə
                    və "Təsdiq axını" ekranında İmzalayan şəxs olaraq seçilə biləcək.
                </Typography>

                {loadingDocTypes ? (

                    <Box sx={{display: "flex", alignItems: "center", gap: 1, py: 1}}>
                        <CircularProgress size={16}/>
                        <Typography sx={{fontSize: 12, color: GOV.textMuted}}>
                            Yüklənir...
                        </Typography>
                    </Box>

                ) : docTypes.length === 0 ? (

                    <Typography sx={{fontSize: 12, color: GOV.textMuted}}>
                        Sənəd növü tapılmadı.
                    </Typography>

                ) : (

                    <FormGroup
                        sx={{
                            display: "grid",
                            gridTemplateColumns: {xs: "1fr", sm: "1fr 1fr"},
                            columnGap: 1,
                        }}
                    >

                        {docTypes.map((dt) => (

                            <FormControlLabel
                                key={dt.key}
                                control={<Checkbox
                                    size="small"
                                    checked={Boolean(approverDocTypes[dt.key])}
                                    onChange={handleApproverDocTypeChange(dt.key)}
                                    sx={{
                                        color: GOV.navy,

                                        "&.Mui-checked": {
                                            color: GOV.navy
                                        }
                                    }}
                                />}
                                label={<Typography sx={{fontSize: 12.5, color: GOV.text}}>
                                    {dt.label}
                                </Typography>}
                            />

                        ))}

                    </FormGroup>

                )}

            </Box>


            {/* MODULE PERMISSIONS */}

            <ModulePermissionsPicker
                initialModules={initialModules}
                onChange={setModules}
            />


            {/* BUTTONS */}

            <Box
                sx={{
                    display: "flex", justifyContent: "flex-end", gap: 1.5, mt: 4
                }}
            >

                <Button
                    onClick={onCancel}
                    disabled={submitting}
                    sx={{
                        textTransform: "none", fontWeight: 600, fontSize: 13, color: GOV.textMuted
                    }}
                >
                    Ləğv et
                </Button>


                <Button
                    variant="contained"
                    onClick={handleSubmit}
                    disabled={submitting}
                    sx={{
                        backgroundColor: GOV.navy, textTransform: "none", fontWeight: 700, fontSize: 13,

                        "&:hover": {
                            backgroundColor: GOV.navyMid
                        }
                    }}
                >
                    {mode === "create" ? "İstifadəçini yarat" : "Yadda saxla"}
                </Button>

            </Box>

        </Box>

    );

}
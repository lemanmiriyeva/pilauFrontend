"use client"
import React, {useEffect, useState} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import CircularProgress from '@mui/material/CircularProgress';
import {useRouter} from "next/navigation";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {APP_ROUTES} from "@/components/constants";
import {GOV} from "@/components/theme/govColors";
import AppShell from "@/components/atoms/AppShell";
import ModulesTab from "@/components/atoms/organizations/profile/ModulesTab";

/**
 * Təşkilatın modul icazələri (əvvəl təşkilatın detalındakı tab idi).
 * Nazirlik admini təşkilatı seçib hansı modulların açıq olduğunu dəyişir; qurum admini öz təşkilatının
 * modullarını yalnız görür (redaktə icazəsini backend `can_edit` ilə təyin edir).
 */
export default function Page() {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [orgs, setOrgs] = useState([]);
    const [org, setOrg] = useState(null);
    const isAdmin = Boolean(user?.is_staff || user?.is_superuser);

    useEffect(() => {
        if (!user) return;
        if (!isAdmin) { if (user.organization) setOrg({id: user.organization}); return; }
        service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.TABLE)
            .then((res) => setOrgs(Array.isArray(res.data) ? res.data : (res.data?.results || [])))
            .catch(() => {});
    }, [user, isAdmin]);

    return (
        <AppShell onReady={({user: u}) => {
            if (u && !u.is_staff && !u.is_superuser && !u.is_org_admin) router.replace(APP_ROUTES.INZIBATCI);
            else setUser(u);
        }}>
            <Box sx={{maxWidth: "90%", mx: 'auto', px: {xs: 2, md: 4}, py: {xs: 4, md: 6}}}>
                <Typography sx={{fontSize: 12.5, color: GOV.textMuted, mb: 3}}>
                    <Link component="button" onClick={() => router.push(APP_ROUTES.INZIBATCI)}
                          sx={{fontSize: 12.5, color: GOV.textMuted, textDecoration: 'none'}}>
                        İnzibatçı paneli
                    </Link>
                    {' / '}<span>Modul icazələri</span>
                </Typography>
                <Typography sx={{fontSize: 22, fontWeight: 800, color: GOV.textPrimary, mb: 3}}>
                    Təşkilatların modul icazələri
                </Typography>

                {isAdmin && (
                    <Autocomplete
                        size="small" options={orgs} value={org}
                        getOptionLabel={(o) => o.full_name || o.name || ''}
                        isOptionEqualToValue={(o, v) => o.id === v.id}
                        onChange={(_, v) => setOrg(v)}
                        noOptionsText="Təşkilat tapılmadı"
                        renderInput={(p) => <TextField {...p} label="Təşkilat seçin"/>}
                        sx={{maxWidth: 520, mb: 3, backgroundColor: '#fff'}}
                    />
                )}

                {org ? <ModulesTab key={org.id} orgId={org.id}/>
                    : (!user || !isAdmin
                        ? <Box sx={{py: 6, textAlign: 'center'}}><CircularProgress size={26}/></Box>
                        : <Typography sx={{fontSize: 13, color: GOV.textMuted}}>Modul icazələrinə baxmaq üçün təşkilat seçin.</Typography>)}
            </Box>
        </AppShell>
    );
}

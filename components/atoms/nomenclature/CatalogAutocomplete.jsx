"use client"
import React, {useEffect, useState} from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, {createFilterOptions} from '@mui/material/Autocomplete';
import {useSnackbar} from "notistack";
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";
import {handleError} from "@/app/utils";

const filter = createFilterOptions();

/**
 * Kataloq (əməliyyat növü / kateqoriya / alt kateqoriya) üçün autocomplete.
 * Seçim mövcud siyahıdan olur; canCreate (admin) olduqda siyahıda olmayan ad yazılanda
 * "+ Əlavə et" təklifi çıxır və yeni qeyd kataloqa yazılır (sonra təkrar yazmaq lazım olmur).
 * kind: 'categories' | 'subcategories' | 'operation-types'. subcategories üçün category (id) tələb olunur.
 */
export default function CatalogAutocomplete({kind, label, value, onChange, category, canCreate, required, error, helperText}) {
    const {enqueueSnackbar} = useSnackbar();
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const needsCategory = kind === 'subcategories';

    useEffect(() => {
        if (needsCategory && !category) { setOptions([]); return; }
        let alive = true;
        setLoading(true);
        const qs = needsCategory ? `?category=${category}` : '';
        service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURE_CATALOG(kind) + qs)
            .then((res) => alive && setOptions(Array.isArray(res.data) ? res.data : []))
            .catch((e) => alive && enqueueSnackbar(handleError(e), {variant: 'error'}))
            .finally(() => alive && setLoading(false));
        return () => { alive = false; };
    }, [kind, category]);

    const create = async (name) => {
        try {
            const body = needsCategory ? {name, category} : {name};
            const res = await service_api.post(NEXT_API_ENDPOINTS.ORGANIZATIONS.NOMENCLATURE_CATALOG(kind), body);
            setOptions((prev) => prev.some((o) => o.id === res.data.id) ? prev : [...prev, res.data]);
            onChange(res.data);
        } catch (e) {
            enqueueSnackbar(e?.response?.data?.name || e?.response?.data?.category || handleError(e), {variant: 'error'});
        }
    };

    return (
        <Autocomplete
            size="small"
            options={options}
            loading={loading}
            disabled={needsCategory && !category}
            value={value || null}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            getOptionLabel={(o) => o.name || ''}
            filterOptions={(opts, params) => {
                const filtered = filter(opts, params);
                const typed = params.inputValue.trim();
                if (canCreate && typed && !opts.some((o) => o.name.toLowerCase() === typed.toLowerCase())) {
                    filtered.push({id: '__new__', name: typed, label: `+ Əlavə et: "${typed}"`});
                }
                return filtered;
            }}
            renderOption={(props, o) => <li {...props} key={o.id}>{o.label || o.name}</li>}
            onChange={(_, o) => {
                if (o && o.id === '__new__') create(o.name);
                else onChange(o);
            }}
            noOptionsText="Siyahı boşdur"
            loadingText="Yüklənir..."
            renderInput={(p) => (
                <TextField {...p} label={label} required={required} error={error} helperText={helperText}/>
            )}
        />
    );
}

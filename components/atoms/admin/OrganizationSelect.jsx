"use client"
import React, {useEffect, useState} from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import {service_api} from "@/app/service";
import {NEXT_API_ENDPOINTS} from "@/app/urls";

function flatten(nodes, depth = 0, out = []) {
    (nodes || []).forEach((n) => {
        out.push({id: n.id, full_name: n.full_name, depth});
        if (n.children && n.children.length) flatten(n.children, depth + 1, out);
    });
    return out;
}

export default function OrganizationSelect({value, onChange, label = "Təşkilat", required = false, error, helperText}) {
    const [options, setOptions] = useState([]);

    useEffect(() => {
        (async () => {
            try {
                const res = await service_api.get(NEXT_API_ENDPOINTS.ORGANIZATIONS.TREE);
                setOptions(flatten(res.data));
            } catch (e) {
                setOptions([]);
            }
        })();
    }, []);

    return (
        <TextField
            select fullWidth size="small" label={label} required={required}
            value={value || ''} onChange={(e) => onChange(e.target.value)}
            error={error} helperText={helperText}
        >
            {options.map((o) => (
                <MenuItem key={o.id} value={o.id} sx={{pl: 2 + o.depth * 2}}>
                    {o.full_name}
                </MenuItem>
            ))}
            {options.length === 0 && (
                <MenuItem disabled value="">Təşkilat tapılmadı</MenuItem>
            )}
        </TextField>
    );
}
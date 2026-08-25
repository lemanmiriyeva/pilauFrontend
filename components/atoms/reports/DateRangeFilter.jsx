"use client"
import React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

export default function DateRangeFilter({dateFrom, dateTo, granularity, onChange}) {
    return (
        <Box sx={{display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center'}}>
            <TextField
                size="small" type="date" label="Başlanğıc" value={dateFrom || ''}
                onChange={(e) => onChange({dateFrom: e.target.value})}
                InputLabelProps={{shrink: true}}
                sx={{backgroundColor: '#fff', minWidth: 160}}
            />
            <TextField
                size="small" type="date" label="Son" value={dateTo || ''}
                onChange={(e) => onChange({dateTo: e.target.value})}
                InputLabelProps={{shrink: true}}
                sx={{backgroundColor: '#fff', minWidth: 160}}
            />
            <FormControl size="small" sx={{minWidth: 130}}>
                <InputLabel>Qrupla</InputLabel>
                <Select
                    label="Qrupla" value={granularity || 'month'}
                    onChange={(e) => onChange({granularity: e.target.value})}
                    sx={{backgroundColor: '#fff'}}
                >
                    <MenuItem value="day">Gün</MenuItem>
                    <MenuItem value="month">Ay</MenuItem>
                    <MenuItem value="year">İl</MenuItem>
                </Select>
            </FormControl>
        </Box>
    );
}
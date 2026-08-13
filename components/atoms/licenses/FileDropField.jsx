"use client"
import React, {useRef} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import CloseIcon from '@mui/icons-material/Close';
import {GOV} from "@/components/theme/govColors";

export default function FileDropField({field, file, onChange, error}) {
    const inputRef = useRef(null);

    return (
        <Box>
            <Typography sx={{fontSize: 11.5, fontWeight: 700, color: GOV.textPrimary, mb: 0.75}}>
                {field.label}
                {field.required && <span style={{color: '#B3261E'}}> *</span>}
                {field.max_size_mb && (
                    <span style={{fontWeight: 500, color: GOV.textMuted}}> (max {field.max_size_mb}mb)</span>
                )}
            </Typography>

            <Box
                onClick={() => inputRef.current?.click()}
                sx={{
                    border: `1.5px dashed ${error ? '#B3261E' : GOV.cardBorder}`, borderRadius: 1.5,
                    backgroundColor: GOV.pageBg, cursor: 'pointer', py: 1.75, px: 2,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
                    '&:hover': {borderColor: GOV.navySoft},
                }}
            >
                {file ? (
                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1, overflow: 'hidden'}}>
                        <InsertDriveFileIcon sx={{fontSize: 17, color: GOV.navySoft, flexShrink: 0}}/>
                        <Typography sx={{fontSize: 12.5, color: GOV.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                            {file.name}
                        </Typography>
                    </Box>
                ) : (
                    <Typography sx={{fontSize: 12.5, fontWeight: 700, color: GOV.navySoft, mx: 'auto'}}>
                        Fayl seç
                    </Typography>
                )}
                {file && (
                    <CloseIcon
                        sx={{fontSize: 16, color: GOV.textMuted, flexShrink: 0}}
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(null);
                            if (inputRef.current) inputRef.current.value = '';
                        }}
                    />
                )}
            </Box>
            <input
                ref={inputRef} type="file" hidden accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => onChange(e.target.files?.[0] || null)}
            />
        </Box>
    );
}
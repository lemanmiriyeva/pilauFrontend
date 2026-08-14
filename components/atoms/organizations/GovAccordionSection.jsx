"use client"
import React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import {GOV} from "@/components/theme/govColors";

/**
 * Shared collapsible section used across gov forms (təşkilat yarat, idxal/ixrac yarat və s.)
 *
 * Props:
 * - title: string
 * - expanded: boolean
 * - onChange: (event, isExpanded) => void  (standard MUI Accordion onChange signature)
 * - complete: boolean  – shows a filled green check when the section's fields are valid
 * - optional: boolean  – shows a "(könüllü)" badge next to the title, doesn't affect the check icon
 * - children: section content
 */
export default function GovAccordionSection({title, expanded, onChange, complete, optional, children}) {
    return (
        <Accordion
            expanded={expanded}
            onChange={onChange}
            disableGutters
            elevation={0}
            square
            sx={{
                border: `1px solid ${GOV.cardBorder}`,
                borderRadius: '10px !important',
                overflow: 'hidden',
                mb: 1.5,
                backgroundColor: '#fff',
                '&:before': {display: 'none'},
                '&.Mui-expanded': {margin: '0 0 12px 0'},
            }}
        >
            <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{color: GOV.textMuted}}/>}
                sx={{
                    px: 2.5,
                    minHeight: 56,
                    backgroundColor: expanded ? GOV.pageBg : '#fff',
                    '& .MuiAccordionSummary-content': {
                        display: 'flex', alignItems: 'center', gap: 1.25, my: 1.25,
                    },
                }}
            >
                {complete ? (
                    <CheckCircleIcon sx={{fontSize: 19, color: '#1E8E3E', flexShrink: 0}}/>
                ) : (
                    <RadioButtonUncheckedIcon sx={{fontSize: 19, color: GOV.cardBorder, flexShrink: 0}}/>
                )}
                <Typography sx={{fontSize: 13.5, fontWeight: 700, color: GOV.textPrimary}}>
                    {title}
                </Typography>
                {optional && (
                    <Box sx={{
                        fontSize: 10.5, fontWeight: 700, color: GOV.goldDark,
                        backgroundColor: '#FBF3DF', border: `1px solid ${GOV.goldSoft}`,
                        borderRadius: 1, px: 0.75, py: 0.125, lineHeight: 1.6,
                    }}>
                        Könüllü
                    </Box>
                )}
            </AccordionSummary>
            <AccordionDetails sx={{px: 2.5, py: 2.5, borderTop: `1px solid ${GOV.cardBorder}`}}>
                {children}
            </AccordionDetails>
        </Accordion>
    );
}
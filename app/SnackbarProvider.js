'use client'
import {SnackbarProvider, closeSnackbar} from "notistack";
import IconButton from "@mui/material/IconButton";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import {useCallback} from "react";

export default function SnackProvider({children}) {
    const closeAction = useCallback(
        (id) =>
            <IconButton onClick={() => closeSnackbar(id)}>
                <CancelRoundedIcon sx={{color: "#fff"}}/>
            </IconButton>
    )

    return <SnackbarProvider action={closeAction} anchorOrigin={{vertical: 'top', horizontal: 'center'}}>
        {children}
    </SnackbarProvider>
}

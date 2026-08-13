import React, {Suspense} from 'react'

import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/inter/800.css'
import './globals.css'
import SnackProvider from "./SnackbarProvider";
import ThemeRegistry from "./ThemeRegistry";

export const metadata = {
    title: 'Giriş Sistemi',
    description: 'Təhlükəsiz autentifikasiya sistemi',
    icons: {icon: "icon.png"},
}

export default function RootLayout({children}) {
    return (
        <html lang="az">
        <body>
        <ThemeRegistry>
            <Suspense fallback={null}>
                <SnackProvider>
                    {children}
                </SnackProvider>
            </Suspense>
        </ThemeRegistry>
        </body>
        </html>
    );
}

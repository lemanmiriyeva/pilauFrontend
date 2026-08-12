import React, {Suspense} from 'react'
import './globals.css'
import SnackProvider from "./SnackbarProvider";

export const metadata = {
    title: 'Giriş Sistemi',
    description: 'Təhlükəsiz autentifikasiya sistemi',
    icons: {icon: "icon.png"},
}

export default function RootLayout({children}) {
    return (
        <html lang="az">
        <body>
        <Suspense fallback={null}>
            <SnackProvider>
                {children}
            </SnackProvider>
        </Suspense>
        </body>
        </html>
    );
}

"use client";
import { LayoutProvider } from "../layout/context/layoutcontext";
import { ProfileProvider } from "../layout/context/ProfileContext";
import { PrimeReactProvider } from "primereact/api";
import { usePathname } from "next/navigation";
import "primereact/resources/primereact.css";
import "primeflex/primeflex.css";
import "primeicons/primeicons.css";
import "../styles/layout/layout.scss";
import "../styles/demo/Demos.scss";

export default function RootLayout({ children }) {
    const pathname = usePathname(); 
    const noProfileProviderPaths = ["/auth/login", "/login"];

    const isNoProfileProvider = noProfileProviderPaths.includes(pathname);

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link id="theme-css" href={`/themes/lara-light-indigo/theme.css`} rel="stylesheet"></link>
            </head>
            <body>
                <PrimeReactProvider>
                    <LayoutProvider>{isNoProfileProvider ? children : <ProfileProvider>{children}</ProfileProvider>}</LayoutProvider>
                </PrimeReactProvider>
            </body>
        </html>
    );
}

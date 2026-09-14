"use client"

import { ReactNode } from "react"
import ReactQueryProvider from "./tanstack-query-provider"
import { TooltipProvider } from "@/components/ui/tooltip";

const Providers = ({ children }: { children: ReactNode }) => {
    return (
        <TooltipProvider>
            <ReactQueryProvider>
                {children}
            </ReactQueryProvider>
        </TooltipProvider>
    )
}

export default Providers

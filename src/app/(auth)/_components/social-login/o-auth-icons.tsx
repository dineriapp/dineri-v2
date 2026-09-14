import { ComponentProps } from "react"

export function GoogleIcon(props: ComponentProps<"svg">) {
    return (
        <svg
            className="size-4"
            viewBox="0 0 24 24"
            fill="currentColor"
            {...props}
        >
            <path d="M21.35 11.1H12v2.8h5.35c-.25 1.45-1.6 4.25-5.35 4.25-3.25 0-5.9-2.7-5.9-6s2.65-6 5.9-6c1.85 0 3.1.8 3.8 1.5l1.95-1.9C16.05 3.7 14.2 3 12 3 6.95 3 3 7.05 3 12s3.95 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.6-.05-1.05-.15-1.5z" />
        </svg>
    )
}

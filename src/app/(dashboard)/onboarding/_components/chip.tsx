import React from 'react'

const Chip = ({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) => (
    <button
        type="button"
        onClick={onClick}
        className={`rounded-full border px-3 py-1.5 text-xs transition ${active
            ? "border-lime bg-lime/10 text-foreground"
            : "border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
            }`}
    >
        {children}
    </button>
);

export default Chip

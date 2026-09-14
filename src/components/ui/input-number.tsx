import React, { useState, useEffect, useRef } from "react";
import { Input } from "./input";

type NumberInputProps = {
    value?: number | null | "";
    onChange: (val: number | undefined) => void;
    className?: string;
    placeholder?: string;
    min?: number;
    readOnly?: boolean;
};

export function NumberInput({
    value: externalValue,
    onChange,
    className,
    placeholder,
    min = 0,
    readOnly = false,
}: NumberInputProps) {
    // Local string representation of the input
    const [localValue, setLocalValue] = useState<string>("");
    const isInternalUpdate = useRef(false);

    // Sync local state when external value changes (from form reset, etc.)
    useEffect(() => {
        if (!isInternalUpdate.current) {
            const newValue = externalValue === undefined || externalValue === null ? "" : String(externalValue);
            setLocalValue(newValue);
        }
        isInternalUpdate.current = false;
    }, [externalValue]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

        const raw = e.target.value;
        if (!/^\d*\.?\d*$/.test(raw)) return;
        setLocalValue(raw);
        isInternalUpdate.current = true;

        // Allow empty string -> undefined
        if (raw === "") {
            onChange(undefined);
            return;
        }

        // Validate numeric format (only digits and optional decimal)
        if (!/^\d*\.?\d*$/.test(raw)) return;

        const num = Number(raw);
        if (isNaN(num) || !isFinite(num)) return;
        if (num < min) return;

        onChange(num);
    };

    const handleBlur = () => {
        // Optional: trim trailing zeros or format nicely
        if (localValue !== "" && !isNaN(Number(localValue))) {
            const num = Number(localValue);
            if (num >= min) {
                const formatted = num.toString();
                setLocalValue(formatted);
            }
        }
    };

    return (
        <Input
            type="text"
            inputMode="decimal"
            readOnly={readOnly}
            value={localValue}
            placeholder={placeholder}
            onChange={handleChange}
            onBlur={handleBlur}
            onKeyDown={(e) => {

                // Prevent scientific notation characters
                if (["e", "E", "+", "-"].includes(e.key)) {
                    e.preventDefault();
                }
                if (e.key === "ArrowUp" || e.key === "ArrowDown") {
                    e.preventDefault();

                    const step = 1; // 👉 change if needed (e.g. 0.1)
                    const current = localValue === "" ? 0 : Number(localValue);

                    if (isNaN(current)) return;

                    let next =
                        e.key === "ArrowUp"
                            ? current + step
                            : current - step;

                    // respect min
                    if (next < min) next = min;

                    // update both states
                    const str = String(next);
                    setLocalValue(str);
                    isInternalUpdate.current = true;
                    onChange(next);
                }
            }}
            onPaste={(e) => {
                const paste = e.clipboardData.getData("text");
                if (!/^\d*\.?\d*$/.test(paste)) {
                    e.preventDefault();
                }
            }}
            className={className}
        />
    );
}
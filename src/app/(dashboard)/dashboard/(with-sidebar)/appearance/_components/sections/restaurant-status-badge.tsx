"use client";

import { Badge } from '@/components/ui/badge';
import { RestaurantType } from '@/drizzle/types';
import { getRestaurantStatus, RestaurantStatusDetailed } from '@/lib/services/restaurant-status';
import { cn } from '@/lib/utils';
import { Timer } from 'lucide-react';
import React, { useEffect, useState } from 'react';

type Props = {
    buttonStyle: () => React.CSSProperties;
    restaurant: Pick<RestaurantType, "opening_hours" | "timezone">;
    className?: string;
    /** When given, the badge becomes a button that opens the full week's hours. */
    onClick?: () => void;
};

const RestaurantStatusBadge = ({ buttonStyle, className, restaurant, onClick }: Props) => {
    const [status, setStatus] = useState<RestaurantStatusDetailed | null>(null);

    useEffect(() => {
        const update = () => {
            const { opening_hours, timezone } = restaurant;
            if (opening_hours && timezone) {
                try {
                    const clientTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
                    const result = getRestaurantStatus(opening_hours, timezone, clientTz);
                    // clientTz provided → result is detailed
                    if ('status' in result) {
                        setStatus(result);
                    } else {
                        setStatus({
                            isOpen: false,
                            status: 'closed',
                            displayText: 'Closed',
                        });
                    }
                } catch {
                    setStatus({
                        isOpen: false,
                        status: 'closed',
                        displayText: 'Closed',
                    });
                }
            } else {
                setStatus({
                    isOpen: false,
                    status: 'closed',
                    displayText: 'Closed',
                });
            }
        };

        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [restaurant]);

    if (!status) return null;

    return (
        <Badge
            asChild={!!onClick}
            style={buttonStyle()}
            className={cn(
                "rounded-full px-3 py-1.25 h-fit",
                onClick && "cursor-pointer transition hover:opacity-85",
                className,
            )}
        >
            {onClick ? (
                <button type="button" onClick={onClick} aria-label="View opening hours">
                    <Timer className="h-3.5 w-3.5" />
                    <span className="leading-[1.2]!">{status.displayText}</span>
                </button>
            ) : (
                <>
                    <Timer className="h-3.5 w-3.5" />
                    <span className="leading-[1.2]!">{status.displayText}</span>
                </>
            )}
        </Badge>
    );
};

export default RestaurantStatusBadge;
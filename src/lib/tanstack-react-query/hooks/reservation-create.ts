"use client"
import {
    CreateReservationInput,
    createReservationAction,
} from "@/app/(preview)/r/[slug]/reserve/actions";
import { useMutation } from "@tanstack/react-query";

export function useCreateReservation() {
    return useMutation({
        mutationFn: async (input: CreateReservationInput) => {
            const result = await createReservationAction(input);

            if (!result.success) {
                throw new Error(result.error);
            }

            return result.data;
        },
    });
}

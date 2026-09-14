
import { z } from "zod";
export const sortOrderSchema = z
    .number("Order index must be a number")
    .int("Order index must be an integer")
    .min(0, "Order index must be 0 or greater")
import { z } from "zod";

const addonSchema = z.object({
  label: z.string().trim().min(1).max(120),
  price: z.number().min(0),
});

const cartItemSchema = z.object({
  id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  addons: z.array(addonSchema).max(50).default([]),
  customization: z.string().max(500).optional(),
});

export const orderSchema = z.object({
  restaurantId: z.string().min(1),
  name: z.string().min(2).max(80),
  phone: z.string().min(6).max(30),
  email: z.string().email().max(255),
  location: z.string().min(3).max(200),
  fulfillment: z.enum(["pickup", "delivery"]),
  paymentMethod: z.enum(["cash", "card"]),
  cart: z.array(cartItemSchema).min(1, "Cart cannot be empty").max(100),
});

export type OrderSchemaType = z.infer<typeof orderSchema>;

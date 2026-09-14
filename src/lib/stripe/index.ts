import Stripe from "stripe"

const STRIPE_API_VERSION =
    "2026-03-25.dahlia";

export const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true
})


export async function getValidStripeClient(secretKey: string): Promise<false | Stripe> {
    try {
        const testStripe = new Stripe(secretKey, {
            apiVersion: STRIPE_API_VERSION,
            typescript: true
        })

        const account = await testStripe.accounts.retrieve(null)
        return account?.id ? testStripe : false
    } catch (error) {
        console.error("Invalid Stripe secret key:", error)
        return false
    }
}

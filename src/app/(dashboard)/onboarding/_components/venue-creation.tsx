import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { PillButton } from '@/components/ui/ui-kit/PillButton';
import { checkRestaurantSlug } from '@/lib/server/func/check-restaurant-slug';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Dispatch, SetStateAction } from 'react';
import { Controller, FormProvider, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from "zod";
import { Data } from "@/lib/types/onboarding";
import slugify from "slugify";

const restaurantCreationSchema = z.object({
    name: z.string().min(1, "Venue name is required"),
    cuisine: z.string().optional(),
    city: z.string().min(1, "city is required"),
    phone: z.string().optional(),
});

type RestaurantCreationSchemaValues = z.infer<typeof restaurantCreationSchema>;

type Props = {
    setData: Dispatch<SetStateAction<Data>>
    next: () => void
    data: Data
}

const VenueCreation = ({ setData, next, data }: Props) => {

    const form = useForm<RestaurantCreationSchemaValues>({
        resolver: zodResolver(restaurantCreationSchema),
        defaultValues: {
            city: data.city ?? "",
            cuisine: data.cuisine ?? "",
            name: data.venue ?? "",
            phone: data.phone ?? ""
        },
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const venueName = useWatch({
        control: form.control,
        name: "name"
    })

    const slugPreview = slugify(venueName || "", {
        lower: true,
        strict: true,
        trim: true,
    });

    const handleSubmit = async (data: RestaurantCreationSchemaValues) => {
        const response = await checkRestaurantSlug(data.name);
        if (response.rateLimited) {
            toast.error("Too many checks. Please wait a moment and try again.");
            return;
        }
        if (response.exists) {
            toast.error("This restaurant name is already taken");
            return;
        }
        setData((prev) => ({
            ...prev,
            city: data.city,
            cuisine: data.cuisine ?? "",
            phone: data.phone ?? "",
            venue: data.name
        }))
        next()
    }

    return (
        <FormProvider {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)}>
                <div className='space-y-3'>
                    <Controller
                        name="name"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid} className="gap-2">
                                <FieldLabel className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                                    Venue name
                                </FieldLabel>
                                <Input
                                    {...field}
                                    className="h-11 w-full "
                                    placeholder="Trattoria Milano"
                                    aria-invalid={fieldState.invalid}
                                />
                                {!!slugPreview && (
                                    <p className="text-xs text-muted-foreground">
                                        URL Slug :
                                        <span className="ml-1 font-medium text-foreground">
                                            diner.app/{slugPreview}
                                        </span>
                                    </p>
                                )}
                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                                )}
                            </Field>
                        )}
                    />
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Controller
                            name="cuisine"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid} className="gap-2">
                                    <FieldLabel className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                                        Cuisine (optional)
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        className="h-11 w-full "
                                        placeholder="Italian · Pizza"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                                    )}
                                </Field>
                            )}
                        />
                        <Controller
                            name="city"
                            control={form.control}
                            render={({ field, fieldState }) => (
                                <Field data-invalid={fieldState.invalid} className="gap-2">
                                    <FieldLabel className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                                        City
                                    </FieldLabel>
                                    <Input
                                        {...field}
                                        className="h-11 w-full "
                                        placeholder="Paris, France"
                                        aria-invalid={fieldState.invalid}
                                    />
                                    {fieldState.invalid && (
                                        <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                                    )}
                                </Field>
                            )}
                        />

                    </div>
                    <Controller
                        name="phone"
                        control={form.control}
                        render={({ field, fieldState }) => (
                            <Field data-invalid={fieldState.invalid} className="gap-2">
                                <FieldLabel className="font-jetbrains-mono uppercase tracking-[0.12rem] text-[10px] text-muted-foreground">
                                    Phone (optional)
                                </FieldLabel>
                                <Input
                                    {...field}
                                    className="h-11 w-full "
                                    placeholder="+33 1 42 00 00 00"
                                    aria-invalid={fieldState.invalid}
                                />
                                {fieldState.invalid && (
                                    <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                                )}
                            </Field>
                        )}
                    />
                </div>
                <div className="mt-8 flex items-center justify-between gap-3">
                    <button
                        type='button'
                        className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2.5 text-sm text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </button>
                    <PillButton
                        size="lg"
                        type='submit'
                    >
                        Continue
                        <ArrowRight className="h-3.5 w-3.5" />
                    </PillButton>
                </div>
            </form>
        </FormProvider>

    )
}

export default VenueCreation

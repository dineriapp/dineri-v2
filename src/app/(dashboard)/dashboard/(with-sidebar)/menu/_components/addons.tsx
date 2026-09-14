"use client";
import { Field, FieldError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/input-number";
import { MenuItemSchemaType } from "@/lib/validators/zod/menu-scheam";
import { Plus, Trash2 } from "lucide-react";
import { memo } from "react";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";

const Addons = memo(() => {
  const { control } = useFormContext<MenuItemSchemaType>();

  const { fields, append, remove } = useFieldArray({
    control: control,
    name: "addons",
  });
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-[11px] font-medium text-muted-foreground">Add-ons (optional)</label>
        <button
          type="button"
          onClick={() => {
            append({ label: "Extra", price: 1 });
          }}
          className="inline-flex h-7 items-center gap-1 rounded-md border border-white/10 bg-background px-2 text-[11px] hover:border-white/20"
        >
          <Plus className="h-3 w-3" /> Add-on
        </button>
      </div>

      {fields?.length === 0 ? (
        <div className="mt-2 rounded-lg border bg-background/50 border-dashed border-white/10 p-4 text-center text-[11px] text-muted-foreground">
          No add-ons yet. Add toppings, sides or sizes to upsell this item.
        </div>
      ) : (
        <div className="mt-2 space-y-2 rounded-lg border bg-background/50 border-dashed border-white/10 p-4">
          {fields?.map((item, idx) => (
            <div key={item.id} className="grid grid-cols-[1fr_110px_auto] items-center gap-2">
              <Controller
                name={`addons.${idx}.label`}
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <Input
                      {...field}
                      className="h-9 rounded-lg w-full"
                      placeholder="e.g. Extra cheese"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name={`addons.${idx}.price`}
                control={control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <NumberInput
                      value={field.value}
                      onChange={field.onChange}
                      min={0}
                      placeholder="e.g. 10"
                      className="h-10 rounded-lg w-full"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />

              <button
                type="button"
                onClick={() => remove(idx)}
                className="rounded-md p-2 text-muted-foreground hover:bg-danger/10 hover:text-danger"
                aria-label="Remove add-on"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});
Addons.displayName = "Addons";
export default Addons;

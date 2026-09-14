"use client";

import { ReactNode, useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { FaqType } from "@/drizzle/types";
import { useCreateFaq, useUpdateFaq } from "@/lib/tanstack-react-query/hooks/faq";
import { faqSchema, FaqSchemaType } from "@/lib/validators/zod/faq.schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader } from "lucide-react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

type Props = {
  children?: ReactNode;
  open?: boolean;
  editingRow?: FaqType;
  setOpen?: (open: boolean) => void;
  /** Preselected when adding from inside a category. */
  categoryId?: string;
  categories: { id: string; name: string }[];
};

export default function FaqDialog({
  children,
  open,
  editingRow,
  setOpen,
  categoryId,
  categories,
}: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();

  const loading = createFaq.isPending || updateFaq.isPending;
  const form = useForm<FaqSchemaType>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      categoryId: editingRow?.categoryId ?? categoryId ?? "",
      answer: editingRow?.answer ?? "",
      question: editingRow?.question ?? "",
      active: editingRow?.active ?? true,
      sort_order: editingRow?.sort_order ?? 0,
    },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  const isControlled = open !== undefined && setOpen !== undefined;

  const handleSave = async (data: FaqSchemaType) => {
    if (editingRow?.id) {
      await updateFaq.mutateAsync(
        { data, id: editingRow.id },
        {
          onSuccess: () => {
            toast.success("Faq updated");
            form.reset();
            setOpen?.(false);
            setInternalOpen(false);
          },
          onError: (err) => {
            toast.error(err.message ?? "something went wrong!");
          },
        },
      );
    } else {
      await createFaq.mutateAsync(data, {
        onSuccess: () => {
          toast.success("Faq created");
          form.reset();
          setOpen?.(false);
          setInternalOpen(false);
        },
        onError: (err) => {
          toast.error(err.message ?? "something went wrong!");
        },
      });
    }
  };

  useEffect(() => {
    if (editingRow) {
      form.reset({
        categoryId: editingRow.categoryId,
        answer: editingRow.answer,
        question: editingRow.question,
        active: editingRow.active,
        sort_order: editingRow.sort_order,
      });
    } else {
      form.reset({
        categoryId: categoryId ?? "",
        answer: "",
        question: "",
        active: true,
        sort_order: 0,
      });
    }
  }, [editingRow, categoryId, form]);

  return (
    <Dialog
      open={isControlled ? open : internalOpen}
      onOpenChange={isControlled ? setOpen : setInternalOpen}
    >
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}

      <DialogContent className="sm:max-w-125">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {editingRow ? "Edit question" : "Add question"}
          </DialogTitle>
          <DialogDescription className="sr-only"></DialogDescription>
        </DialogHeader>
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSave)}>
            <div className="space-y-3">
              <Controller
                name="categoryId"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-0! w-full">
                    <FieldLabel className="block text-[10px] tracking-[0.07em] uppercase text-[#747474] font-medium mb-1.5">
                      category <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="bg-background rounded-md w-full h-10!">
                        <SelectValue placeholder={"Select Category"} />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-border/60 bg-popover">
                        {categories?.map((o) => (
                          <SelectItem key={o.id} value={o.id} className="text-xs">
                            {o.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground">
                      Choose which topic this question appears under (e.g. <em>Booking</em>,{" "}
                      <em>Delivery</em>, <em>Allergies</em>).
                    </p>
                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                        className="text-red-500 text-[11px]"
                      />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="question"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="text-xs text-muted-foreground">
                      Question
                      <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Input
                      {...field}
                      className="h-10 rounded-lg w-full text-base sm:text-sm"
                      placeholder="What do customers ask?"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="answer"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="gap-2">
                    <FieldLabel className="text-xs text-muted-foreground">
                      Answer <span className="text-red-500">*</span>
                    </FieldLabel>
                    <Textarea
                      {...field}
                      className="rounded-lg w-full max-h-40 min-h-25 text-base sm:text-sm"
                      placeholder="Be clear and friendly."
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} className="text-red-500 text-sm" />
                    )}
                  </Field>
                )}
              />
              <Controller
                name="active"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    className="rounded-xl border border-white/10 bg-surface-1 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <FieldLabel className="text-sm font-medium">Public visibility</FieldLabel>
                        <p className="text-xs text-muted-foreground">
                          Customers can see this question.
                        </p>
                      </div>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-invalid={fieldState.invalid}
                      />
                    </div>
                    {fieldState.invalid && (
                      <FieldError
                        errors={[fieldState.error]}
                        className="mt-2 text-sm text-red-500"
                      />
                    )}
                  </Field>
                )}
              />
            </div>
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setOpen?.(false);
                  setInternalOpen(false);
                }}
                className="w-full rounded-lg border border-white/10 px-4 h-10 text-xs hover:border-white/20 sm:h-8 sm:w-auto"
              >
                Cancel
              </button>
              <button
                type={"submit"}
                disabled={loading}
                className="w-full rounded-lg bg-white px-4 flex items-center justify-center h-10 cursor-pointer gap-1 text-xs font-semibold text-background hover:bg-white/90 sm:h-8 sm:w-auto"
              >
                {loading && <Loader className="animate-spin size-4" />}
                Save question
              </button>
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}

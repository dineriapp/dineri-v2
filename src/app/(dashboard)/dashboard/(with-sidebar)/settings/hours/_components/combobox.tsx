"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DashComboboxOption = {
  value: string;
  label: string;
};

interface DashComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: DashComboboxOption[];
  popularOptions?: DashComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  headingPopular?: string;
  headingNormal?: string;
  className?: string;
}

export function DashCombobox({
  value,
  onValueChange,
  options,
  popularOptions,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyText = "No results found.",
  className,
  headingNormal,
  headingPopular,
}: DashComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = React.useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "h-10 w-full justify-between rounded-lg border-border/60 bg-background px-3 text-sm hover:border-border",
            className,
          )}
        >
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>

          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-100 p-0" align="start">
        <Command shouldFilter>
          <CommandInput placeholder={searchPlaceholder} />

          <CommandList className="max-h-75 overflow-y-auto">
            <CommandEmpty>{emptyText}</CommandEmpty>

            {!!popularOptions?.length && (
              <>
                <CommandGroup heading={headingPopular ?? "Popular Timezones"}>
                  {popularOptions.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onValueChange(option.value);

                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === option.value ? "opacity-100" : "opacity-0",
                        )}
                      />

                      <span className="truncate">{option.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>

                <CommandSeparator />
              </>
            )}

            <CommandGroup heading={headingNormal ?? "All Timezones"}>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    onValueChange(option.value);

                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0",
                    )}
                  />

                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

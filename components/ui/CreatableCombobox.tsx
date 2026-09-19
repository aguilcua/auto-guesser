"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface Car {
  id: string;
  make: string;
  model: string;
}

export function CreatableCombobox({
  cars,
  onSelect,
}: {
  cars: Car[];
  onSelect: (carName: string) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        role="combobox"
        aria-expanded={open}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-between bg-gray-800 border-gray-700 text-white hover:bg-gray-700 hover:text-white",
        )}
      >
        {value ? value : "Select or type a car..."}
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0 bg-gray-800 border-gray-700">
        <Command>
          <CommandInput
            placeholder="Search existing cars..."
            onValueChange={setSearchQuery}
            className="text-white"
          />
          <CommandList>
            {/* THE MAGIC: If no database cars match, show the add button */}
            <CommandEmpty>
              <button
                className="w-full text-left px-4 py-3 text-sm text-blue-400 hover:bg-gray-700 transition-colors"
                onClick={() => {
                  setValue(searchQuery);
                  onSelect(searchQuery);
                  setOpen(false);
                }}
              >
                + Add "{searchQuery}" to database
              </button>
            </CommandEmpty>

            <CommandGroup className="max-h-60 overflow-y-auto">
              {cars.map((car) => (
                <CommandItem
                  key={car.id}
                  value={`${car.make} ${car.model}`}
                  className="text-white hover:bg-gray-700 cursor-pointer"
                  onSelect={(currentValue) => {
                    setValue(currentValue);
                    onSelect(currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 text-blue-400",
                      value === `${car.make} ${car.model}`
                        ? "opacity-100"
                        : "opacity-0",
                    )}
                  />
                  {car.make} {car.model}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

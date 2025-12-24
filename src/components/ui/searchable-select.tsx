import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
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

interface SearchableSelectProps {
  options: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  allLabel?: string;
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  className,
  allLabel,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);

  const isAllSelected = allLabel && value === allLabel;
  const displayValue = value || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between font-normal bg-muted/30 border-border/30 hover:border-primary/50 hover:bg-muted/50 text-foreground transition-colors",
            !isAllSelected && value && "border-primary/50 bg-primary/5",
            className
          )}
        >
          <span className="truncate text-foreground">{displayValue}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0 bg-card border-border z-[100]" align="start">
        <Command className="bg-card">
          <CommandInput 
            placeholder={searchPlaceholder} 
            className="h-9 border-none focus:ring-0"
          />
          <CommandList className="max-h-[300px]">
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => {
                    onValueChange(option);
                    setOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

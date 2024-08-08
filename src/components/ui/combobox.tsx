import { Check, ChevronsUpDown, Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ReactNode, useEffect, useState } from "react";
import { ScrollArea } from "./scroll-area";
import { CommandList } from "cmdk";

interface ComboboxData {
  value: string;
  label: ReactNode;
}

interface ComboboxProps {
  datas: ComboboxData[];
  selectHint?: string;
  searchHint: string;
  noResultsHint: string;
  value?: string | null;
  className?: string;
  canUnselect?: boolean;
  onChange?: (value: string | undefined) => void;
}

export default function Combobox({
  datas,
  selectHint = "",
  searchHint,
  noResultsHint,
  value: propValue,
  className,
  canUnselect = true,
  onChange: propOnChange,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [currentValue, setCurrentValue] = useState(propValue || "");

  const handleChange = (selectedValue: string) => {
    const newValue: string = selectedValue;
    if (newValue === currentValue && canUnselect) {
      setCurrentValue("");
      if (propOnChange) {
        propOnChange(undefined);
      }
      setOpen(false);
      return;
    }
    setCurrentValue(newValue);
    setOpen(false);
    if (propOnChange) {
      propOnChange(newValue);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between flex flex-row items-center",
            className,
          )}
        >
          {currentValue
            ? datas.find((data) => data.value === currentValue)?.label
            : `${selectHint}`}
          <div className=" flex-grow" />
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={searchHint} />
          <CommandEmpty>{noResultsHint}</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {datas.map((data) => (
                <CommandItem
                  key={data.value}
                  value={data.value}
                  onSelect={handleChange}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentValue === data.value ? "opacity-100" : "opacity-0",
                    )}
                  />
                  {data.label}
                </CommandItem>
              ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface MultiselectComboBoxProps<E> {
  items: E[];
  loading?: boolean;
  selectHint: string;
  searchHint: string;
  selectedItems: E[];
  keyOf: (item: E) => string;
  itemRender: (item: E) => ReactNode | undefined;
  selectionResultRender: (items: E[]) => ReactNode | undefined;
  noSearchResultRender: (
    searchInput: string | undefined,
  ) => ReactNode | undefined;
  onSelectedItemsChanged: (items: E[]) => void;
  closeSignal?: unknown;
}

export function MultiselectCombobox<E>({
  items,
  loading = false,
  selectHint,
  searchHint,
  selectedItems,
  keyOf,
  itemRender,
  selectionResultRender,
  noSearchResultRender,
  onSelectedItemsChanged,
  closeSignal,
}: MultiselectComboBoxProps<E>) {
  const [open, setOpen] = useState(false);
  const [searchInput, setSearchInput] = useState<string>();

  useEffect(() => {
    setOpen(false);
  }, [closeSignal]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
    setSearchInput(undefined);
  };

  const handleSelection = (key: string) => {
    const index = selectedItems.findIndex((e) => keyOf(e) === key);
    const copy = selectedItems.slice();
    if (index == -1) {
      copy.push(items.find((e) => keyOf(e) === key)!);
      onSelectedItemsChanged(copy);
    } else {
      copy.splice(index, 1);
      onSelectedItemsChanged(copy);
    }
  };

  return (
    <Popover modal={true} open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between flex flex-row items-center"
        >
          {selectedItems.length > 0
            ? selectionResultRender(selectedItems)
            : `${selectHint}`}
          <div className=" flex-grow" />
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[--radix-popover-content-available-height]">
        <Command>
          <CommandInput
            placeholder={searchHint}
            value={searchInput}
            onValueChange={setSearchInput}
          />
          <ScrollArea className="h-[300px]">
            <CommandList>
              <CommandEmpty>{noSearchResultRender?.(searchInput)}</CommandEmpty>
              {loading && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
              {!loading && (
                <CommandGroup className="pt-2">
                  {items.map((item) => (
                    <CommandItem
                      key={keyOf(item)}
                      value={keyOf(item)}
                      onSelect={handleSelection}
                    >
                      {itemRender(item)}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </ScrollArea>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

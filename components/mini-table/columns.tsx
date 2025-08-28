/* eslint-disable @typescript-eslint/no-explicit-any */

import { cn } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { CustomerRow } from "./table-editor";

type UpdateCellFn = (
  rowId: string,
  key: keyof CustomerRow,
  value: string
) => void;

function EditableTextCell({
  row,
  table,
  columnKey,
  placeholder,
  validate,
  errorMessage,
}: {
  row: any;
  table: any;
  columnKey: keyof CustomerRow;
  placeholder?: string;
  validate?: (value: string) => boolean;
  errorMessage?: string;
}) {
  const updateCell = (table?.options?.meta as { updateCell?: UpdateCellFn })
    ?.updateCell;
  const rowId: string = row.original.id;
  const initialValue: string = row.getValue(columnKey as string) ?? "";
  const [value, setValue] = useState<string>(String(initialValue));
  const [editing, setEditing] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setValue(String(initialValue ?? ""));
  }, [initialValue]);

  const commit = () => {
    if (!updateCell) {
      setEditing(false);
      return;
    }
    const ok = validate ? validate(value) : true;

    if (!ok) {
      setError(errorMessage || "Invalid value");
      return;
    }

    setError("");
    updateCell(rowId, columnKey, value);
    setEditing(false);
  };

  const cancel = () => {
    setValue(String(initialValue ?? ""));
    setError("");
    setEditing(false);
  };

  if (!editing) {
    return (
      <div
        className={cn(
          "text-xs max-w-[200px] truncate",
          row.original.isNew && columnKey === "name" && "text-primary"
        )}
        onClick={() => setEditing(true)}
        title={String(value)}
      >
        {String(value || placeholder || "—")}
      </div>
    );
  }

  return (
    <div className="max-w-[200px]">
      <input
        autoFocus
        className={cn(
          "w-full rounded border px-2 py-1 text-xs",
          error ? "border-red-500" : "border-input"
        )}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        placeholder={placeholder}
      />
      {error && (
        <div className="mt-1 text-[10px] leading-none text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}

function EditableSelectCell({
  row,
  table,
  columnKey,
  options,
}: {
  row: any;
  table: any;
  columnKey: keyof CustomerRow;
  options: string[];
}) {
  const updateCell = (table?.options.meta as { updateCell?: UpdateCellFn })
    ?.updateCell;
  const rowId: string = row.original.id;
  const initialValue: string = row.getValue(columnKey as string) ?? options[0];

  const [value, setValue] = useState<string>(String(initialValue));
  const [editing, setEditing] = useState<boolean>(false);

  useEffect(() => {
    setValue(String(initialValue ?? ""));
  }, [initialValue]);

  const commit = () => {
    updateCell?.(rowId, columnKey, value);
    setEditing(false);
  };

  const cancel = () => {
    setValue(String(initialValue ?? ""));
    setEditing(false);
  };

  if (!editing) {
    const badgeVariant = (() => {
      switch (value as CustomerRow["version"]) {
        case "new customer":
          return "destructive" as const;
        case "served":
          return "default" as const;
        case "to contact":
          return "secondary" as const;
        case "pause":
          return "outline" as const;
        default:
          return "default" as const;
      }
    })();
    return (
      <Badge
        className="text-xs cursor-pointer capitalize"
        variant={badgeVariant}
        onClick={() => setEditing(true)}
      >
        {value}
      </Badge>
    );
  }

  return (
    <select
      autoFocus
      className="w-full rounded border border-input px-2 py-1 text-xs capitalize"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") commit();
        if (e.key === "Escape") cancel();
      }}
    >
      {options.map((opt) => (
        <option key={opt} value={opt} className="capitalize">
          {opt}
        </option>
      ))}
    </select>
  );
}

export const columns: ColumnDef<CustomerRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs font-medium"
        >
          ID
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-xs font-mono">{row.getValue("id")}</div>
    ),
  },
  {
    accessorKey: "bio",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs font-medium"
        >
          Bio
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row, table }) => (
      <EditableTextCell
        table={table}
        row={row}
        columnKey={"bio"}
        placeholder="Enter bio"
      />
    ),
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs font-medium"
        >
          Name
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row, table }) => (
      <EditableTextCell
        row={row}
        table={table}
        columnKey={"name"}
        placeholder="Required"
        validate={(v) => v.trim().length > 0}
        errorMessage="Name is required"
      />
    ),
  },
  {
    accessorKey: "language",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs font-medium"
        >
          Language
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row, table }) => (
      <EditableTextCell
        table={table}
        row={row}
        columnKey={"language"}
        placeholder="Enter language"
        validate={(v) => v.trim().length > 0}
        errorMessage="Language is required"
      />
    ),
  },
  {
    accessorKey: "version",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs font-medium"
        >
          Version
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row, table }) => (
      <EditableSelectCell
        row={row}
        table={table}
        columnKey={"version"}
        options={["new customer", "served", "to contact", "pause"]}
      />
    ),
  },
  {
    accessorKey: "state",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs font-medium"
        >
          State
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row, table }) => (
      <EditableTextCell
        table={table}
        row={row}
        columnKey={"state"}
        placeholder="State (e.g., CA)"
        validate={(v) => /^[A-Z]{2}$/.test(v.trim())}
        errorMessage="Use 2 uppercase letters"
      />
    ),
  },
  {
    accessorKey: "createdDate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 text-xs font-medium"
        >
          Created Date
          <ArrowUpDown className="ml-2 h-3 w-3" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-xs font-mono">{row.getValue("createdDate")}</div>
    ),
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const customer = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(customer.id)}
            >
              Copy customer ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>View customer</DropdownMenuItem>
            <DropdownMenuItem>View details</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

import type { UseFormRegisterReturn, FieldError } from "react-hook-form";
import { Input } from "@/Components/input";
import { Label } from "@/Components/label";
import { cn } from "@/lib/utils";

interface InputProps {
  label?: string;
  type?: string;
  register: UseFormRegisterReturn;
  error?: FieldError;
  id: string;
  placeholder?: string;
  className?: string;
  onChange?: (q: string) => void;
}

function FormInput(data: InputProps) {
  return (
    <div className="flex flex-col justify-center items-start space-y-2">
      {data.label && (
        <Label htmlFor={data.id}>{data.label}</Label>
      )}
      <Input
        id={data.id}
        type={data.type ? data.type : "text"}
        {...data.register}
        placeholder={data.placeholder}
        onChange={(e) => data.onChange?.(e.target.value)}
        className={cn(data.error && "border-destructive focus-visible:ring-destructive", data.className)}
      />
      <div className="text-destructive text-xs min-h-[1rem]">
        {data.error ? data.error.message : "\u00A0"}
      </div>
    </div>
  );
}

export default FormInput;

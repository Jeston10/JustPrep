import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";

import { Input } from "@/components/ui/input";

interface FormFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  type?: "text" | "email" | "password";
}

const FormField = <T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  type = "text",
}: FormFieldProps<T>) => {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="mb-4">
          <label className="label">{label}</label>
          <Input className="input" type={type} placeholder={placeholder} {...field} />
          {fieldState.error && (
            <span className="text-xs text-red-500">{fieldState.error.message}</span>
          )}
        </div>
      )}
    />
  );
};

export default FormField;

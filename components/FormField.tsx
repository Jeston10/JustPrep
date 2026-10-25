import { useId } from "react";
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
  // The label has to point at the input, or assistive technology announces an unnamed textbox and
  // `getByLabel` cannot find it either. useId keeps the pair unique when a form reuses the label.
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <div className="mb-4">
          <label className="label" htmlFor={fieldId}>
            {label}
          </label>
          <Input
            id={fieldId}
            className="input"
            type={type}
            placeholder={placeholder}
            aria-invalid={fieldState.error ? true : undefined}
            aria-describedby={fieldState.error ? errorId : undefined}
            {...field}
          />
          {fieldState.error && (
            <span id={errorId} role="alert" className="text-xs text-red-500">
              {fieldState.error.message}
            </span>
          )}
        </div>
      )}
    />
  );
};

export default FormField;

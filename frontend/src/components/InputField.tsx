import { FieldError } from "react-hook-form";

type InputFieldProps = {
  label: string;
  type?: string;
  register: any;
  name: string;
  defaultValue?: string;
  error?: FieldError;
  hidden?: boolean;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
  className?: string;
};

const InputField = ({
  label,
  type = "text",
  register,
  name,
  defaultValue,
  error,
  hidden,
  inputProps,
  className,
}: InputFieldProps) => {
  return (
    <div className={hidden ? "hidden" : className || "flex flex-col gap-1.5 w-full md:w-1/4"}>
      <label className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">{label}</label>
      <input
        type={type}
        {...register(name)}
        className="w-full px-3 py-2 bg-slate-50 border border-border/80 rounded-xl outline-none text-xs transition-colors duration-300 focus:border-[#0038A8]/50 focus:ring-1 focus:ring-[#0038A8]/50 text-foreground"
        {...inputProps}
        defaultValue={defaultValue}
      />
      {error?.message && (
        <p className="text-[10px] text-red-500 font-semibold mt-0.5">{error.message.toString()}</p>
      )}
    </div>
  );
};

export default InputField;

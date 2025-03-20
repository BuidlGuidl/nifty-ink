interface FormInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  type?: "text" | "textarea";
  placeholder: string;
  required?: boolean;
}

export const FormInput = ({
  label,
  value,
  onChange,
  maxLength,
  type = "text",
  placeholder,
  required = true,
}: FormInputProps) => (
  <div className="form-control">
    <label className="label">
      <span className="label-text">{label}</span>
      {maxLength && (
        <span className="label-text-alt">
          {value.length}/{maxLength}
        </span>
      )}
    </label>
    {type === "textarea" ? (
      <textarea
        placeholder={placeholder}
        className="textarea textarea-md textarea-bordered rounded-xl w-full max-w-xs"
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={maxLength}
        required={required}
      />
    ) : (
      <input
        type={type}
        placeholder={placeholder}
        className="input input-sm input-bordered rounded-xl w-full max-w-xs"
        value={value}
        onChange={e => onChange(e.target.value)}
        maxLength={maxLength}
        required={required}
      />
    )}
  </div>
);

"use client";

import { InputHTMLAttributes, forwardRef } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, className, ...props },
  ref
) {
  return (
    <div>
      {label && <label className="block text-sm mb-1">{label}</label>}
      <input
        ref={ref}
        className={
          "w-full rounded border px-3 py-2 bg-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 " +
          (className || "")
        }
        {...props}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
});

export default Input;

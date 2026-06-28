// src/components/atoms/Textarea.tsx
import { TextareaHTMLAttributes, forwardRef } from 'react';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className = '', ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 ${className}`}
      {...rest}
    />
  );
});

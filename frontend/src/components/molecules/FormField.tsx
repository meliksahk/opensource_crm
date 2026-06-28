// src/components/molecules/FormField.tsx
import { InputHTMLAttributes } from 'react';
import { Input } from '../atoms/Input';
import { Label } from '../atoms/Label';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
}

export function FormField({ label, id, ...rest }: Props) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...rest} />
    </div>
  );
}

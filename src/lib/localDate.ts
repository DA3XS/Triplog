/** Formats a Date as a value usable in <input type="datetime-local">, in local time. */
export function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parses a <input type="datetime-local"> value as local time. */
export function fromLocalInputValue(value: string): Date {
  return new Date(value);
}

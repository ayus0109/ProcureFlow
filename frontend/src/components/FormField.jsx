/** Labelled input with a large touch target. Used by every form in the app. */
export default function FormField({ id, label, hint, ...inputProps }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-slate-800">{label}</span>
        {hint && <span className="text-xs text-slate-500">{hint}</span>}
      </span>
      <input
        id={id}
        {...inputProps}
        className="min-h-12 w-full rounded-xl border-2 border-slate-200 bg-white px-3.5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-green-600 focus-visible:ring-4 focus-visible:ring-green-100"
      />
    </label>
  );
}

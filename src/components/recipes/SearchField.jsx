import { useId } from 'react'
import { Search } from 'lucide-react'

export default function SearchField({ label, placeholder = label, value, onChange }) {
  const id = useId()

  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        size={18}
        aria-hidden="true"
        className="pointer-events-none absolute top-3.5 left-3.5 text-sage-500"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        enterKeyHint="search"
        className="h-[46px] w-full rounded-[14px] border border-sage-200 bg-white pr-3.5 pl-[42px] text-sm text-sage-900 transition outline-none placeholder:text-sage-500 focus-visible:border-sage-500 focus-visible:ring-2 focus-visible:ring-terracotta-700/30"
      />
    </div>
  )
}

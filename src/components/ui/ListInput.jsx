import clsx from 'clsx'

function renderFieldControl({ type, inputClassName, children, ...props }) {
  const controlClasses = clsx(
    'w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm text-sage-900 outline-none transition placeholder:text-sage-400 focus:border-sage-400 focus:ring-2 focus:ring-sage-200',
    type === 'textarea' ? 'min-h-32 resize-y' : '',
    inputClassName,
  )

  if (type === 'textarea') {
    return <textarea className={controlClasses} {...props} />
  }

  if (type === 'select') {
    return (
      <select className={controlClasses} {...props}>
        {children}
      </select>
    )
  }

  return <input type={type} className={controlClasses} {...props} />
}

export default function ListInput({ label, type = 'text', inputClassName, className, children, ...props }) {
  return (
    <label className={clsx('block border-b border-cream-100 px-4 py-3 last:border-b-0', className)}>
      {label ? <div className="mb-2 text-sm font-semibold text-sage-800">{label}</div> : null}
      {renderFieldControl({ type, inputClassName, children, ...props })}
    </label>
  )
}
# Plain-HTML Dropdown Escape Hatch in MFA

## Problem

Component-library Dropdowns (Antd, Material, Radix, …) often:

- Render their menu through a **portal** that mounts on `document.body`. In Module Federation, that body belongs to the host origin, and any event/CSS/context you expected to inherit from the remote is gone.
- Derive internal state from an `options` prop. Callers who build that array inline (e.g. `options={items.map(...)}`) create a new reference every render; the library's internal `useEffect` re-syncs, triggering another render → infinite loop. `useMemo` helps but many libraries still compare by deep shape.
- Rely on a Router context you don't have inside a `MemoryRouter`-wrapped expose.

These can be debugged, but the fix is often library-version-specific and fragile.

## Pattern

For a small, contained dropdown (a header menu, a row action, a filter toggle), hand-roll it:

```tsx
function HeaderMenu({ items, onPick }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button onClick={() => setOpen(v => !v)}>⋮</button>
      {open && (
        <ul
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            margin: 0,
            padding: '4px 0',
            listStyle: 'none',
            background: 'white',
            border: '1px solid #ddd',
            boxShadow: '0 2px 8px rgba(0,0,0,.15)',
            zIndex: 1000,
          }}
        >
          {items.map(it => (
            <li
              key={it.key}
              role="menuitem"
              onClick={() => { onPick(it); setOpen(false) }}
              style={{ padding: '6px 12px', cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              {it.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

No portal, no external Router, no `options` prop churn.

## When to use

- Simple dropdowns (≤ ~10 items), no search, no multi-select.
- Inside an MFA-exposed component where the library dropdown proved flaky.
- Header/action menus where keyboard accessibility can be added incrementally.

## When NOT to use

- Complex combobox with typeahead, virtualization, tag input — just fix the library integration instead.
- Shared design-system surfaces where consistency matters more than MFA safety — fix at the library boundary and document the constraint.

## Pitfalls

- Forgetting outside-click close handler → menu sticks open.
- Relying on `position: absolute` parents that clip overflow — an ancestor with `overflow: hidden` will truncate the menu. If that's a risk, put the menu under `position: fixed` with coordinates computed from the button's `getBoundingClientRect()` on open.
- Skipping `role="menu"` / `role="menuitem"` / keyboard handlers — worse a11y than the library version. Add these if the surface is user-facing.

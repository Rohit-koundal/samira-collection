import { TextInput } from '../ui/Field';

export default function SearchFilterBar({ search, onSearch, children, placeholder = 'Search records' }) {
  return (
    <div className="grid gap-3 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-[minmax(220px,1fr)_auto]">
      <TextInput value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} />
      <div className="grid gap-2 sm:flex sm:flex-wrap">{children}</div>
    </div>
  );
}

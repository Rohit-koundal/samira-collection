import { TextInput } from '../ui/Field';

export default function SearchFilterBar({ search, onSearch, children, placeholder = 'Search records' }) {
  return (
    <div className="admin-card grid gap-3 p-4 md:grid-cols-[minmax(220px,1fr)_auto] md:items-center">
      <TextInput value={search} onChange={(event) => onSearch(event.target.value)} placeholder={placeholder} />
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

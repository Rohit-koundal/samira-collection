import { useEffect, useState } from 'react';
import fallback from '../../assets/samira-collection-logo.png';
import { normalizeImageUrl } from '../../services/normalize';

export default function StoreLogo({ src, name = 'Samira Collection', className = '' }) {
  const source = src === fallback ? (name === 'Samira Collection' ? fallback : '') : normalizeImageUrl(src) || (name === 'Samira Collection' ? fallback : '');
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [source]);
  if (source && !failed) return <img src={source} alt={name} className={className} onError={() => setFailed(true)} />;
  return <span role="img" aria-label={name} className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 8, minWidth: 36, fontWeight: 700, color: 'inherit', fontSize: 18 }}>{name.split(/\s+/).filter(Boolean).slice(0, 2).map(word => word[0]).join('').toUpperCase()}</span>;
}

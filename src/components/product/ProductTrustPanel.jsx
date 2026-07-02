import { BadgeCheck, CheckCircle2, PackageOpen, ShieldCheck, CreditCard } from 'lucide-react';
import './ProductTrustPanel.css';

const trustItems = [
  { title: 'Genuine Product', subtitle: '100% authentic', icon: BadgeCheck },
  { title: 'Quality Checked', subtitle: 'Premium quality', icon: CheckCircle2 },
  { title: 'Easy Returns', subtitle: 'Hassle-free returns', icon: PackageOpen },
  { title: 'Pay on Delivery', subtitle: 'Available across India', icon: CreditCard },
  { title: 'Secure Payment', subtitle: '100% safe & secure', icon: ShieldCheck },
];

export default function ProductTrustPanel() {
  return (
    <aside className="sc-trust sc-pdp__trust">
      <div className="sc-trust__card">
        {trustItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className={`sc-trust__item${index === trustItems.length - 1 ? ' sc-trust__item--last' : ''}`}>
              <span className="sc-trust__icon">
                <Icon size={18} />
              </span>
              <div>
                <strong>{item.title}</strong>
                <p>{item.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

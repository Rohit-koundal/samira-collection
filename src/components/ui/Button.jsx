const variants = {
  primary: 'bg-wine text-white hover:bg-wine/90',
  accent: 'bg-rose text-white hover:bg-rose/90',
  secondary: 'border border-slate-200 bg-white text-charcoal hover:border-slate-300',
  ghost: 'text-wine hover:bg-wine/5',
};

const sizes = {
  sm: 'h-9 px-3 text-xs',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-5 text-sm',
};

export default function Button({ as: Component = 'button', variant = 'primary', size = 'md', className = '', type, ...props }) {
  return (
    <Component
      type={Component === 'button' ? type || 'button' : type}
      className={`inline-flex items-center justify-center rounded-xl font-black transition disabled:pointer-events-none disabled:opacity-60 ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    />
  );
}

import { useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { normalizeImageEntries, normalizeImageUrl } from '../../services/normalize';
import { ProductVisual } from './ProductCard';

export default function ProductImageCarousel({
  product,
  className = 'aspect-[4/5] w-full',
  onOpen,
  children,
}) {
  const images = useMemo(() => normalizeImageEntries(product?.images || []), [product?.images]);
  const hasMultiple = images.length > 1;
  const [index, setIndex] = useState(0);
  const touchState = useRef({ startX: 0, startY: 0, deltaX: 0, deltaY: 0, swiping: false });

  const goTo = (nextIndex) => {
    if (!images.length) return;
    const total = images.length;
    setIndex((nextIndex + total) % total);
  };

  const handleTouchStart = (event) => {
    const touch = event.touches[0];
    touchState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      deltaX: 0,
      deltaY: 0,
      swiping: false,
    };
  };

  const handleTouchMove = (event) => {
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchState.current.startX;
    const deltaY = touch.clientY - touchState.current.startY;
    touchState.current.deltaX = deltaX;
    touchState.current.deltaY = deltaY;
    if (Math.abs(deltaX) > Math.abs(deltaY) + 8) {
      touchState.current.swiping = true;
    }
  };

  const handleTouchEnd = () => {
    if (!hasMultiple) return;
    const { deltaX, swiping } = touchState.current;
    if (!swiping || Math.abs(deltaX) < 40) return;
    if (deltaX < 0) goTo(index + 1);
    else goTo(index - 1);
  };

  const handleClick = () => {
    if (touchState.current.swiping && Math.abs(touchState.current.deltaX) > 8) {
      touchState.current.swiping = false;
      return;
    }
    onOpen?.();
  };

  return (
    <div
      className={`relative overflow-hidden rounded-[18px] bg-[#f6efe8] ${className}`}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ touchAction: 'pan-y' }}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen?.();
        }
      }}
      aria-label={`View ${product?.name || 'product'}`}
    >
      {images.length ? (
        <>
          <div
            className="flex h-full w-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {images.map((image, imageIndex) => (
              <div key={`${image.url}-${imageIndex}`} className="h-full w-full shrink-0">
                <img
                  src={normalizeImageUrl(image.url)}
                  alt={product?.name || 'Product'}
                  className="h-full w-full object-cover object-center"
                  loading="lazy"
                  draggable="false"
                />
              </div>
            ))}
          </div>

          {hasMultiple && (
            <>
              <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center gap-1.5">
                {images.map((image, dotIndex) => (
                  <span
                    key={`${image.url}-dot-${dotIndex}`}
                    className={`h-1.5 rounded-full transition-all ${dotIndex === index ? 'w-4 bg-white' : 'w-1.5 bg-white/65'}`}
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goTo(index - 1);
                }}
                className="absolute left-2 top-1/2 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/92 text-[#1f2a44] shadow-sm md:grid"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  goTo(index + 1);
                }}
                className="absolute right-2 top-1/2 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-white/92 text-[#1f2a44] shadow-sm md:grid"
                aria-label="Next image"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </>
          )}
        </>
      ) : (
        <ProductVisual product={product} compact={false} showMeta={false} />
      )}

      {children}
    </div>
  );
}

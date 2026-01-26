'use client';

import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuantitySelectorProps {
  quantity: number;
  maxQuantity?: number;
  onIncrease: () => void;
  onDecrease: () => void;
  size?: 'sm' | 'md';
}

export function QuantitySelector({
  quantity,
  maxQuantity = Infinity,
  onIncrease,
  onDecrease,
  size = 'md',
}: QuantitySelectorProps) {
  const buttonSize = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'w-8 text-sm' : 'w-10';

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon"
        className={buttonSize}
        onClick={onDecrease}
        disabled={quantity <= 1}
      >
        <Minus className={iconSize} />
      </Button>
      <span className={`${textSize} text-center font-medium`}>{quantity}</span>
      <Button
        variant="outline"
        size="icon"
        className={buttonSize}
        onClick={onIncrease}
        disabled={quantity >= maxQuantity}
      >
        <Plus className={iconSize} />
      </Button>
    </div>
  );
}

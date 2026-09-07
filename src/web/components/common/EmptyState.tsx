import React from 'react';
import { FRIGO_ASSETS } from '../../lib/frigo-assets';
import { Button } from './Button';

interface EmptyStateProps {
  type?: 'empty-fridge' | 'no-recipes' | 'shopping-ready' | 'delicious-meal' | 'error';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  secondaryActionText?: string;
  onSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'empty-fridge',
  title,
  description,
  actionText,
  onAction,
  secondaryActionText,
  onSecondaryAction,
}) => {
  const imgSrc =
    type === 'error'
      ? FRIGO_ASSETS.illustrations['empty-fridge']
      : FRIGO_ASSETS.illustrations[type as keyof typeof FRIGO_ASSETS.illustrations] ||
        FRIGO_ASSETS.illustrations['empty-fridge'];

  return (
    <div className="bg-white rounded-2xl p-6 text-center border border-slate-200/80 shadow-xs my-4 select-none animate-fade-in">
      <div className="w-32 h-32 mx-auto mb-3 overflow-hidden flex items-center justify-center">
        <img
          src={imgSrc}
          alt={title}
          className="w-full h-full object-contain"
        />
      </div>

      <h3 className="font-heading font-bold text-base text-slate-900">
        {title}
      </h3>

      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
        {description}
      </p>

      {(actionText || secondaryActionText) && (
        <div className="mt-5 flex gap-2.5 justify-center max-w-xs mx-auto">
          {actionText && onAction && (
            <Button
              size="md"
              onClick={onAction}
              className="flex-1 bg-[#22C55E] hover:bg-[#1ea750] text-white font-heading font-bold text-xs py-2.5 rounded-xl shadow-xs"
            >
              {actionText}
            </Button>
          )}

          {secondaryActionText && onSecondaryAction && (
            <Button
              size="md"
              variant="outline"
              onClick={onSecondaryAction}
              className="flex-1 border-slate-200 text-slate-700 font-heading font-semibold text-xs py-2.5 rounded-xl hover:bg-slate-50"
            >
              {secondaryActionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

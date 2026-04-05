import { Lock, CreditCard } from "lucide-react";

interface LockedContentProps {
  title: string;
  message: string;
  onPaymentClick?: () => void;
  showPaymentButton?: boolean;
}

export function LockedContent({ title, message, onPaymentClick, showPaymentButton = true }: LockedContentProps) {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E4DC] p-12 text-center">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0B1D3A] to-[#1e3a8a] flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-[#d4af37]" />
      </div>

      <h3 className="text-lg font-semibold text-[#0B1D3A] mb-2">{title}</h3>
      <p className="text-sm text-[#5A6478] max-w-md mx-auto mb-6">{message}</p>

      {showPaymentButton && onPaymentClick && (
        <button
          onClick={onPaymentClick}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#d4af37] to-[#f4cf57] text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
        >
          <CreditCard className="w-5 h-5" />
          Ödeme Yap
        </button>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <p className="text-xs text-blue-900 leading-relaxed">
          💳 Kredi kartı ile anında ödeme yapabilir veya havale ile ödeme yapabilirsiniz.
          Ödeme onaylandıktan sonra tüm içerikler açılacaktır.
        </p>
      </div>
    </div>
  );
}

export function PartiallyLockedBanner({ message }: { message: string }) {
  return (
    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <Lock className="w-4 h-4 text-amber-700" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-amber-900 mb-1">Kısıtlı Erişim</p>
        <p className="text-xs text-amber-700 leading-relaxed">{message}</p>
      </div>
    </div>
  );
}

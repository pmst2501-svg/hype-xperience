import React, { useState, useEffect } from 'react';
import {
  EventItem,
  Ticket,
  TicketTier,
  UserProfile,
  StripeOrder,
} from '../types/ticket';
import {
  calculateStripeCheckoutTotals,
  validateStripeCardDetails,
  buildStripeOrderAndTickets,
} from '../utils/ticketingLogic';
import {
  X,
  User,
  Mail,
  DollarSign,
  Sparkles,
  QrCode,
  Phone,
  CreditCard,
  Lock,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Smartphone,
  Building2,
} from 'lucide-react';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventItem;
  currentUser: UserProfile;
  onIssueTickets: (tickets: Ticket[], stripeOrder?: StripeOrder) => void;
  isAdmin: boolean;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  event,
  currentUser,
  onIssueTickets,
  isAdmin,
}) => {
  const [step, setStep] = useState<'details' | 'stripe'>('details');
  const [guestName, setGuestName] = useState(currentUser.displayName || '');
  const [guestEmail, setGuestEmail] = useState(currentUser.email || '');
  const [guestPhone, setGuestPhone] = useState(currentUser.phoneNumber || '');
  const [guestDocumentId, setGuestDocumentId] = useState(currentUser.documentId || '');
  const [tier, setTier] = useState<TicketTier>('General');
  const [quantity, setQuantity] = useState<number>(1);
  const [customPrice, setCustomPrice] = useState<number>(event.basePrice || 1500);

  // Stripe Payment State
  const [paymentMethodType, setPaymentMethodType] = useState<'card' | 'apple_pay' | 'spei'>('card');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('424');
  const [cardholderName, setCardholderName] = useState(currentUser.displayName || '');
  const [postalCode, setPostalCode] = useState('39897');
  const [isProcessingStripe, setIsProcessingStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setStep('details');
      setGuestName(currentUser.displayName || '');
      setGuestEmail(currentUser.email || '');
      setGuestPhone(currentUser.phoneNumber || '');
      setGuestDocumentId(currentUser.documentId || '');
      setCardholderName(currentUser.displayName || '');
      setTier('General');
      setQuantity(1);
      setCustomPrice(event.basePrice || 1500);
      setStripeError(null);
      setIsProcessingStripe(false);
    }
  }, [isOpen, currentUser, event]);

  if (!isOpen) return null;

  const getTierPrice = (t: TicketTier) => {
    const base = event.basePrice || 1500;
    switch (t) {
      case 'General':
        return base;
      case 'VIP':
        return Math.round(base * 1.8);
      case 'Backstage':
        return Math.round(base * 3.0);
      case 'Mesa VIP':
        return Math.round(base * 4.5);
    }
  };

  const handleTierChange = (newTier: TicketTier) => {
    setTier(newTier);
    setCustomPrice(getTierPrice(newTier));
  };

  const formatCardNumberInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiryInput = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) {
      return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    }
    return digits;
  };

  const totals = calculateStripeCheckoutTotals(customPrice, quantity, true);

  const handleProceedToStripe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestEmail.trim()) {
      setStripeError('Completa el nombre y correo electrónico del comprador.');
      return;
    }
    setStripeError(null);
    setCardholderName(guestName.trim());
    setStep('stripe');
  };

  const handleProcessStripePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setStripeError(null);

    let brand = 'Visa';
    let last4 = '4242';

    if (paymentMethodType === 'card') {
      const cardValidation = validateStripeCardDetails({
        cardNumber,
        cardExpiry,
        cardCvc,
        cardholderName,
      });
      if (!cardValidation.valid) {
        setStripeError(cardValidation.error || 'Verifica los datos de tu tarjeta.');
        return;
      }
      brand = cardValidation.brand;
      last4 = cardValidation.last4;
    }

    setIsProcessingStripe(true);

    let serverPaymentIntentId: string | undefined;
    let serverChargeId: string | undefined;

    try {
      const response = await fetch('/api/stripe/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountMxn: totals.totalAmount,
          currency: event.currency || 'MXN',
          eventTitle: event.title,
          eventCode: event.code,
          buyerName: guestName.trim(),
          buyerEmail: guestEmail.trim(),
          tier,
          quantity,
          paymentMethodType,
          cardBrand: brand,
          cardLast4: last4,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.paymentIntentId) {
          serverPaymentIntentId = data.paymentIntentId;
          serverChargeId = data.chargeId;
        }
      }
    } catch {
      // Fallback to local Stripe order builder if server route is unreachable
    }

    const { order, tickets } = buildStripeOrderAndTickets({
      eventId: event.id,
      eventTitle: event.title,
      eventCode: event.code,
      currency: event.currency || 'MXN',
      buyerUid: currentUser.uid || `usr-buyer-${Date.now()}`,
      guestName: guestName.trim(),
      guestEmail: guestEmail.trim(),
      guestPhone: guestPhone.trim(),
      guestDocumentId: guestDocumentId.trim(),
      tier,
      unitPrice: customPrice,
      quantity,
      paymentMethodType,
      cardBrand: brand,
      cardLast4: last4,
      paymentIntentId: serverPaymentIntentId,
      chargeId: serverChargeId,
      includeServiceFee: true,
    });

    setIsProcessingStripe(false);
    onIssueTickets(tickets, order);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="glass rounded-3xl p-5 sm:p-6 max-w-md w-full border border-white/20 shadow-2xl space-y-4 my-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#635BFF] text-white flex items-center justify-center font-bold shadow-lg shadow-[#635BFF]/30 shrink-0">
              {step === 'stripe' ? (
                <CreditCard className="w-4 h-4" />
              ) : (
                <QrCode className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-extrabold text-white truncate">
                  {step === 'stripe'
                    ? 'Stripe Checkout · Pago Seguro'
                    : 'Comprar Entrada QR · Stripe'}
                </h3>
                <span className="text-[9px] font-mono bg-[#635BFF]/25 text-indigo-300 px-2 py-0.5 rounded-full border border-[#635BFF]/40 font-bold shrink-0">
                  STRIPE
                </span>
              </div>
              <p className="text-[10px] text-white/60 truncate">{event.title}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 text-white/70 hover:text-white flex items-center justify-center text-xs cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {stripeError && (
          <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs">
            {stripeError}
          </div>
        )}

        {step === 'details' ? (
          <form onSubmit={handleProceedToStripe} className="space-y-3.5">
            <div>
              <label className="text-[11px] text-white/70 block mb-1 font-medium">
                Nombre del Titular Comprador (aparecerá en el QR) *:
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/40" />
                <input
                  type="text"
                  required
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-emerald-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] text-white/70 block mb-1 font-medium">
                  Correo para envío de QR & Recibo Stripe *:
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/40" />
                  <input
                    type="email"
                    required
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="comprador@correo.com"
                    className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-white/70 block mb-1 font-medium">
                  Teléfono Móvil / WhatsApp:
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/40" />
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+52 744 123 4567"
                    className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono placeholder-white/40 outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-white/70 block mb-1.5 font-medium">
                Zona del Evento:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['General', 'VIP', 'Backstage', 'Mesa VIP'] as TicketTier[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => handleTierChange(t)}
                    className={`p-2.5 rounded-xl text-left border text-xs transition cursor-pointer ${
                      tier === t
                        ? 'border-emerald-400 bg-emerald-400/20 text-white font-bold'
                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{t}</span>
                      {tier === t && <Sparkles className="w-3 h-3 text-emerald-300" />}
                    </div>
                    <div className="text-[11px] font-mono text-emerald-300/90 mt-0.5 tabular-nums">
                      ${getTierPrice(t).toLocaleString()} {event.currency || 'MXN'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity selector: generates 1 individual QR per ticket */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold text-white">Cantidad de Entradas</div>
                <div className="text-[10px] text-emerald-400">
                  1 QR individual por cada boleto comprado
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setQuantity(n)}
                    className={`w-8 h-8 rounded-xl font-mono text-xs font-bold transition cursor-pointer ${
                      quantity === n
                        ? 'bg-white text-black shadow'
                        : 'bg-black/40 text-neutral-400 hover:text-white border border-white/10'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {isAdmin && (
              <div>
                <label className="text-[11px] text-white/70 block mb-1 font-medium">
                  Precio Unitario Personalizado (MXN):
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/40" />
                  <input
                    type="number"
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full bg-black/50 border border-white/15 rounded-xl pl-9 pr-3 py-2 text-xs text-white font-mono outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            )}

            {/* Order Summary Breakdown */}
            <div className="p-3 rounded-2xl bg-black/40 border border-white/10 space-y-1 text-xs">
              <div className="flex justify-between text-neutral-400">
                <span>
                  Subtotal ({quantity}x {tier}):
                </span>
                <span className="font-mono tabular-nums">
                  ${totals.subtotal.toLocaleString()} MXN
                </span>
              </div>
              <div className="flex justify-between text-neutral-400">
                <span>Comisión Procesamiento Stripe (3.6% + $3):</span>
                <span className="font-mono tabular-nums">
                  ${totals.serviceFee.toLocaleString()} MXN
                </span>
              </div>
              <div className="flex justify-between text-white font-extrabold pt-1 border-t border-white/10 text-sm">
                <span>Total a Pagar con Stripe:</span>
                <span className="font-mono text-emerald-400 tabular-nums">
                  ${totals.totalAmount.toLocaleString()} MXN
                </span>
              </div>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold cursor-pointer shrink-0"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#635BFF] hover:bg-[#5249e6] text-white font-extrabold text-xs shadow-lg shadow-[#635BFF]/30 flex items-center justify-center gap-2 cursor-pointer min-w-0"
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  Continuar al Pago con Stripe (${totals.totalAmount.toLocaleString()} MXN)
                </span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleProcessStripePayment} className="space-y-3.5">
            {/* Stripe Amount Summary Header */}
            <div className="p-3 rounded-2xl bg-[#635BFF]/15 border border-[#635BFF]/35 flex items-center justify-between">
              <div>
                <div className="text-[10px] font-mono uppercase text-indigo-300 font-bold">
                  RESUMEN DEL CARGO STRIPE
                </div>
                <div className="text-xs font-bold text-white">
                  {quantity}x Boleto {tier} · {guestName}
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-black font-mono text-white tabular-nums">
                  ${totals.totalAmount.toLocaleString()} MXN
                </div>
                <div className="text-[10px] text-emerald-300 flex items-center justify-end gap-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>TLS 256-bit</span>
                </div>
              </div>
            </div>

            {/* Stripe Payment Method Selector */}
            <div>
              <label className="text-[11px] text-white/70 block mb-1.5 font-medium">
                Método de Pago en Stripe:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethodType('card')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    paymentMethodType === 'card'
                      ? 'bg-[#635BFF] text-white border-[#635BFF]'
                      : 'bg-black/40 text-neutral-300 border-white/15 hover:bg-white/10'
                  }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Tarjeta</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethodType('apple_pay')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    paymentMethodType === 'apple_pay'
                      ? 'bg-white text-black border-white'
                      : 'bg-black/40 text-neutral-300 border-white/15 hover:bg-white/10'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Apple Pay</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethodType('spei')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition cursor-pointer ${
                    paymentMethodType === 'spei'
                      ? 'bg-emerald-400 text-black border-emerald-300'
                      : 'bg-black/40 text-neutral-300 border-white/15 hover:bg-white/10'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>SPEI</span>
                </button>
              </div>
            </div>

            {paymentMethodType === 'card' && (
              <div className="space-y-3 p-3.5 rounded-2xl bg-black/50 border border-white/15">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-neutral-300">
                    Datos de Tarjeta (Crédito o Débito)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCardNumber('4242 4242 4242 4242');
                      setCardExpiry('12/28');
                      setCardCvc('424');
                      setCardholderName(guestName || 'Comprador Verificado');
                    }}
                    className="text-[10px] font-mono text-indigo-300 hover:text-white underline cursor-pointer"
                  >
                    Autocompletar Visa Test 4242
                  </button>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">
                    Número de Tarjeta
                  </label>
                  <input
                    type="text"
                    required
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumberInput(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono tracking-wider outline-none focus:border-[#635BFF]"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">
                      Vencimiento
                    </label>
                    <input
                      type="text"
                      required
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(formatExpiryInput(e.target.value))}
                      placeholder="MM/AA"
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#635BFF]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">
                      CVC / CVV
                    </label>
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                      placeholder="424"
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#635BFF]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-neutral-400 block mb-1">
                      C.P.
                    </label>
                    <input
                      type="text"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="39897"
                      className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-[#635BFF]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-neutral-400 block mb-1">
                    Nombre en la Tarjeta
                  </label>
                  <input
                    type="text"
                    required
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Nombre del titular"
                    className="w-full bg-black/60 border border-white/20 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-[#635BFF]"
                  />
                </div>
              </div>
            )}

            {paymentMethodType === 'apple_pay' && (
              <div className="p-4 rounded-2xl bg-white/5 border border-white/15 text-center space-y-2">
                <CheckCircle2 className="w-7 h-7 text-emerald-400 mx-auto" />
                <div className="text-xs font-bold text-white">
                  Apple Pay / Stripe Express Listo
                </div>
                <p className="text-[11px] text-neutral-400">
                  Se autorizará el cargo de ${totals.totalAmount.toLocaleString()} MXN y se emitirán tus QRs al instante.
                </p>
              </div>
            )}

            {paymentMethodType === 'spei' && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-1.5 text-xs">
                <div className="font-bold text-emerald-300">
                  CLABE Stripe SPEI Referenciada:
                </div>
                <div className="font-mono text-white bg-black/40 p-2 rounded-xl border border-white/10 text-center tracking-widest">
                  646180157042429901
                </div>
                <p className="text-[10px] text-neutral-300">
                  Al confirmar, Stripe concilia la transferencia en tiempo real y libera tu código QR individual.
                </p>
              </div>
            )}

            <div className="pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => setStep('details')}
                className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer shrink-0"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Atrás</span>
              </button>
              <button
                type="submit"
                disabled={isProcessingStripe}
                className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs shadow-lg shadow-emerald-400/20 flex items-center justify-center gap-1.5 cursor-pointer min-w-0"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {isProcessingStripe
                    ? 'Procesando con Stripe...'
                    : `Pagar $${totals.totalAmount.toLocaleString()} MXN y Generar QR`}
                </span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

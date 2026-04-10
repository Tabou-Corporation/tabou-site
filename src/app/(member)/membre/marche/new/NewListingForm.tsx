"use client";

import { useState, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";
import {
  estimateItems,
  createListing,
  type AppraisalFormState,
  type ListingFormState,
} from "@/lib/actions/buyback";
import { cn } from "@/lib/utils/cn";
import { Package, ShoppingCart, ArrowLeftRight, AlertTriangle, HelpCircle } from "lucide-react";

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B ISK`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ISK`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K ISK`;
  return `${Math.round(amount)} ISK`;
}

const TYPE_OPTIONS = [
  { value: "SELL", label: "Je vends", icon: Package, description: "Tu proposes des items a la vente" },
  { value: "BUY", label: "Je cherche", icon: ShoppingCart, description: "Tu cherches des items a acheter" },
  { value: "EXCHANGE", label: "J'echange", icon: ArrowLeftRight, description: "Tu proposes un echange d'items" },
] as const;

const PRICING_MODES = [
  { value: "fixed", label: "Prix fixe (ISK)" },
  { value: "rate", label: "% du Jita buy" },
  { value: "open", label: "Ouvert aux offres" },
] as const;

const inputCls = cn(
  "w-full bg-bg-elevated border rounded px-3 py-2",
  "text-text-primary text-sm",
  "border-border focus:border-gold/60 focus:outline-none",
  "transition-colors duration-150"
);

export function NewListingForm() {
  const router = useRouter();
  const { addToast } = useToast();

  const [type, setType] = useState<"SELL" | "BUY" | "EXCHANGE">("SELL");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [rawPaste, setRawPaste] = useState("");
  const [pricingMode, setPricingMode] = useState<"fixed" | "rate" | "open">("open");
  const [fixedPrice, setFixedPrice] = useState("");
  const [rate, setRate] = useState("90");
  const [showHelp, setShowHelp] = useState(false);

  // Estimation
  const [estimateState, estimateAction, estimatePending] = useActionState<AppraisalFormState, FormData>(
    estimateItems,
    {}
  );
  const appraisal = estimateState.appraisal;

  // Submit
  const [, startTransition] = useTransition();
  const [submitPending, setSubmitPending] = useState(false);

  function handleSubmit() {
    setSubmitPending(true);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("type", type);
      fd.set("title", title);
      fd.set("description", description);
      fd.set("rawPaste", rawPaste);
      fd.set("items", appraisal ? JSON.stringify(appraisal.items) : "[]");
      fd.set("totalJitaBuy", String(appraisal?.totalBuyPrice ?? 0));

      if (pricingMode === "fixed" && fixedPrice) {
        fd.set("askingPrice", fixedPrice);
      } else if (pricingMode === "rate" && rate) {
        fd.set("askingRate", rate);
        // Calculer le prix a partir du taux
        if (appraisal) {
          fd.set("askingPrice", String(appraisal.totalBuyPrice * parseInt(rate) / 100));
        }
      }

      const result: ListingFormState = await createListing({}, fd);
      setSubmitPending(false);

      if (result.error) {
        addToast(result.error, "error");
      } else {
        addToast("Annonce publiee !", "success");
        router.push("/membre/marche");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Type d'annonce */}
      <Card>
        <CardHeader>
          <h2 className="font-display font-semibold text-base text-text-primary">
            Type d&apos;annonce
          </h2>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TYPE_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isActive = type === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-4 rounded border transition-all text-center",
                    isActive
                      ? "border-gold bg-gold/10 text-gold"
                      : "border-border bg-bg-elevated text-text-secondary hover:border-border-accent"
                  )}
                >
                  <Icon size={20} />
                  <span className="font-semibold text-sm">{opt.label}</span>
                  <span className="text-[11px] text-text-muted">{opt.description}</span>
                </button>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Titre & description */}
      <Card>
        <CardHeader>
          <h2 className="font-display font-semibold text-base text-text-primary">
            Details
          </h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-text-muted text-xs font-medium">
              Titre <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Lot de minerais, Raven Navy Issue, Echange BPC..."
              maxLength={100}
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-text-muted text-xs font-medium">
              Description <span className="text-text-muted font-normal">(optionnel)</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Precisions, conditions, localisation des items..."
              maxLength={500}
              className={cn(inputCls, "resize-y")}
            />
          </div>
        </CardBody>
      </Card>

      {/* Items EVE (optionnel) */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-display font-semibold text-base text-text-primary">
              Items <span className="text-text-muted font-normal text-xs">(optionnel)</span>
            </h2>
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-text-muted hover:text-gold transition-colors"
            >
              <HelpCircle size={16} />
            </button>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {showHelp && (
            <div className="bg-bg-elevated border border-border rounded p-3 space-y-2">
              <p className="text-text-primary text-xs font-semibold">Comment ajouter des items ?</p>
              <ol className="text-text-secondary text-xs space-y-0.5 list-decimal list-inside">
                <li>Ouvre ton inventaire / cargo / hangar en jeu</li>
                <li>Selectionne les items (<kbd className="bg-bg-deep px-1 py-0.5 rounded text-[10px] font-mono border border-border">Ctrl+A</kbd> pour tout)</li>
                <li>Copie avec <kbd className="bg-bg-deep px-1 py-0.5 rounded text-[10px] font-mono border border-border">Ctrl+C</kbd></li>
                <li>Colle ici — les prix Jita sont calcules automatiquement</li>
              </ol>
              <p className="text-text-muted text-[11px]">
                Les noms doivent etre en <strong className="text-text-secondary">anglais</strong>.
                Pas obligatoire — tu peux poster une annonce sans items.
              </p>
            </div>
          )}

          {!appraisal && (
            <form action={estimateAction} className="space-y-3">
              <textarea
                name="rawPaste"
                rows={5}
                value={rawPaste}
                onChange={(e) => setRawPaste(e.target.value)}
                placeholder={"Tritanium\t5000\nPyerite\t2000"}
                className={cn(inputCls, "font-mono text-xs resize-y", "placeholder:text-text-muted/40")}
              />
              {estimateState.error && (
                <div className="flex items-start gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded">
                  <AlertTriangle size={12} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-xs">{estimateState.error}</p>
                </div>
              )}
              <Button type="submit" variant="ghost" size="sm" disabled={estimatePending || !rawPaste.trim()}>
                {estimatePending ? <><Spinner /> Estimation...</> : "Estimer les prix Jita"}
              </Button>
            </form>
          )}

          {appraisal && (
            <div className="space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border text-text-muted uppercase tracking-wide">
                      <th className="text-left pb-1 font-semibold">Item</th>
                      <th className="text-right pb-1 font-semibold">Qte</th>
                      <th className="text-right pb-1 font-semibold">Jita Buy</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appraisal.items.map((item, i) => (
                      <tr key={i} className="border-b border-border-subtle">
                        <td className="py-1.5 text-text-primary">{item.name}</td>
                        <td className="py-1.5 text-text-secondary text-right font-mono">{item.quantity.toLocaleString("fr-FR")}</td>
                        <td className="py-1.5 text-text-secondary text-right font-mono">{formatISK(item.totalBuy)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center bg-bg-elevated rounded p-2">
                <span className="text-text-muted text-xs">Valeur Jita buy totale</span>
                <span className="text-gold font-display font-bold">{formatISK(appraisal.totalBuyPrice)}</span>
              </div>
              {appraisal.failures.length > 0 && (
                <p className="text-yellow-400 text-[11px]">
                  Items non reconnus : {appraisal.failures.join(", ")}
                </p>
              )}
              <Button type="button" variant="ghost" size="sm" onClick={() => { setRawPaste(""); }}>
                Modifier les items
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Tarification */}
      <Card>
        <CardHeader>
          <h2 className="font-display font-semibold text-base text-text-primary">
            Prix demande
          </h2>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {PRICING_MODES.map((mode) => (
              <button
                key={mode.value}
                type="button"
                onClick={() => setPricingMode(mode.value)}
                className={cn(
                  "px-3 py-1.5 rounded text-xs font-medium transition-colors border",
                  pricingMode === mode.value
                    ? "bg-gold text-text-inverted border-gold"
                    : "bg-bg-elevated text-text-secondary border-border hover:border-border-accent"
                )}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {pricingMode === "fixed" && (
            <div className="space-y-1.5">
              <label className="block text-text-muted text-xs font-medium">Prix en ISK</label>
              <input
                type="number"
                value={fixedPrice}
                onChange={(e) => setFixedPrice(e.target.value)}
                placeholder="Ex: 150000000"
                min={0}
                className={inputCls}
              />
              <p className="text-text-muted text-[11px]">
                Prix total pour l&apos;ensemble du lot.
              </p>
            </div>
          )}

          {pricingMode === "rate" && (
            <div className="space-y-1.5">
              <label className="block text-text-muted text-xs font-medium">
                Pourcentage du Jita buy ({rate}%)
              </label>
              <input
                type="range"
                min={50}
                max={150}
                step={5}
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full accent-gold"
              />
              <div className="flex justify-between text-text-muted text-[10px]">
                <span>50%</span>
                <span className="text-gold font-semibold">{rate}%</span>
                <span>150%</span>
              </div>
              {appraisal && (
                <p className="text-text-muted text-xs">
                  = <span className="text-gold font-semibold">{formatISK(appraisal.totalBuyPrice * parseInt(rate) / 100)}</span>
                </p>
              )}
            </div>
          )}

          {pricingMode === "open" && (
            <p className="text-text-muted text-xs">
              Les acheteurs te proposeront un prix. Tu pourras accepter ou refuser chaque offre.
            </p>
          )}
        </CardBody>
      </Card>

      {/* Publier */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="primary"
          className="flex-1"
          disabled={submitPending || !title.trim()}
          onClick={handleSubmit}
        >
          {submitPending ? <><Spinner /> Publication...</> : "Publier l'annonce"}
        </Button>
        <Button as="a" href="/membre/marche" variant="ghost">
          Annuler
        </Button>
      </div>

      <p className="text-text-muted text-[11px] text-center">
        L&apos;annonce expire automatiquement dans 14 jours. Tu peux la fermer manuellement a tout moment.
      </p>
    </div>
  );
}

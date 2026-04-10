"use client";

import { useState, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/contexts/ToastContext";
import {
  estimateBuyback,
  submitBuyback,
  type AppraisalFormState,
  type SubmitBuybackState,
} from "@/lib/actions/buyback";
import { cn } from "@/lib/utils/cn";
import { Package, AlertTriangle, Check, HelpCircle } from "lucide-react";

function formatISK(amount: number): string {
  if (amount >= 1_000_000_000) return `${(amount / 1_000_000_000).toFixed(2)}B ISK`;
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M ISK`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K ISK`;
  return `${Math.round(amount)} ISK`;
}

export function BuybackForm() {
  const router = useRouter();
  const { addToast } = useToast();
  const [rawPaste, setRawPaste] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // Step 1: Estimate
  const [estimateState, estimateAction, estimatePending] = useActionState<AppraisalFormState, FormData>(
    estimateBuyback,
    {}
  );

  // Step 2: Submit
  const [, startSubmitTransition] = useTransition();
  const [submitPending, setSubmitPending] = useState(false);

  const appraisal = estimateState.appraisal;

  function handleSubmit() {
    if (!appraisal) return;
    setSubmitPending(true);

    startSubmitTransition(async () => {
      const fd = new FormData();
      fd.set("rawPaste", rawPaste);
      fd.set("items", JSON.stringify(appraisal.items));
      fd.set("totalJitaBuy", String(appraisal.totalBuyPrice));
      fd.set("buybackRate", String(appraisal.buybackRate));
      fd.set("totalBuyback", String(appraisal.totalBuyback));

      const result: SubmitBuybackState = await submitBuyback({}, fd);
      setSubmitPending(false);

      if (result.error) {
        addToast(result.error, "error");
      } else {
        addToast("Demande de buyback soumise.", "success");
        setRawPaste("");
        router.refresh();
      }
    });
  }

  function handleReset() {
    setRawPaste("");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package size={16} className="text-gold/70" />
            <h2 className="font-display font-semibold text-base text-text-primary">
              Vendre a la corporation
            </h2>
          </div>
          {!appraisal && (
            <button
              type="button"
              onClick={() => setShowHelp(!showHelp)}
              className="text-text-muted hover:text-gold transition-colors"
              title="Aide"
            >
              <HelpCircle size={16} />
            </button>
          )}
        </div>
      </CardHeader>
      <CardBody className="space-y-4">

        {/* Aide contextuelle */}
        {showHelp && !appraisal && (
          <div className="bg-bg-elevated border border-border rounded p-4 space-y-3">
            <p className="text-text-primary text-sm font-semibold">Comment copier tes items depuis EVE ?</p>

            <div className="space-y-2">
              <div className="space-y-1">
                <p className="text-gold text-xs font-semibold">Depuis ton inventaire / cargo / hangar :</p>
                <ol className="text-text-secondary text-xs space-y-0.5 list-decimal list-inside">
                  <li>Ouvre ton inventaire en jeu</li>
                  <li>Selectionne les items (Ctrl+A pour tout)</li>
                  <li>Copie avec <kbd className="bg-bg-deep px-1.5 py-0.5 rounded text-[10px] font-mono border border-border">Ctrl+C</kbd></li>
                  <li>Colle ici avec <kbd className="bg-bg-deep px-1.5 py-0.5 rounded text-[10px] font-mono border border-border">Ctrl+V</kbd></li>
                </ol>
              </div>

              <div className="border-t border-border-subtle pt-2 space-y-1">
                <p className="text-gold text-xs font-semibold">Formats acceptes :</p>
                <div className="font-mono text-[11px] text-text-muted bg-bg-deep rounded p-2 space-y-0.5">
                  <p>Tritanium	5000</p>
                  <p>Pyerite	2000</p>
                  <p>Mexallon x1000</p>
                  <p>Isogen 500</p>
                </div>
              </div>

              <div className="border-t border-border-subtle pt-2">
                <p className="text-text-muted text-[11px] leading-relaxed">
                  <strong className="text-text-secondary">Important :</strong> les noms d&apos;items doivent etre
                  en <strong className="text-text-secondary">anglais</strong> (langue par defaut d&apos;EVE).
                  Les prix affiches correspondent au Jita buy en temps reel.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Paste */}
        {!appraisal && (
          <form action={estimateAction} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-text-muted text-xs font-medium">
                Colle tes items (copier depuis EVE)
              </label>
              <textarea
                name="rawPaste"
                rows={8}
                value={rawPaste}
                onChange={(e) => setRawPaste(e.target.value)}
                placeholder={"Tritanium\t5000\nPyerite\t2000\nMexallon\t1000"}
                className={cn(
                  "w-full bg-bg-elevated border rounded px-3 py-2",
                  "text-text-primary text-sm font-mono",
                  "border-border focus:border-gold/60 focus:outline-none",
                  "transition-colors duration-150 resize-y",
                  "placeholder:text-text-muted/40"
                )}
              />
              <p className="text-text-muted text-[11px]">
                Selectionne tes items en jeu, copie (Ctrl+C) et colle ici.
                Clique <button type="button" onClick={() => setShowHelp(true)} className="text-gold hover:underline">?</button> pour plus d&apos;aide.
              </p>
            </div>

            {estimateState.error && (
              <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded">
                <AlertTriangle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-300 text-sm">{estimateState.error}</p>
              </div>
            )}

            <Button type="submit" variant="secondary" size="sm" className="w-full" disabled={estimatePending || !rawPaste.trim()}>
              {estimatePending ? <><Spinner /> Estimation en cours...</> : "Estimer la valeur"}
            </Button>
          </form>
        )}

        {/* Step 2: Review & Submit */}
        {appraisal && (
          <div className="space-y-4">
            {/* Items table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-text-muted text-xs uppercase tracking-wide">
                    <th className="text-left pb-2 font-semibold">Item</th>
                    <th className="text-right pb-2 font-semibold">Qte</th>
                    <th className="text-right pb-2 font-semibold">Jita Buy</th>
                    <th className="text-right pb-2 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {appraisal.items.map((item, i) => (
                    <tr key={i} className="border-b border-border-subtle">
                      <td className="py-2 text-text-primary">{item.name}</td>
                      <td className="py-2 text-text-secondary text-right font-mono">
                        {item.quantity.toLocaleString("fr-FR")}
                      </td>
                      <td className="py-2 text-text-secondary text-right font-mono text-xs">
                        {formatISK(item.jitaBuy)}
                      </td>
                      <td className="py-2 text-text-primary text-right font-mono">
                        {formatISK(item.totalBuy)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Failures */}
            {appraisal.failures.length > 0 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <AlertTriangle size={14} className="text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-yellow-300 text-sm font-medium">Items non reconnus :</p>
                  <p className="text-yellow-300/70 text-xs mt-1">
                    {appraisal.failures.join(", ")}
                  </p>
                  <p className="text-yellow-300/50 text-[11px] mt-1">
                    Verifie que les noms sont en anglais et bien orthographies.
                  </p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="bg-bg-elevated border border-border rounded p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Total Jita buy</span>
                <span className="text-text-secondary font-mono">{formatISK(appraisal.totalBuyPrice)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Taux corpo</span>
                <span className="text-text-secondary font-mono">{Math.round(appraisal.buybackRate * 100)}%</span>
              </div>
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="text-text-primary font-semibold">Vous recevrez</span>
                <span className="text-gold font-display font-bold text-lg">{formatISK(appraisal.totalBuyback)}</span>
              </div>
              <p className="text-text-muted text-[11px]">
                Expire dans 14 jours — un officier traitera ta demande et te paiera en jeu.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="primary"
                size="sm"
                className="flex-1"
                disabled={submitPending}
                onClick={handleSubmit}
              >
                {submitPending ? <><Spinner /> Soumission...</> : <><Check size={14} /> Soumettre la demande</>}
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={handleReset} disabled={submitPending}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

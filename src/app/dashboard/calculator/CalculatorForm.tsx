"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calculator } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Input";
import { formatGHS } from "@/lib/utils";
import { estimateDuty, type DutyEstimate } from "./actions";

export function CalculatorForm() {
  const [result, setResult] = useState<DutyEstimate | { error: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const outcome = await estimateDuty(formData);
      setResult(outcome);
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="p-5">
        <form action={handleSubmit} className="space-y-4">
          <Field label="HS code" htmlFor="hsCode">
            <Input id="hsCode" name="hsCode" required placeholder="e.g. 8471.30" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Customs value (GHS)" htmlFor="customsValueGhs">
              <Input
                id="customsValueGhs"
                name="customsValueGhs"
                type="number"
                min="0"
                step="0.01"
                required
              />
            </Field>
            <Field label="Quantity" htmlFor="quantity">
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                step="1"
                defaultValue={1}
                required
              />
            </Field>
          </div>
          <Button type="submit" pending={isPending} className="w-full">
            <Calculator className="h-4 w-4" />
            Calculate duty
          </Button>
        </form>
      </Card>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={JSON.stringify(result)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            {"error" in result ? (
              <Card className="p-5">
                <p className="text-sm text-danger">{result.error}</p>
              </Card>
            ) : !result.found ? (
              <Card className="p-5">
                <p className="text-sm text-foreground">No published rate for this HS code</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add it in the tariff schedule (admin) or double-check the code.
                </p>
                <p className="mt-4 text-xs text-muted-foreground">
                  Dutiable value: {formatGHS(result.totalValuePesewas)}
                </p>
              </Card>
            ) : (
              <Card className="p-5">
                <p className="text-xs text-muted-foreground">{result.tariffDescription}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-primary">
                  {formatGHS(result.computedDutyPesewas!)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {result.ratePercent}% of {formatGHS(result.totalValuePesewas)} dutiable value
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  Rate effective {result.effectiveDate}
                </p>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

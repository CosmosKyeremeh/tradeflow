import { CalculatorForm } from "./CalculatorForm";

export default function CalculatorPage() {
  return (
    <div>
      <h1 className="mb-1 text-lg font-medium text-primary">Duty calculator</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Estimate duty for an HS code before you commit to a shipment.
      </p>

      <CalculatorForm />
    </div>
  );
}

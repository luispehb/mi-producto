"use client";

import { useState } from "react";
import PlanForm from "./PlanForm";

// En mobile el formulario se despliega con un botón; en desktop siempre se ve (lo maneja el CSS)
export default function NewPlanPanel({ startOpen }: { startOpen: boolean }) {
  const [open, setOpen] = useState(startOpen);

  return (
    <section id="armar" className={open ? "new-plan open" : "new-plan"} aria-label="Armá un plan">
      <button className="btn btn-primary new-plan-toggle" type="button" aria-expanded={open} aria-controls="armar-body" onClick={() => setOpen(o => !o)}>
        {open ? "Cerrar" : "+ Armá un plan"}
      </button>
      <div id="armar-body" className="new-plan-body">
        <h2>Armá un plan</h2>
        <p className="new-plan-sub">Ciudad, qué hacer y cuándo. En un minuto está listo.</p>
        <PlanForm />
      </div>
    </section>
  );
}

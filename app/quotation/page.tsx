"use client";

import { useState } from "react";
import { Printer, Plus, Trash2, X, PlusCircle, RefreshCw } from "lucide-react";

interface Item {
  id: string;
  description: string;
  qty: number;
  rate: number;
}

interface Room {
  id: string;
  name: string;
  items: Item[];
}

interface Quotation {
  companyName: string;
  companyTagline: string;
  customerName: string;
  customerAddress: string;
  quotationNo: string;
  date: string;
  validUntil: string;
  preparedBy: string;
  rooms: Room[];
  terms: string[];
  notes: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 8);
}

function today() {
  return new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function qtnNo() {
  return `QTN-${new Date().getFullYear()}-001`;
}

function fmt(n: number) {
  return n.toLocaleString("en-IN");
}

const DEFAULT: Quotation = {
  companyName: "Alvari",
  companyTagline: "Interior & Furniture Works · Wayanad, Kerala",
  customerName: "",
  customerAddress: "",
  quotationNo: qtnNo(),
  date: today(),
  validUntil: "30 days from date",
  preparedBy: "",
  rooms: [
    {
      id: uid(),
      name: "Room 1",
      items: [{ id: uid(), description: "", qty: 1, rate: 0 }],
    },
  ],
  terms: [
    "Quotation valid for 30 days from issue date.",
    "50% advance required to confirm the order.",
    "Delivery timeline will be communicated upon order confirmation.",
    "Prices are inclusive of standard installation.",
    "Goods once sold will not be taken back.",
  ],
  notes: "Thank you for your business!",
};

// Inline editable input that looks like a document field on screen and plain text in print
function DocInput({
  value,
  onChange,
  placeholder,
  className = "",
  type = "text",
  align = "left",
  multiline = false,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  type?: string;
  align?: "left" | "center" | "right";
  multiline?: boolean;
}) {
  const base = `bg-transparent outline-none transition-colors duration-150 w-full
    print:border-none print:pointer-events-none
    border-b border-dashed border-[var(--color-line)]
    focus:border-[var(--color-accent)]
    placeholder:text-[var(--color-line)] text-[var(--color-ink)]
    ${align === "right" ? "text-right" : align === "center" ? "text-center" : ""}
    ${className}`;

  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={`${base} resize-none`}
      />
    );
  }
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={base}
    />
  );
}

export default function QuotationPage() {
  const [q, setQ] = useState<Quotation>(DEFAULT);

  const set = <K extends keyof Quotation>(k: K, v: Quotation[K]) =>
    setQ((p) => ({ ...p, [k]: v }));

  // Room operations
  const addRoom = () =>
    setQ((p) => ({
      ...p,
      rooms: [
        ...p.rooms,
        {
          id: uid(),
          name: `Room ${p.rooms.length + 1}`,
          items: [{ id: uid(), description: "", qty: 1, rate: 0 }],
        },
      ],
    }));

  const removeRoom = (rid: string) =>
    setQ((p) => ({ ...p, rooms: p.rooms.filter((r) => r.id !== rid) }));

  const setRoomName = (rid: string, name: string) =>
    setQ((p) => ({
      ...p,
      rooms: p.rooms.map((r) => (r.id === rid ? { ...r, name } : r)),
    }));

  // Item operations
  const addItem = (rid: string) =>
    setQ((p) => ({
      ...p,
      rooms: p.rooms.map((r) =>
        r.id === rid
          ? { ...r, items: [...r.items, { id: uid(), description: "", qty: 1, rate: 0 }] }
          : r,
      ),
    }));

  const removeItem = (rid: string, iid: string) =>
    setQ((p) => ({
      ...p,
      rooms: p.rooms.map((r) =>
        r.id === rid ? { ...r, items: r.items.filter((i) => i.id !== iid) } : r,
      ),
    }));

  const setItem = (rid: string, iid: string, field: keyof Item, val: string | number) =>
    setQ((p) => ({
      ...p,
      rooms: p.rooms.map((r) =>
        r.id === rid
          ? { ...r, items: r.items.map((i) => (i.id === iid ? { ...i, [field]: val } : i)) }
          : r,
      ),
    }));

  // Term operations
  const setTerm = (i: number, v: string) =>
    setQ((p) => {
      const t = [...p.terms];
      t[i] = v;
      return { ...p, terms: t };
    });
  const addTerm = () => setQ((p) => ({ ...p, terms: [...p.terms, ""] }));
  const removeTerm = (i: number) =>
    setQ((p) => ({ ...p, terms: p.terms.filter((_, j) => j !== i) }));

  // Totals
  const subtotals = q.rooms.map((r) =>
    r.items.reduce((s, i) => s + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0),
  );
  const grandTotal = subtotals.reduce((s, v) => s + v, 0);

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          @page { margin: 15mm 12mm; size: A4; }
          input, textarea {
            border: none !important;
            padding: 0 !important;
          }
          .print-paper {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      <div className="min-h-screen bg-[var(--color-bg)] py-8 px-4 print:bg-white print:p-0">

        {/* ── Toolbar ── */}
        <div className="no-print mx-auto mb-6 flex max-w-4xl items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-serif text-2xl text-[var(--color-ink)]">
              Quotation Generator
            </h1>
            <p className="text-xs text-[var(--color-muted)] mt-0.5">
              Fill in the fields below, then print or save as PDF.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setQ(DEFAULT)}
              className="flex items-center gap-1.5 rounded-full border border-[var(--color-line)] px-4 py-2 text-sm text-[var(--color-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-ink)] transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-sm font-medium text-[var(--color-bg)] transition-colors hover:bg-[var(--color-accent)]"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
          </div>
        </div>

        {/* ── Paper ── */}
        <div className="print-paper mx-auto max-w-4xl rounded-2xl border border-[var(--color-line)] bg-white p-8 shadow-xl md:p-12">

          {/* Header */}
          <div className="mb-8 border-b-2 border-[var(--color-accent)] pb-7 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
              Furniture Quotation
            </p>
            <div className="mt-2 flex items-baseline justify-center gap-0.5">
              <DocInput
                value={q.companyName}
                onChange={(v) => set("companyName", v)}
                className="max-w-[200px] text-center font-serif text-4xl"
                align="center"
              />
              <span className="font-serif text-4xl text-[var(--color-accent)] leading-none">.</span>
            </div>
            <DocInput
              value={q.companyTagline}
              onChange={(v) => set("companyTagline", v)}
              className="mt-1.5 max-w-sm text-center text-sm text-[var(--color-muted)] mx-auto"
              align="center"
            />
          </div>

          {/* Customer Info Grid */}
          <div className="mb-8 grid grid-cols-1 gap-0 overflow-hidden rounded-xl border border-[var(--color-line)] sm:grid-cols-2">
            {[
              { label: "Customer Name", key: "customerName" as const, placeholder: "Enter customer name", span: true },
              { label: "Customer Address", key: "customerAddress" as const, placeholder: "Address / City", span: true },
              { label: "Quotation No.", key: "quotationNo" as const },
              { label: "Date", key: "date" as const },
              { label: "Valid Until", key: "validUntil" as const },
              { label: "Prepared By", key: "preparedBy" as const, placeholder: "Sales person name" },
            ].map(({ label, key, placeholder, span }) => (
              <div
                key={key}
                className={`flex flex-col gap-1 border-b border-[var(--color-line)] p-4 last:border-b-0 sm:last:border-b-0 ${span ? "sm:col-span-2 sm:border-r-0" : "sm:border-r border-[var(--color-line)] odd:last:border-r-0"}`}
              >
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted)]">
                  {label}
                </span>
                <DocInput
                  value={q[key] as string}
                  onChange={(v) => set(key, v)}
                  placeholder={placeholder ?? label}
                  className="text-sm"
                />
              </div>
            ))}
          </div>

          {/* Rooms */}
          {q.rooms.map((room, ri) => {
            const sub = subtotals[ri];
            return (
              <div key={room.id} className="mb-8">
                {/* Room title row */}
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-0.5 rounded-full bg-[var(--color-accent)]" />
                    <DocInput
                      value={room.name}
                      onChange={(v) => setRoomName(room.id, v)}
                      className="font-serif text-lg"
                    />
                  </div>
                  {q.rooms.length > 1 && (
                    <button
                      onClick={() => removeRoom(room.id)}
                      className="no-print flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Remove
                    </button>
                  )}
                </div>

                {/* Items table */}
                <div className="overflow-x-auto rounded-xl border border-[var(--color-line)]">
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-[var(--color-bg-soft)]">
                        <th className="w-10 border-b border-r border-[var(--color-line)] px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                          No.
                        </th>
                        <th className="border-b border-r border-[var(--color-line)] px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                          Item Description
                        </th>
                        <th className="w-16 border-b border-r border-[var(--color-line)] px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                          Qty
                        </th>
                        <th className="w-28 border-b border-r border-[var(--color-line)] px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                          Rate (Rs.)
                        </th>
                        <th className="w-28 border-b border-r border-[var(--color-line)] px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-[var(--color-muted)]">
                          Amount (Rs.)
                        </th>
                        <th className="no-print w-8 border-b border-[var(--color-line)] bg-[var(--color-bg-soft)]" />
                      </tr>
                    </thead>
                    <tbody>
                      {room.items.map((item, ii) => {
                        const amount = (Number(item.qty) || 0) * (Number(item.rate) || 0);
                        return (
                          <tr key={item.id} className="group hover:bg-[var(--color-bg)]/60">
                            <td className="border-b border-r border-[var(--color-line)] px-3 py-2.5 text-center text-[var(--color-muted)]">
                              {ii + 1}
                            </td>
                            <td className="border-b border-r border-[var(--color-line)] px-3 py-2">
                              <DocInput
                                value={item.description}
                                onChange={(v) => setItem(room.id, item.id, "description", v)}
                                placeholder="Describe the item (size, material, colour…)"
                                className="text-sm"
                              />
                            </td>
                            <td className="border-b border-r border-[var(--color-line)] px-3 py-2">
                              <DocInput
                                value={String(item.qty)}
                                onChange={(v) => setItem(room.id, item.id, "qty", Number(v) || 0)}
                                type="number"
                                align="center"
                                className="text-sm"
                              />
                            </td>
                            <td className="border-b border-r border-[var(--color-line)] px-3 py-2">
                              <DocInput
                                value={String(item.rate || "")}
                                onChange={(v) => setItem(room.id, item.id, "rate", Number(v) || 0)}
                                type="number"
                                align="right"
                                placeholder="0"
                                className="text-sm"
                              />
                            </td>
                            <td className="border-b border-r border-[var(--color-line)] px-3 py-2.5 text-right text-sm font-medium text-[var(--color-ink)]">
                              {fmt(amount)}
                            </td>
                            <td className="no-print border-b border-[var(--color-line)] px-2 py-2 text-center">
                              <button
                                onClick={() => removeItem(room.id, item.id)}
                                disabled={room.items.length === 1}
                                className="opacity-0 group-hover:opacity-100 text-[var(--color-muted)] hover:text-red-500 disabled:opacity-20 transition-all"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="bg-[var(--color-bg-soft)]/80">
                        <td
                          colSpan={4}
                          className="border-t border-r border-[var(--color-line)] px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]"
                        >
                          Subtotal — {room.name}
                        </td>
                        <td className="border-t border-r border-[var(--color-line)] px-3 py-2.5 text-right font-semibold text-[var(--color-accent)]">
                          Rs.&nbsp;{fmt(sub)}
                        </td>
                        <td className="no-print border-t border-[var(--color-line)]" />
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Add item */}
                <button
                  onClick={() => addItem(room.id)}
                  className="no-print mt-2 flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:text-[var(--color-ink)] transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Item
                </button>
              </div>
            );
          })}

          {/* Add room */}
          <div className="no-print mb-8">
            <button
              onClick={addRoom}
              className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--color-accent)]/50 px-5 py-3 text-sm text-[var(--color-accent)] hover:border-[var(--color-accent)] hover:bg-amber-50 transition-colors"
            >
              <PlusCircle className="h-4 w-4" />
              Add Room / Section
            </button>
          </div>

          {/* Grand Total */}
          <div className="mb-10 flex items-center justify-between rounded-2xl bg-[var(--color-ink)] px-6 py-5">
            <span className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60">
              Grand Total
            </span>
            <span className="font-serif text-3xl font-bold text-white">
              Rs.&nbsp;{fmt(grandTotal)}
            </span>
          </div>

          {/* Terms */}
          <div className="mb-8">
            <h3 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-[var(--color-muted)]">
              Terms &amp; Conditions
            </h3>
            <ol className="space-y-2">
              {q.terms.map((term, i) => (
                <li key={i} className="group flex items-start gap-2 text-sm">
                  <span className="mt-0.5 shrink-0 text-[var(--color-accent)] font-medium">{i + 1}.</span>
                  <DocInput
                    value={term}
                    onChange={(v) => setTerm(i, v)}
                    className="flex-1 text-sm"
                  />
                  <button
                    onClick={() => removeTerm(i)}
                    className="no-print mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 text-[var(--color-muted)] hover:text-red-500 transition-all"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ol>
            <button
              onClick={addTerm}
              className="no-print mt-2 flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-ink)] transition-colors"
            >
              <Plus className="h-3 w-3" />
              Add Term
            </button>
          </div>

          {/* Footer note */}
          <div className="border-t border-[var(--color-line)] pt-6 text-center">
            <DocInput
              value={q.notes}
              onChange={(v) => set("notes", v)}
              align="center"
              className="text-sm italic text-[var(--color-muted)] max-w-xs mx-auto"
            />
            <p className="mt-4 text-[10px] text-[var(--color-line)] tracking-wide">
              {q.companyName} · {q.companyTagline}
            </p>
          </div>
        </div>

        {/* Bottom spacer */}
        <div className="no-print h-12" />
      </div>
    </>
  );
}

"use client";

import React from "react";
import { FormResult } from "@/lib/types";

interface FormGuideProps {
    form: FormResult[];
}

export default function FormGuide({ form }: FormGuideProps) {
    if (form.length === 0) return <span style={{ color: "var(--text-muted)" }}>—</span>;

    return (
        <div style={{ display: "flex", gap: 3 }}>
            {form.map((r, i) => (
                <span
                    key={i}
                    className={`badge ${r === "W" ? "badge-win" : r === "D" ? "badge-draw" : "badge-loss"
                        }`}
                    style={{ fontSize: 10, padding: "2px 6px", minWidth: 20, textAlign: "center" }}
                >
                    {r}
                </span>
            ))}
        </div>
    );
}

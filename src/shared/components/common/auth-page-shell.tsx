"use client";

import { CheckCircle2, Dumbbell } from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

export function AuthPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <main className="mx-auto grid min-h-[calc(100vh-8rem)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,0.72fr)] lg:px-8 lg:py-16">
      <section className="relative hidden min-h-[560px] overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-lime-950 p-10 text-white shadow-2xl shadow-zinc-950/15 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 size-80 rounded-full bg-lime-300/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-20 size-72 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="relative">
          <div className="grid size-12 place-items-center rounded-2xl bg-lime-300 text-zinc-950 shadow-lg shadow-lime-500/20">
            <Dumbbell className="size-6" />
          </div>
          <p className="mt-8 text-sm font-black uppercase tracking-[0.18em] text-lime-300">
            {t("common.brand")}
          </p>
          <h2 className="mt-3 max-w-lg text-4xl font-black leading-tight tracking-tight">
            {t("auth.panelTitle")}
          </h2>
          <p className="mt-5 max-w-lg text-base leading-7 text-zinc-300">
            {t("auth.panelDescription")}
          </p>
        </div>
        <div className="relative grid gap-3">
          {["auth.benefitOne", "auth.benefitTwo", "auth.benefitThree"].map(
            (key) => (
              <div
                key={key}
                className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur"
              >
                <CheckCircle2 className="size-5 shrink-0 text-lime-300" />
                <span className="text-sm font-bold text-zinc-200">
                  {t(key)}
                </span>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="mx-auto w-full max-w-md">
        <p className="text-sm font-black uppercase tracking-[0.16em] text-orange-600">
          {t("common.brand")}
        </p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">{description}</p>
        <div className="fit-surface mt-7 p-6 sm:p-7">{children}</div>
      </section>
    </main>
  );
}

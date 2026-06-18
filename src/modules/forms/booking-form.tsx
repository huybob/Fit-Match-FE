"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { bookingTimes, trainingTypes } from "@/constants/ecommerce.constant";
import { trainers } from "@/data/mock-ecommerce.data";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/shared/components/ui/button";
import { FieldShell, inputClassName, selectClassName } from "./form-controls";
import { bookingSchema } from "./schemas";

export function BookingForm() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof bookingSchema>>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      trainerId: trainers[0].id,
      date: "2026-06-20",
      time: bookingTimes[0],
      type: trainingTypes[0],
      name: "",
      phone: "",
    },
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={form.handleSubmit(() => {
        toast({ type: "success", title: t("booking.success") });
      })}
    >
      <FieldShell label={t("booking.trainer")} error={form.formState.errors.trainerId}>
        <select className={selectClassName} {...form.register("trainerId")}>
          {trainers.map((trainer) => (
            <option key={trainer.id} value={trainer.id}>
              {trainer.name} - {trainer.specialty}
            </option>
          ))}
        </select>
      </FieldShell>
      <FieldShell label={t("booking.type")} error={form.formState.errors.type}>
        <select className={selectClassName} {...form.register("type")}>
          {trainingTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </FieldShell>
      <FieldShell label={t("booking.date")} error={form.formState.errors.date}>
        <input className={inputClassName} type="date" {...form.register("date")} />
      </FieldShell>
      <FieldShell label={t("booking.time")} error={form.formState.errors.time}>
        <select className={selectClassName} {...form.register("time")}>
          {bookingTimes.map((time) => (
            <option key={time}>{time}</option>
          ))}
        </select>
      </FieldShell>
      <FieldShell label={t("auth.name")} error={form.formState.errors.name}>
        <input className={inputClassName} {...form.register("name")} />
      </FieldShell>
      <FieldShell label={t("auth.phone")} error={form.formState.errors.phone}>
        <input className={inputClassName} {...form.register("phone")} />
      </FieldShell>
      <Button className="md:col-span-2" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t("common.loading") : t("common.confirm")}
      </Button>
    </form>
  );
}

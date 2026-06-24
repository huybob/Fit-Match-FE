"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { bookingTimes, trainingTypes } from "@/constants/ecommerce.constant";
import { trainers } from "@/data/mock-ecommerce.data";
import { useToast } from "@/lib/toast-provider";
import { Button } from "@/shared/components/ui/button";
import { DatePicker } from "@/shared/components/ui/date-picker";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { FieldShell } from "./form-controls";
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
        <Controller
          control={form.control}
          name="trainerId"
          render={({ field }) => (
            <Select value={String(field.value)} onValueChange={(v) => field.onChange(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {trainers.map((trainer) => (
                  <SelectItem key={trainer.id} value={String(trainer.id)}>
                    {trainer.name} - {trainer.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FieldShell>
      <FieldShell label={t("booking.type")} error={form.formState.errors.type}>
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {trainingTypes.map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FieldShell>
      <FieldShell label={t("booking.date")} error={form.formState.errors.date}>
        <Controller
          control={form.control}
          name="date"
          render={({ field }) => (
            <DatePicker value={field.value} onChange={field.onChange} />
          )}
        />
      </FieldShell>
      <FieldShell label={t("booking.time")} error={form.formState.errors.time}>
        <Controller
          control={form.control}
          name="time"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {bookingTimes.map((time) => (
                  <SelectItem key={time} value={time}>{time}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </FieldShell>
      <FieldShell label={t("auth.name")} error={form.formState.errors.name}>
        <Input {...form.register("name")} />
      </FieldShell>
      <FieldShell label={t("auth.phone")} error={form.formState.errors.phone}>
        <Input {...form.register("phone")} />
      </FieldShell>
      <Button className="md:col-span-2" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t("common.loading") : t("common.confirm")}
      </Button>
    </form>
  );
}

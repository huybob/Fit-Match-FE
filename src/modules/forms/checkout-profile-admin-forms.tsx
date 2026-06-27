"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useToast } from "@/lib/toast-provider";
import { Controller } from "react-hook-form";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { FieldShell } from "./form-controls";
import {
  adminPackageSchema,
  adminTrainerSchema,
  checkoutSchema,
  profileSchema,
} from "./schemas";

export function CheckoutForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof checkoutSchema>>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: { name: "", email: "", phone: "", method: "Mock Visa" },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(() =>
        toast({ type: "success", title: "Thanh toán thành công" }),
      )}
    >
      <FieldShell label="Tên" error={form.formState.errors.name}>
        <Input {...form.register("name")} />
      </FieldShell>
      <FieldShell label="Email" error={form.formState.errors.email}>
        <Input type="email" {...form.register("email")} />
      </FieldShell>
      <FieldShell label="Số điện thoại" error={form.formState.errors.phone}>
        <Input {...form.register("phone")} />
      </FieldShell>
      <FieldShell label="Phương thức thanh toán" error={form.formState.errors.method}>
        <Controller
          control={form.control}
          name="method"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Mock Visa">Mock Visa</SelectItem>
                <SelectItem value="Mock Mastercard">Mock Mastercard</SelectItem>
                <SelectItem value="Mock Momo">Mock Momo</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FieldShell>
      <Button className="w-full">Thanh toán</Button>
    </form>
  );
}

export function ProfileForm() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "Demo User",
      phone: "0900000000",
      goal: "Lose fat and build strength",
    },
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(() =>
        toast({ type: "success", title: "Cập nhật hồ sơ thành công" }),
      )}
    >
      <FieldShell label="Tên" error={form.formState.errors.name}>
        <Input {...form.register("name")} />
      </FieldShell>
      <FieldShell label="Số điện thoại" error={form.formState.errors.phone}>
        <Input {...form.register("phone")} />
      </FieldShell>
      <FieldShell label="Mục tiêu" error={form.formState.errors.goal}>
        <Input {...form.register("goal")} />
      </FieldShell>
      <Button>Lưu thay đổi</Button>
    </form>
  );
}

export function AdminPackageForm() {
  const { toast } = useToast();
  const form = useForm<z.input<typeof adminPackageSchema>>({
    resolver: zodResolver(adminPackageSchema),
    defaultValues: {
      name: "",
      price: 1000000,
      duration: "1 month",
      type: "membership",
    },
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={form.handleSubmit(() =>
        toast({ type: "success", title: "Đã lưu thay đổi" }),
      )}
    >
      <FieldShell label="Tên" error={form.formState.errors.name}>
        <Input {...form.register("name")} />
      </FieldShell>
      <FieldShell label="Giá" error={form.formState.errors.price}>
        <Input type="number" {...form.register("price")} />
      </FieldShell>
      <FieldShell label="Thời lượng" error={form.formState.errors.duration}>
        <Input {...form.register("duration")} />
      </FieldShell>
      <FieldShell label="Loại" error={form.formState.errors.type}>
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="membership">Membership</SelectItem>
                <SelectItem value="pt">PT</SelectItem>
                <SelectItem value="class">Class</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FieldShell>
      <Button className="md:col-span-2">Lưu thay đổi</Button>
    </form>
  );
}

export function AdminTrainerForm() {
  const { toast } = useToast();
  const form = useForm<z.input<typeof adminTrainerSchema>>({
    resolver: zodResolver(adminTrainerSchema),
    defaultValues: { name: "", specialty: "", experience: 3, price: 400000 },
  });

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={form.handleSubmit(() =>
        toast({ type: "success", title: "Đã lưu thay đổi" }),
      )}
    >
      <FieldShell label="Tên" error={form.formState.errors.name}>
        <Input {...form.register("name")} />
      </FieldShell>
      <FieldShell label="Chuyên môn" error={form.formState.errors.specialty}>
        <Input {...form.register("specialty")} />
      </FieldShell>
      <FieldShell label="Kinh nghiệm" error={form.formState.errors.experience}>
        <Input type="number" {...form.register("experience")} />
      </FieldShell>
      <FieldShell label="Giá" error={form.formState.errors.price}>
        <Input type="number" {...form.register("price")} />
      </FieldShell>
      <Button className="md:col-span-2">Lưu thay đổi</Button>
    </form>
  );
}

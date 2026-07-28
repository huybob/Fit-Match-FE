"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { useCreateUser } from "../hooks/use-user-hooks";

export function UserForm() {
  const createUser = useCreateUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    createUser.mutate({
      name,
      email,
      role: "USER",
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Name"
      />
      <Input
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        type="email"
      />
      <Button disabled={createUser.isPending} type="submit">
        Create user
      </Button>
    </form>
  );
}

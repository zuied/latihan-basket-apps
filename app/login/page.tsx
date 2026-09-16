"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { FieldError, Input, Label } from "@/components/ui/field";
import { loginAction, type LoginState } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    loginAction,
    {},
  );

  return (
    <main className="flex min-h-full items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="border-b-0 pb-2">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary-soft text-h3">
            🏀
          </div>
          <CardTitle className="mt-4">Aplikasi Latihan Basket</CardTitle>
          <CardDescription>
            Masuk untuk mengelola program latihan, memantau atlet, dan melacak perkembangan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="nama@basket.app"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Kata sandi</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>

            {state.error ? (
              <Alert tone="danger" title="Gagal masuk">
                {state.error}
              </Alert>
            ) : null}

            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending ? "Memproses..." : "Masuk"}
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-neutral-soft p-4 text-tiny text-ink-soft">
            <p className="font-semibold text-ink">Akun demo (sandi: rahasia123):</p>
            <ul className="mt-1.5 space-y-0.5">
              <li>Pelatih — coach@basket.app</li>
              <li>Atlet — raka@basket.app</li>
              <li>Orang tua — sari@basket.app</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
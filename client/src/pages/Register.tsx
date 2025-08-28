import { useState } from "react";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Register() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [userType, setUserType] = useState<"customer" | "business">("customer");

  const registerMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/auth/fake-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, userType }),
      });
      return res.json();
    },
    onSuccess: () => {
      alert(`Welcome to Prebucks! You're now registered as a ${userType}.`);
      setLocation(userType === "customer" ? "/customer-dashboard" : "/merchant-dashboard");
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-amber-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Prebucks</CardTitle>
          <CardDescription>Start earning Bucks and supporting local businesses</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
            </div>
            <div className="flex items-center gap-2">
              <Button variant={userType === "customer" ? "default" : "outline"} onClick={() => setUserType("customer")}>I'm a customer</Button>
              <Button variant={userType === "business" ? "default" : "outline"} onClick={() => setUserType("business")}>I'm a business</Button>
            </div>
            <Button className="w-full" onClick={() => registerMutation.mutate()} disabled={!email || registerMutation.isPending}>
              {registerMutation.isPending ? "Registering..." : "Continue"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
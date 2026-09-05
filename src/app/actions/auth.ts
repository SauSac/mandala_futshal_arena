"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function registerPlayer(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim();
  const paymentMethod = String(formData.get("paymentMethod") || "offline");

  if (!email || !password || !fullName) {
    return {
      error: "Please fill in all required fields.",
    };
  }

  if (paymentMethod !== "online" && paymentMethod !== "offline") {
    return {
      error: "Invalid payment method.",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        payment_method: paymentMethod,
      },
    },
  });

  if (error || !data.user) {
    return {
      error: error?.message || "Failed to create account.",
    };
  }

  redirect("/dashboard?registered=pending");
}

export async function loginPlayer(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return {
      error: "Please enter both email and password.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      error: error.message,
    };
  }

  redirect("/dashboard");
}
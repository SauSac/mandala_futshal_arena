"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";

type CreatePlayerState = {
  success: boolean;
  error: string;
  userId: string | null;
};

// Developer login
export async function loginDeveloper(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    });

  if (authError || !authData.user) {
    return {
      error: authError?.message || "Invalid login credentials.",
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", authData.user.id)
    .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "developer" ||
    profile.is_suspended
  ) {
    await supabase.auth.signOut();

    return {
      error: "Access denied. Authorized developer account required.",
    };
  }

  redirect("/developer/dashboard");
}

// Create player directly from Developer dashboard
export async function createPlayerByDeveloper(
  _prevState: CreatePlayerState,
  formData: FormData
): Promise<CreatePlayerState> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const fullName = String(formData.get("fullName") || "").trim();

  if (!email || !password || !fullName) {
    return {
      success: false,
      error: "All fields are required.",
      userId: null,
    };
  }

  if (password.length < 6) {
    return {
      success: false,
      error: "Password must be at least 6 characters.",
      userId: null,
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "You must be logged in.",
      userId: null,
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", user.id)
    .single();

  if (
    profileError ||
    !profile ||
    profile.role !== "developer" ||
    profile.is_suspended
  ) {
    return {
      success: false,
      error: "Unauthorized. Developer access required.",
      userId: null,
    };
  }

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: fullName,
    },
  });

  if (error || !data.user) {
    return {
      success: false,
      error: error?.message || "Failed to create player.",
      userId: null,
    };
  }

  return {
    success: true,
    error: "",
    userId: data.user.id,
  };
}

// Approve/reject player registration
export async function updateRegistrationStatus(
  registrationId: string,
  status: "approved" | "rejected"
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/developer/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_suspended")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    profile.role !== "developer" ||
    profile.is_suspended
  ) {
    redirect("/developer/login");
  }

  const updateData: {
    payment_status: "approved" | "rejected";
    approved_by?: string | null;
    approved_at?: string | null;
    starts_at?: string | null;
    expires_at?: string | null;
  } = {
    payment_status: status,
  };

  if (status === "approved") {
    const startsAt = new Date();
    const expiresAt = new Date(startsAt);

    expiresAt.setMonth(expiresAt.getMonth() + 1);

    updateData.approved_by = user.id;
    updateData.approved_at = startsAt.toISOString();
    updateData.starts_at = startsAt.toISOString();
    updateData.expires_at = expiresAt.toISOString();
  } else {
    updateData.approved_by = user.id;
    updateData.approved_at = new Date().toISOString();
    updateData.starts_at = null;
    updateData.expires_at = null;
  }

  const { error } = await supabase
    .from("player_registrations")
    .update(updateData)
    .eq("id", registrationId)
    .eq("payment_status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  redirect("/developer/dashboard");
}
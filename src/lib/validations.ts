import { z } from "zod";
import { isReservedHandle } from "@/lib/reserved-handles";

/** 3-30 chars, lowercase alphanumeric + hyphen, not in the reserved list. */
export const handleSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Handle must be at least 3 characters.")
  .max(30, "Handle must be at most 30 characters.")
  .regex(
    /^[a-z0-9-]+$/,
    "Only lowercase letters, numbers, and hyphens are allowed.",
  )
  .refine((h) => !h.startsWith("-") && !h.endsWith("-"), {
    message: "Handle cannot start or end with a hyphen.",
  })
  .refine((h) => !isReservedHandle(h), {
    message: "That handle is reserved. Please choose another.",
  });

export const claimHandleSchema = z.object({
  handle: handleSchema,
});

export const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const profileSchema = z.object({
  display_name: z
    .string()
    .trim()
    .max(80, "Display name must be at most 80 characters.")
    .optional()
    .or(z.literal("")),
  bio: z
    .string()
    .trim()
    .max(300, "Bio must be at most 300 characters.")
    .optional()
    .or(z.literal("")),
});

export const linkSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(120, "Title must be at most 120 characters."),
  url: z
    .string()
    .trim()
    .min(1, "URL is required.")
    .max(2048, "URL is too long."),
});

export const reorderSchema = z.object({
  orderedIds: z.array(z.string().uuid()).max(500),
});

/**
 * Shape-only check for the socials payload. Platform validity and url/email
 * format are enforced by normalizeSocial() in src/lib/socials.ts, which also
 * cleans each entry before it is persisted.
 */
export const socialsSchema = z
  .array(
    z.object({
      platform: z.string().max(40),
      url: z.string().max(400),
    }),
  )
  .max(12);

export type ClaimHandleInput = z.infer<typeof claimHandleSchema>;
export type CredentialsInput = z.infer<typeof credentialsSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;
export type LinkInput = z.infer<typeof linkSchema>;

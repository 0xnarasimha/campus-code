// Shared profile validation (no "use server"): imported by the server
// action and mirrored by the client modal, so both enforce the same
// regex and bounds.

export const HANDLE_RE = /^[A-Za-z0-9_]{3,20}$/;
export const MAX_NAME = 50;
export const MAX_BIO = 160;
export const MAX_YEAR = 10;
export const MAX_BRANCH = 50;

export interface ProfileInput {
  handle?: string;
  name?: string;
  bio?: string;
  year?: string;
  branch?: string;
}

export type ProfilePatch = {
  handle?: string;
  name?: string;
  bio?: string;
  year?: string;
  branch?: string;
};

export function validateProfileInput(input: ProfileInput):
  | { ok: true; patch: ProfilePatch }
  | { ok: false; error: string } {
  const patch: ProfilePatch = {};
  let touched = false;

  if (input.handle !== undefined) {
    touched = true;
    const handle = input.handle.trim();
    if (!HANDLE_RE.test(handle)) {
      return {
        ok: false,
        error: "Handle must be 3-20 characters: letters, numbers, underscores.",
      };
    }
    patch.handle = handle;
  }
  if (input.name !== undefined) {
    touched = true;
    const name = input.name.trim();
    if (name.length < 1 || name.length > MAX_NAME) {
      return { ok: false, error: "Name must be 1-50 characters." };
    }
    patch.name = name;
  }
  if (input.bio !== undefined) {
    touched = true;
    const bio = input.bio.trim();
    if (bio.length > MAX_BIO) {
      return {
        ok: false,
        error: `Bio must be at most ${MAX_BIO} characters.`,
      };
    }
    patch.bio = bio;
  }
  if (input.year !== undefined) {
    touched = true;
    const year = input.year.trim();
    if (year.length > MAX_YEAR) {
      return {
        ok: false,
        error: `Year must be at most ${MAX_YEAR} characters.`,
      };
    }
    patch.year = year;
  }
  if (input.branch !== undefined) {
    touched = true;
    const branch = input.branch.trim();
    if (branch.length > MAX_BRANCH) {
      return {
        ok: false,
        error: `Branch must be at most ${MAX_BRANCH} characters.`,
      };
    }
    patch.branch = branch;
  }

  if (!touched) return { ok: false, error: "Nothing to update." };
  return { ok: true, patch };
}

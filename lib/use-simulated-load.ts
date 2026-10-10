"use client";

import { useEffect, useState } from "react";

export function useSimulatedLoad(delay = 800): boolean {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return loading;
}

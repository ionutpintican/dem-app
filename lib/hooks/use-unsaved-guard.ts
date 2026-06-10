import { useEffect } from "react";

// Afișează prompt-ul nativ al browserului la închiderea tabului / navigare
// cât timp există modificări nesalvate (active = true).
export function useUnsavedGuard(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome cere returnValue setat pentru a afișa promptul
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);
}

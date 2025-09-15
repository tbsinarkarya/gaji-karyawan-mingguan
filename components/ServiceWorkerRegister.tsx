"use client";
import { useEffect } from "react";

const ServiceWorkerRegister = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => {
          console.warn("SW registration failed:", err);
        });
    };

    // Some browsers require registration after load
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      window.removeEventListener("load", register as any);
    };
  }, []);

  return null;
};

export default ServiceWorkerRegister;


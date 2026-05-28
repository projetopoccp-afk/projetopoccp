"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function SupabaseTest() {
  const [status, setStatus] = useState("Testando conexão...");

  useEffect(() => {
    async function testConnection() {
      const { error } = await supabase.from("creator_profiles").select("id").limit(1);

      if (error) {
        setStatus(`Erro: ${error.message}`);
        return;
      }

      setStatus("Supabase conectado com sucesso ✅");
    }

    testConnection();
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 rounded-full border border-cyan-300/20 bg-black/80 px-4 py-2 text-xs text-cyan-100 backdrop-blur">
      {status}
    </div>
  );
}
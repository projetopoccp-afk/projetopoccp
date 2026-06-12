"use client";

import { Loader2, Save, X as XIcon } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";

type FloatingProfileSaveBarProps = {
  error?: string | null;
  isSaving: boolean;
  onCancel: () => void;
  onSave: () => void;
};

export function FloatingProfileSaveBar({
  error,
  isSaving,
  onCancel,
  onSave,
}: FloatingProfileSaveBarProps) {
  const { t } = useLanguage();

  return (
    <div className="fixed inset-x-0 bottom-4 z-[80] px-4 sm:bottom-6">
      <div className="mx-auto flex max-w-3xl flex-col gap-4 rounded-[1.7rem] border border-cyan-300/20 bg-[#020617]/90 p-4 shadow-2xl shadow-cyan-500/20 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-black text-white">
            {translate(
              t,
              "creatorProfileUnsavedChanges",
              "Alterações não salvas",
            )}
          </p>

          <p className="mt-1 text-xs leading-5 text-white/50">
            {translate(
              t,
              "creatorProfileUnsavedChangesDescription",
              "Salve para publicar as mudanças no perfil ou cancele para voltar ao modo de visualização.",
            )}
          </p>

          {error ? (
            <p className="mt-2 text-xs font-bold text-red-200">{error}</p>
          ) : null}
        </div>

        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-black text-white/70 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <XIcon className="h-4 w-4" />
            {translate(t, "creatorProfileCancelEdit", "Cancelar")}
          </button>

          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/15 px-5 py-3 text-sm font-black text-cyan-50 shadow-lg shadow-cyan-500/10 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {translate(t, "creatorProfileSaveEdit", "Salvar")}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Send } from "lucide-react";

import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/lib/supabase/client";
import { translate } from "@/lib/i18n/translate";
import {
  getSupportStatusLabel,
  getSupportTypeLabel,
  isSupportConversationFinal,
  SUPPORT_CONVERSATION_TYPES,
  translateExisting,
  type SupportConversationRow,
  type SupportConversationType,
  type SupportMessageRow,
} from "./creator-profile-shared";

type SupportChatModalProps = {
  open: boolean;
  onClose: () => void;
  currentUserId: string | null;
  creatorId: string;
  creatorName: string;
};

export function SupportChatModal({
  open,
  onClose,
  currentUserId,
  creatorId,
  creatorName,
}: SupportChatModalProps) {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState<SupportConversationRow[]>(
    [],
  );
  const [messages, setMessages] = useState<SupportMessageRow[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(null);
  const [creating, setCreating] = useState(false);
  const [selectedType, setSelectedType] =
    useState<SupportConversationType>("profile_correction");
  const [subject, setSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [reply, setReply] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedConversation =
    conversations.find(
      (conversation) => conversation.id === selectedConversationId,
    ) || null;

  async function loadConversations() {
    if (!currentUserId || !creatorId) return;
    setLoading(true);
    const { data } = await supabase
      .from("support_conversations")
      .select("*")
      .eq("user_id", currentUserId)
      .eq("creator_id", creatorId)
      .order("last_message_at", { ascending: false });

    const rows = (data || []) as SupportConversationRow[];
    setConversations(rows);
    setSelectedConversationId((current) => current || rows[0]?.id || null);
    setCreating(rows.length === 0);
    setLoading(false);
  }

  async function loadMessages(conversationId: string | null) {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    const { data } = await supabase
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    setMessages((data || []) as SupportMessageRow[]);
  }

  useEffect(() => {
    if (open) {
      loadConversations();
    }
  }, [open, currentUserId, creatorId]);

  useEffect(() => {
    if (open) {
      loadMessages(selectedConversationId);
    }
  }, [open, selectedConversationId]);

  async function handleCreateConversation() {
    if (!currentUserId || !creatorId || !newMessage.trim()) return;

    setSaving(true);
    const cleanSubject =
      subject.trim() ||
      `${getSupportTypeLabel(t, selectedType)} - ${creatorName}`;
    const { data: conversation, error } = await supabase
      .from("support_conversations")
      .insert({
        user_id: currentUserId,
        creator_id: creatorId,
        type: selectedType,
        subject: cleanSubject,
        status: "open",
        priority: "normal",
      })
      .select("*")
      .single();

    if (!error && conversation?.id) {
      await supabase.from("support_messages").insert({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        sender_role: "user",
        message: newMessage.trim(),
      });

      setSubject("");
      setNewMessage("");
      setCreating(false);
      setSelectedConversationId(conversation.id);
      await loadConversations();
      await loadMessages(conversation.id);
    }

    setSaving(false);
  }

  async function handleSendReply() {
    if (!currentUserId || !selectedConversation || !reply.trim()) return;
    if (isSupportConversationFinal(selectedConversation.status)) return;

    setSaving(true);
    await supabase.from("support_messages").insert({
      conversation_id: selectedConversation.id,
      sender_id: currentUserId,
      sender_role: "user",
      message: reply.trim(),
    });
    setReply("");
    await loadConversations();
    await loadMessages(selectedConversation.id);
    setSaving(false);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-xl">
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0"
        aria-label={translate(t, "close", "Fechar")}
      />

      <div className="relative grid h-[82vh] w-full max-w-5xl overflow-hidden rounded-[2rem] border border-cyan-300/20 bg-[#020617] text-white shadow-[0_0_90px_rgba(34,211,238,0.16)] lg:grid-cols-[310px_minmax(0,1fr)]">
        <div className="border-b border-white/10 bg-white/[0.035] p-5 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-100/70">
                {translateExisting(t, "supportCardpocTeam", "Equipe Cardpoc")}
              </p>
              <h3 className="mt-2 text-xl font-black">
                {translateExisting(t, "supportConversations", "Conversas")}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/70 transition hover:bg-white/10"
            >
              {translate(t, "close", "Fechar")}
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setSelectedConversationId(null);
              setMessages([]);
            }}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/15 px-4 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-300/25"
          >
            <Plus className="h-4 w-4" />
            {translateExisting(t, "supportNewConversation", "Nova conversa")}
          </button>

          <div className="no-scrollbar mt-5 flex max-h-[56vh] flex-col gap-3 overflow-y-auto pr-1">
            {loading ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/50">
                {translateExisting(
                  t,
                  "supportLoading",
                  "Carregando conversas...",
                )}
              </div>
            ) : null}

            {!loading && conversations.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-white/55">
                {translateExisting(
                  t,
                  "supportEmpty",
                  "Você ainda não abriu nenhuma conversa sobre este perfil.",
                )}
              </div>
            ) : null}

            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                type="button"
                onClick={() => {
                  setCreating(false);
                  setSelectedConversationId(conversation.id);
                }}
                className={`rounded-2xl border p-4 text-left transition ${
                  selectedConversationId === conversation.id && !creating
                    ? "border-cyan-300/35 bg-cyan-300/10"
                    : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 text-sm font-black text-white">
                    {conversation.subject}
                  </p>
                  <span className="shrink-0 rounded-full border border-white/10 bg-black/25 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                    {getSupportStatusLabel(t, conversation.status)}
                  </span>
                </div>
                <p className="mt-2 text-xs font-bold text-cyan-100/70">
                  {getSupportTypeLabel(t, conversation.type)}
                </p>
              </button>
            ))}
          </div>
        </div>

        <div className="flex min-h-0 flex-col">
          <div className="border-b border-white/10 p-5">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-white/40">
              {creatorName}
            </p>
            <h4 className="mt-1 text-lg font-black">
              {creating
                ? translateExisting(
                    t,
                    "supportStartConversation",
                    "Abrir conversa",
                  )
                : selectedConversation?.subject ||
                  translateExisting(
                    t,
                    "supportSelectConversation",
                    "Selecione uma conversa",
                  )}
            </h4>
          </div>

          {creating ? (
            <div className="no-scrollbar flex-1 overflow-y-auto p-5">
              <div className="grid gap-4">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {SUPPORT_CONVERSATION_TYPES.map((type) => (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setSelectedType(type.id)}
                      className={`rounded-2xl border px-4 py-3 text-left text-sm font-black transition ${
                        selectedType === type.id
                          ? "border-cyan-300/35 bg-cyan-300/15 text-cyan-50"
                          : "border-white/10 bg-white/[0.035] text-white/60 hover:bg-white/[0.06]"
                      }`}
                    >
                      {translateExisting(t, type.labelKey, type.fallback)}
                    </button>
                  ))}
                </div>

                <input
                  value={subject}
                  onChange={(event) => setSubject(event.target.value)}
                  placeholder={translateExisting(
                    t,
                    "supportSubjectPlaceholder",
                    "Assunto da conversa",
                  )}
                  className="rounded-[1.2rem] border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/40"
                />

                <textarea
                  value={newMessage}
                  onChange={(event) => setNewMessage(event.target.value)}
                  placeholder={translateExisting(
                    t,
                    "supportMessagePlaceholder",
                    "Explique o que aconteceu ou o que precisa ser ajustado...",
                  )}
                  rows={7}
                  className="rounded-[1.2rem] border border-white/10 bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/40"
                />

                <button
                  type="button"
                  onClick={handleCreateConversation}
                  disabled={saving || !newMessage.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/15 px-5 py-3 text-sm font-black text-cyan-50 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  {translateExisting(
                    t,
                    "supportSendToTeam",
                    "Enviar para a equipe",
                  )}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="no-scrollbar flex-1 space-y-4 overflow-y-auto p-5">
                {messages.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 text-sm text-white/50">
                    {translateExisting(
                      t,
                      "supportNoMessages",
                      "Nenhuma mensagem nesta conversa.",
                    )}
                  </div>
                ) : null}

                {messages.map((message) => {
                  const isUser = message.sender_role === "user";
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[82%] rounded-[1.35rem] border px-4 py-3 ${
                          isUser
                            ? "border-cyan-300/25 bg-cyan-300/15 text-cyan-50"
                            : "border-white/10 bg-white/[0.055] text-white/75"
                        }`}
                      >
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45">
                          {isUser
                            ? translateExisting(t, "supportYou", "Você")
                            : translateExisting(
                                t,
                                "supportTeam",
                                "Equipe Cardpoc",
                              )}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-white/10 p-4">
                {selectedConversation &&
                isSupportConversationFinal(selectedConversation.status) ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white/55">
                    {translateExisting(
                      t,
                      "supportClosedConversation",
                      "Esta conversa foi finalizada pela equipe Cardpoc. Abra uma nova conversa se precisar continuar o assunto.",
                    )}
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <textarea
                      value={reply}
                      onChange={(event) => setReply(event.target.value)}
                      placeholder={translateExisting(
                        t,
                        "supportReplyPlaceholder",
                        "Escreva uma resposta...",
                      )}
                      rows={2}
                      className="min-h-[48px] flex-1 resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/40"
                    />
                    <button
                      type="button"
                      onClick={handleSendReply}
                      disabled={
                        saving || !reply.trim() || !selectedConversation
                      }
                      className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-300/15 text-cyan-50 transition hover:bg-cyan-300/25 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}


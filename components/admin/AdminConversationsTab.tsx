"use client";

import {
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Eye,
  EyeOff,
  Gift,
  Handshake,
  History,
  ImageIcon,
  Link,
  MessageCircle,
  Send,
  Ban,
  BarChart3,
  RotateCcw,
  Package,
  Search,
  Upload,
  ShieldCheck,
  UserCog,
  X,
} from "lucide-react";

import {
  ACTIVE_SUPPORT_STATUSES,
  ADMIN_PACK_TYPES,
  FINAL_SUPPORT_STATUSES,
  GRANT_RARITIES,
  PARTNERSHIP_TYPE_OPTIONS,
  SUPPORT_STATUS_FILTERS,
  EmptyBox,
  InfoBox,
  SearchInput,
  SmallInfo,
  StatCard,
  StatusPill,
  UserInfo,
  getAdminPackLabel,
  getGrantRarityLabel,
  getPartnershipTypeLabel,
  isSupportConversationFinal,
  translate,
  translateExisting,
  getSupportStatusLabel,
  getSupportTypeLabel,
} from "./admin-panel-shared";
import type { CreatorProfileOwnerFilter, CreatorProfileSortFilter, CreatorProfileVerificationFilter, CreatorProfileVisibilityFilter, SupportConversationStatus, TranslationKey } from "./admin-panel-shared";


type AdminTabProps = {
  ctx: Record<string, any>;
};

export function AdminConversationsTab({ ctx }: AdminTabProps) {
  const {
    actionLoading,
    activeSupportConversationCount,
    activeTab,
    adminCardQuantity,
    adminPackQuantity,
    adminRewardTarget,
    adminRewardType,
    approveClaim,
    approvePartnership,
    approveRequest,
    brandEnrichmentConfidence,
    brandEnrichmentLoading,
    brandEnrichmentSource,
    bulkUpdateFilteredCreators,
    cardCreatorSearch,
    cardUserSearch,
    changeCreatorOwner,
    claimSearch,
    claims,
    closeCreatorImageEditor,
    conversationReply,
    conversationSearch,
    conversationStatusCounts,
    conversationStatusFilter,
    createAdminLog,
    creatorDetectorPlatform,
    creatorOwnerFilter,
    creatorProfileStats,
    creatorSearch,
    creatorSortFilter,
    creatorVerificationFilter,
    creatorVisibilityFilter,
    creators,
    creatorsById,
    dateLocale,
    detectKickCreators,
    detectYouTubePartnerships,
    detectedKickCreators,
    enrichBrand,
    expandedClaims,
    expandedCreators,
    expandedLogs,
    expandedPartnerships,
    expandedRequests,
    filteredCardCreators,
    filteredCardUsers,
    filteredClaims,
    filteredCreators,
    filteredDetectedKickCreators,
    filteredLogs,
    filteredPartnerships,
    filteredRequests,
    filteredSupportConversations,
    filteredUsers,
    getAdminRewardTargets,
    getCreator,
    getCreatorDetectorPlatformLabel,
    getCurrentUserId,
    getDetectedKickKey,
    getFriendlyLogTitle,
    getNameSimilarity,
    getOwner,
    getPossibleCreatorMatches,
    getProfileDisplayName,
    getSafeQuantity,
    getTabCounter,
    grantCardToUser,
    grantPackToUser,
    hasCreatorProfileFilters,
    hideRegisteredDetectorCreators,
    imageEditorCreator,
    imageEditorFile,
    imageEditorObjectUrl,
    imageEditorUrl,
    importSelectedKickCreators,
    kickDetectorCategory,
    kickDetectorLanguage,
    kickDetectorLimit,
    kickDetectorMinViewers,
    kickDetectorSearch,
    language,
    linkDetectedCreatorToExisting,
    linkingDetectedCreatorKey,
    loadClaims,
    loadCreators,
    loadLogs,
    loadPanel,
    loadPartnerships,
    loadRequests,
    loadStats,
    loadSupportConversations,
    loadSupportMessages,
    loadUsers,
    loading,
    logSearch,
    logs,
    normalizeDetectorCompare,
    onClose,
    openCreatorImageEditor,
    openPartnershipApproval,
    partnershipApprovalDraft,
    partnershipSearch,
    partnerships,
    rejectClaim,
    rejectPartnership,
    rejectRequest,
    removeCreatorOwner,
    requestSearch,
    requests,
    saveCreatorImage,
    selectedAdminPackType,
    selectedCardCreator,
    selectedCardCreatorId,
    selectedCardUser,
    selectedCardUserId,
    selectedConversationId,
    selectedDetectedKickCreators,
    selectedGrantRarity,
    selectedKickCreatorsCount,
    selectedOwners,
    selectedSupportConversation,
    sendSupportReply,
    setActionLoading,
    setActiveTab,
    setAdminCardQuantity,
    setAdminPackQuantity,
    setAdminRewardTarget,
    setAdminRewardType,
    setBrandEnrichmentConfidence,
    setBrandEnrichmentLoading,
    setBrandEnrichmentSource,
    setCardCreatorSearch,
    setCardUserSearch,
    setClaimSearch,
    setClaims,
    setConversationReply,
    setConversationSearch,
    setConversationStatusFilter,
    setCreatorDetectorPlatform,
    setCreatorOwnerFilter,
    setCreatorSearch,
    setCreatorSortFilter,
    setCreatorVerificationFilter,
    setCreatorVisibilityFilter,
    setCreators,
    setDetectedKickCreators,
    setExpandedClaims,
    setExpandedCreators,
    setExpandedLogs,
    setExpandedPartnerships,
    setExpandedRequests,
    setHideRegisteredDetectorCreators,
    setImageEditorCreator,
    setImageEditorFile,
    setImageEditorObjectUrl,
    setImageEditorUrl,
    setKickDetectorCategory,
    setKickDetectorLanguage,
    setKickDetectorLimit,
    setKickDetectorMinViewers,
    setKickDetectorSearch,
    setLinkingDetectedCreatorKey,
    setLoading,
    setLogSearch,
    setLogs,
    setPartnershipApprovalDraft,
    setPartnershipSearch,
    setPartnerships,
    setRequestSearch,
    setRequests,
    setSelectedAdminPackType,
    setSelectedCardCreatorId,
    setSelectedCardUserId,
    setSelectedConversationId,
    setSelectedDetectedKickCreators,
    setSelectedGrantRarity,
    setSelectedOwners,
    setStats,
    setSuccessToast,
    setSupportConversations,
    setSupportMessages,
    setUserCardsCount,
    setUserSearch,
    setUsers,
    showAdminSuccess,
    stats,
    successToast,
    supportConversations,
    supportMessages,
    t,
    toggleAdmin,
    toggleCreatorPublic,
    toggleCreatorVerified,
    toggleDetectedKickCreator,
    toggleUserBan,
    updatePartnershipApprovalDraft,
    updateSupportConversationStatus,
    userCardsCount,
    userSearch,
    users,
    usersById
  } = ctx;

  return (
    <div className="mt-8">
                  <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-cyan-100">
                          <MessageCircle size={14} />
                          {translate(t, "adminConversations", "Conversas")}
                        </div>

                        <h3 className="mt-4 text-2xl font-black text-white">
                          {translate(
                            t,
                            "adminConversationsTitle",
                            "Central de conversas",
                          )}
                        </h3>

                        <p className="mt-2 max-w-2xl text-sm text-white/50">
                          {translate(
                            t,
                            "adminConversationsDescription",
                            "Acompanhe chamados dos criadores em formato de chat, altere status e responda sem sair do painel.",
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <StatusPill
                          label={`${activeSupportConversationCount} ${translateExisting(t, "adminActiveConversations", "ativas")}`}
                          tone="cyan"
                        />
                        <StatusPill
                          label={`${conversationStatusCounts.waiting_admin} ${translate(t, "adminNeedReply", "aguardando equipe")}`}
                          tone={
                            conversationStatusCounts.waiting_admin > 0
                              ? "yellow"
                              : "default"
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 lg:grid-cols-[360px_1fr]">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                      <SearchInput
                        value={conversationSearch}
                        onChange={setConversationSearch}
                        placeholder={translate(
                          t,
                          "adminSearchConversationsPlaceholder",
                          "Buscar por usuário, assunto, tipo ou perfil...",
                        )}
                      />

                      <div className="mt-4 flex flex-wrap gap-2">
                        {SUPPORT_STATUS_FILTERS.map((filter) => {
                          const selected = conversationStatusFilter === filter.id;
                          const count = conversationStatusCounts[filter.id];

                          return (
                            <button
                              key={filter.id}
                              type="button"
                              onClick={() => setConversationStatusFilter(filter.id)}
                              className={`inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition ${
                                selected
                                  ? "border-cyan-300/60 bg-cyan-300 text-black"
                                  : "border-white/10 bg-black/20 text-white/60 hover:bg-white/[0.06] hover:text-white"
                              }`}
                            >
                              {translateExisting(
                                t,
                                filter.labelKey,
                                filter.fallback,
                              )}
                              <span
                                className={`rounded-full px-2 py-0.5 text-[10px] ${
                                  selected
                                    ? "bg-black/15 text-black"
                                    : "bg-white/10 text-white/60"
                                }`}
                              >
                                {count}
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-4 grid max-h-[560px] gap-3 overflow-y-auto pr-1">
                        {filteredSupportConversations.length === 0 && (
                          <EmptyBox
                            text={translate(
                              t,
                              "adminNoConversationsFound",
                              "Nenhuma conversa encontrada para este filtro.",
                            )}
                          />
                        )}

                        {filteredSupportConversations.map((conversation) => {
                          const owner = getOwner(conversation.user_id);
                          const creator = getCreator(conversation.creator_id);
                          const selected =
                            selectedSupportConversation?.id === conversation.id;
                          const statusTone =
                            conversation.status === "closed"
                              ? "default"
                              : conversation.status === "resolved"
                                ? "green"
                                : conversation.status === "waiting_admin"
                                  ? "yellow"
                                  : conversation.status === "waiting_user"
                                    ? "cyan"
                                    : "cyan";

                          return (
                            <button
                              key={conversation.id}
                              type="button"
                              onClick={() =>
                                setSelectedConversationId(conversation.id)
                              }
                              className={`rounded-3xl border p-4 text-left transition ${
                                selected
                                  ? "border-cyan-300/60 bg-cyan-300/10"
                                  : "border-white/10 bg-black/20 hover:bg-white/[0.05]"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-black text-white">
                                    {conversation.subject}
                                  </p>
                                  <p className="mt-1 truncate text-xs text-white/45">
                                    {owner?.display_name ||
                                      owner?.username ||
                                      owner?.email ||
                                      translate(t, "user", "Usuário")}
                                  </p>
                                </div>

                                <StatusPill
                                  label={getSupportStatusLabel(
                                    t,
                                    conversation.status,
                                  )}
                                  tone={statusTone}
                                />
                              </div>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <StatusPill
                                  label={getSupportTypeLabel(t, conversation.type)}
                                  tone="default"
                                />
                                {creator && (
                                  <StatusPill
                                    label={`@${creator.username}`}
                                    tone="cyan"
                                  />
                                )}
                              </div>

                              <p className="mt-3 text-xs text-white/35">
                                {new Date(
                                  conversation.last_message_at ||
                                    conversation.created_at,
                                ).toLocaleString(dateLocale)}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="min-h-[620px] rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                      {!selectedSupportConversation ? (
                        <div className="flex h-full min-h-[520px] items-center justify-center">
                          <EmptyBox
                            text={translate(
                              t,
                              "adminSelectConversation",
                              "Selecione uma conversa para visualizar o histórico.",
                            )}
                          />
                        </div>
                      ) : (
                        <div className="flex h-full min-h-[560px] flex-col">
                          <div className="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <StatusPill
                                  label={getSupportTypeLabel(
                                    t,
                                    selectedSupportConversation.type,
                                  )}
                                  tone="cyan"
                                />
                                <StatusPill
                                  label={getSupportStatusLabel(
                                    t,
                                    selectedSupportConversation.status,
                                  )}
                                  tone={
                                    selectedSupportConversation.status === "closed"
                                      ? "default"
                                      : selectedSupportConversation.status ===
                                          "resolved"
                                        ? "green"
                                        : selectedSupportConversation.status ===
                                            "waiting_admin"
                                          ? "yellow"
                                          : "cyan"
                                  }
                                />
                              </div>

                              <h3 className="mt-3 text-2xl font-black text-white">
                                {selectedSupportConversation.subject}
                              </h3>

                              <p className="mt-2 text-sm text-white/45">
                                {(() => {
                                  const owner = getOwner(
                                    selectedSupportConversation.user_id,
                                  );
                                  const creator = getCreator(
                                    selectedSupportConversation.creator_id,
                                  );
                                  const ownerText =
                                    owner?.display_name ||
                                    owner?.username ||
                                    owner?.email ||
                                    translate(t, "user", "Usuário");
                                  const creatorText = creator
                                    ? ` • ${creator.nickname} (@${creator.username})`
                                    : "";
                                  return `${ownerText}${creatorText}`;
                                })()}
                              </p>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                              <select
                                value={selectedSupportConversation.status}
                                onChange={(event) =>
                                  updateSupportConversationStatus(
                                    selectedSupportConversation.id,
                                    event.target.value as SupportConversationStatus,
                                  )
                                }
                                disabled={
                                  actionLoading === selectedSupportConversation.id
                                }
                                className="rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-bold text-white outline-none transition focus:border-cyan-300/50"
                              >
                                {SUPPORT_STATUS_FILTERS.filter(
                                  (filter) => filter.id !== "all",
                                ).map((filter) => (
                                  <option
                                    key={filter.id}
                                    value={filter.id}
                                    className="bg-zinc-950 text-white"
                                  >
                                    {translateExisting(
                                      t,
                                      filter.labelKey,
                                      filter.fallback,
                                    )}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="mt-5 flex-1 space-y-4 overflow-y-auto pr-1">
                            {supportMessages.length === 0 && (
                              <EmptyBox
                                text={translate(
                                  t,
                                  "adminNoConversationMessages",
                                  "Nenhuma mensagem encontrada nesta conversa.",
                                )}
                              />
                            )}

                            {supportMessages.map((message) => {
                              const isAdminMessage =
                                message.sender_role === "admin";
                              const isSystemMessage =
                                message.sender_role === "system";

                              if (isSystemMessage) {
                                return (
                                  <div
                                    key={message.id}
                                    className="flex justify-center"
                                  >
                                    <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs text-white/45">
                                      {message.message}
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div
                                  key={message.id}
                                  className={`flex ${isAdminMessage ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`max-w-[78%] rounded-3xl border px-4 py-3 ${
                                      isAdminMessage
                                        ? "border-cyan-300/30 bg-cyan-300/10 text-cyan-50"
                                        : "border-white/10 bg-black/30 text-white/80"
                                    }`}
                                  >
                                    <div className="mb-2 flex items-center justify-between gap-4 text-[11px] uppercase tracking-[0.2em] text-white/35">
                                      <span>
                                        {isAdminMessage
                                          ? translate(
                                              t,
                                              "adminTeamCardpoc",
                                              "Equipe Cardpoc",
                                            )
                                          : translate(t, "user", "Usuário")}
                                      </span>
                                      <span>
                                        {new Date(
                                          message.created_at,
                                        ).toLocaleString(dateLocale)}
                                      </span>
                                    </div>

                                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                                      {message.message}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-5 border-t border-white/10 pt-4">
                            {isSupportConversationFinal(
                              selectedSupportConversation.status,
                            ) ? (
                              <div className="rounded-3xl border border-white/10 bg-black/30 p-4 text-sm text-white/45">
                                {translate(
                                  t,
                                  "adminClosedConversationHint",
                                  "Esta conversa foi finalizada. Reabra alterando o status para Aberto/Aguardando antes de responder.",
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-3 md:flex-row">
                                <textarea
                                  value={conversationReply}
                                  onChange={(event) =>
                                    setConversationReply(event.target.value)
                                  }
                                  rows={3}
                                  placeholder={translate(
                                    t,
                                    "adminConversationReplyPlaceholder",
                                    "Escreva sua resposta para o criador...",
                                  )}
                                  className="min-h-[92px] flex-1 resize-none rounded-3xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/50"
                                />

                                <button
                                  type="button"
                                  onClick={sendSupportReply}
                                  disabled={
                                    actionLoading ===
                                      selectedSupportConversation.id ||
                                    !conversationReply.trim()
                                  }
                                  className="inline-flex items-center justify-center gap-2 rounded-3xl bg-cyan-300 px-6 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40 md:w-40"
                                >
                                  <Send size={16} />
                                  {translate(t, "send", "Enviar")}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
  );
}

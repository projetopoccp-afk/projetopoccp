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

export function AdminRequestsTab({ ctx }: AdminTabProps) {
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
                  <SearchInput
                    value={requestSearch}
                    onChange={setRequestSearch}
                    placeholder={translate(
                      t,
                      "adminSearchRequestPlaceholder",
                      "Buscar solicitações por email, nome, username, categoria ou código...",
                    )}
                  />

                  <div className="mt-5 grid gap-4">
                    {filteredRequests.length === 0 && (
                      <EmptyBox
                        text={translate(
                          t,
                          "adminNoPendingRequests",
                          "Nenhuma solicitação pendente.",
                        )}
                      />
                    )}

                    {filteredRequests.map((request: any) => {
                      const isExpanded = expandedRequests[request.id] ?? false;

                      return (
                        <div
                          key={request.id}
                          className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl"
                        >
                          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                            <div className="min-w-0">
                              <h3 className="truncate text-xl font-black text-white">
                                {request.nickname}
                              </h3>

                              <p className="text-sm text-white/45">
                                @{request.username}
                              </p>
                              <p className="mt-1 truncate text-sm text-white/40">
                                {request.email}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2">
                                <StatusPill
                                  label={
                                    request.category ||
                                    translate(t, "category", "Categoria")
                                  }
                                  tone="cyan"
                                />
                                <StatusPill
                                  label={
                                    request.verification_platform ||
                                    translate(t, "notInformed", "Não informado")
                                  }
                                />
                                <StatusPill
                                  label={new Date(
                                    request.created_at,
                                  ).toLocaleDateString(dateLocale)}
                                  tone="yellow"
                                />
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                              <button
                                onClick={() =>
                                  setExpandedRequests((current) => ({
                                    ...current,
                                    [request.id]: !isExpanded,
                                  }))
                                }
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white transition hover:bg-white/[0.08]"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp size={16} />
                                    {translate(t, "collapse", "Recolher")}
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown size={16} />
                                    {translate(t, "expand", "Expandir")}
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() => approveRequest(request)}
                                disabled={actionLoading === request.id}
                                className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-2 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                              >
                                <Check size={16} />
                                {actionLoading === request.id
                                  ? translate(t, "approving", "Aprovando...")
                                  : translate(t, "approve", "Aprovar")}
                              </button>

                              <button
                                onClick={() => rejectRequest(request)}
                                disabled={actionLoading === request.id}
                                className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-5 py-2 text-sm font-bold text-red-100 transition hover:bg-red-300/20 disabled:opacity-40"
                              >
                                <X size={16} />
                                {actionLoading === request.id
                                  ? translate(t, "processing", "Processando...")
                                  : translate(t, "reject", "Rejeitar")}
                              </button>
                            </div>
                          </div>

                          {isExpanded && (
                            <div className="grid gap-4 border-t border-white/10 bg-black/20 p-5 md:grid-cols-2">
                              <InfoBox
                                label={translate(t, "email", "Email")}
                                value={
                                  request.email ||
                                  translate(t, "noEmailLower", "sem email")
                                }
                              />

                              <InfoBox
                                label={translate(t, "code", "Código")}
                                value={request.verification_code}
                                highlight
                              />

                              <InfoBox
                                label={translate(t, "platform", "Plataforma")}
                                value={
                                  request.verification_platform ||
                                  translate(t, "notInformed", "Não informado")
                                }
                              />

                              <InfoBox
                                label={translate(t, "requestedAt", "Solicitado em")}
                                value={new Date(request.created_at).toLocaleString(
                                  dateLocale,
                                )}
                              />

                              {request.verification_url && (
                                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                                  <p className="text-xs text-white/40">
                                    {translate(
                                      t,
                                      "verificationUrl",
                                      "URL de verificação",
                                    )}
                                  </p>

                                  <a
                                    href={request.verification_url}
                                    target="_blank"
                                    className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-cyan-100 hover:text-cyan-200"
                                  >
                                    <ExternalLink size={16} />
                                    {request.verification_url}
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
  );
}

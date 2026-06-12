"use client";

import type { AdminPanelContext } from "../hooks/useAdminPanelController";

type AdminClaimsTabProps = {
  ctx: AdminPanelContext;
};

export default function AdminClaimsTab({ ctx }: AdminClaimsTabProps) {
  const {
    ACTIVE_SUPPORT_STATUSES,
    ADMIN_PACK_TYPES,
    ADMIN_TABS,
    AnimatePresence,
    Ban,
    BarChart3,
    Check,
    ChevronDown,
    ChevronUp,
    EmptyBox,
    ExternalLink,
    Eye,
    EyeOff,
    FINAL_SUPPORT_STATUSES,
    GRANT_RARITIES,
    Gift,
    Handshake,
    History,
    ImageIcon,
    InfoBox,
    Link,
    MessageCircle,
    PARTNERSHIP_TYPE_OPTIONS,
    Package,
    RotateCcw,
    SUPPORT_STATUS_FILTERS,
    Search,
    SearchInput,
    Send,
    ShieldCheck,
    SmallInfo,
    StatCard,
    StatusPill,
    Upload,
    UserCog,
    UserInfo,
    X,
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
    createSlug,
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
    getAdminPackLabel,
    getAdminRewardTargets,
    getCreator,
    getCreatorDetectorPlatformLabel,
    getCurrentUserId,
    getDateLocale,
    getDetectedKickKey,
    getFriendlyLogTitle,
    getGrantRarityLabel,
    getNameSimilarity,
    getOwner,
    getPartnershipTypeLabel,
    getPossibleCreatorMatches,
    getProfileDisplayName,
    getSafeQuantity,
    getSupportStatusLabel,
    getSupportTypeLabel,
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
    isSupportConversationFinal,
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
    motion,
    normalizeDetectorCompare,
    onClose,
    open,
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
    rollRandomRarity,
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
    translate,
    translateExisting,
    updatePartnershipApprovalDraft,
    updateSupportConversationStatus,
    userCardsCount,
    userSearch,
    users,
    usersById
  } = ctx;

  return (
    <>
          {!loading && activeTab === "claims" && (
            <div className="mt-8">
              <SearchInput
                value={claimSearch}
                onChange={setClaimSearch}
                placeholder={translate(
                  t,
                  "adminSearchClaimPlaceholder",
                  "Buscar reivindicações por criador, usuário, email ou código...",
                )}
              />

              <div className="mt-5 grid gap-4">
                {filteredClaims.length === 0 && (
                  <EmptyBox
                    text={translate(
                      t,
                      "adminNoPendingClaims",
                      "Nenhuma reivindicação pendente.",
                    )}
                  />
                )}

                {filteredClaims.map((claim: any) => {
                  const creator = getCreator(claim.creator_id);
                  const claimant = getOwner(claim.user_id);
                  const isExpanded = expandedClaims[claim.id] ?? false;

                  return (
                    <div
                      key={claim.id}
                      className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl"
                    >
                      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                            {creator?.avatar_url ? (
                              <img
                                loading="lazy"
                                decoding="async"
                                src={creator.avatar_url}
                                alt={creator.nickname}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs text-white/30">
                                {translate(t, "noImage", "Sem imagem")}
                              </div>
                            )}
                          </div>

                          <div>
                            <h3 className="text-xl font-black text-white">
                              {creator?.nickname ||
                                translate(
                                  t,
                                  "creatorNotFound",
                                  "Creator não encontrado",
                                )}
                            </h3>

                            <p className="text-sm text-white/45">
                              @
                              {creator?.username ||
                                translate(t, "noUsername", "sem_username")}
                            </p>

                            <p className="mt-1 text-xs text-white/35">
                              {translate(t, "claimedBy", "Reivindicado por")}:{" "}
                              {claimant
                                ? claimant.email ||
                                  claimant.display_name ||
                                  translate(t, "noEmailLower", "sem email")
                                : claim.user_id}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:justify-end">
                          <StatusPill
                            label={translate(
                              t,
                              "pendingClaim",
                              "Pending claim",
                            )}
                            tone="yellow"
                          />

                          <StatusPill
                            label={claim.verification_platform}
                            tone="cyan"
                          />

                          <button
                            onClick={() =>
                              setExpandedClaims((current) => ({
                                ...current,
                                [claim.id]: !isExpanded,
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
                        </div>
                      </div>

                      {isExpanded && (
                        <>
                          <div className="grid gap-4 border-t border-white/10 p-5 md:grid-cols-2">
                            <InfoBox
                              label={translate(t, "code", "Código")}
                              value={claim.verification_code}
                              highlight
                            />

                            <InfoBox
                              label={translate(
                                t,
                                "requestedAt",
                                "Solicitado em",
                              )}
                              value={new Date(claim.created_at).toLocaleString(
                                dateLocale,
                              )}
                            />

                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                              <p className="text-xs text-white/40">
                                {translate(
                                  t,
                                  "verificationUrl",
                                  "URL de verificação",
                                )}
                              </p>

                              <a
                                href={claim.verification_url}
                                target="_blank"
                                className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-cyan-100 hover:text-cyan-200"
                              >
                                <ExternalLink size={16} />
                                {claim.verification_url}
                              </a>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 border-t border-white/10 bg-black/20 p-5">
                            <button
                              onClick={() => approveClaim(claim)}
                              disabled={actionLoading === claim.id}
                              className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                            >
                              <Check size={16} />
                              {actionLoading === claim.id
                                ? translate(t, "approving", "Aprovando...")
                                : translate(
                                    t,
                                    "adminApproveClaim",
                                    "Aprovar reivindicação",
                                  )}
                            </button>

                            <button
                              onClick={() => rejectClaim(claim)}
                              disabled={actionLoading === claim.id}
                              className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-300/20 disabled:opacity-40"
                            >
                              <X size={16} />
                              {actionLoading === claim.id
                                ? translate(t, "processing", "Processando...")
                                : translate(t, "reject", "Rejeitar")}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

    </>
  );
}

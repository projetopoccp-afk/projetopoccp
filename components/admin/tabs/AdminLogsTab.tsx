"use client";

import type { TranslationKey, CreatorProfileVisibilityFilter, CreatorProfileVerificationFilter, CreatorProfileOwnerFilter, CreatorProfileSortFilter, SupportConversationStatus } from "../hooks/useAdminPanelController";

type AdminLogsTabProps = {
  ctx: Record<string, any>;
};

export default function AdminLogsTab({ ctx }: AdminLogsTabProps) {
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
          {!loading && activeTab === "logs" && (
            <div className="mt-8">
              <SearchInput
                value={logSearch}
                onChange={setLogSearch}
                placeholder={translate(
                  t,
                  "adminSearchLogsPlaceholder",
                  "Buscar logs por ação, usuário ou metadata...",
                )}
              />

              <div className="mt-5 grid gap-3">
                {filteredLogs.length === 0 && (
                  <EmptyBox
                    text={translate(
                      t,
                      "adminNoLogsFound",
                      "Nenhum log encontrado.",
                    )}
                  />
                )}

                {filteredLogs.map((log: any) => {
                  const isExpanded = expandedLogs[log.id] ?? false;

                  return (
                    <div
                      key={log.id}
                      className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]"
                    >
                      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="flex items-center gap-2 font-bold text-white">
                            <History size={16} />
                            {getFriendlyLogTitle(log)}
                          </p>

                          <p className="mt-1 text-sm text-white/45">
                            {translate(t, "adminActivityAction", "Ação")}:{" "}
                            {log.action}
                          </p>

                          <p className="text-sm text-white/35">
                            {translate(t, "target", "Target")}:{" "}
                            {log.target_type}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-white/50">
                            {new Date(log.created_at).toLocaleString(
                              dateLocale,
                            )}
                          </span>

                          <button
                            onClick={() =>
                              setExpandedLogs((current) => ({
                                ...current,
                                [log.id]: !isExpanded,
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
                        <div className="border-t border-white/10 bg-black/20 p-5">
                          <SmallInfo
                            label="Target ID"
                            value={
                              log.target_id ||
                              translate(t, "noTarget", "sem target")
                            }
                          />

                          <pre className="no-scrollbar mt-4 max-h-48 overflow-y-auto rounded-2xl bg-black/30 p-3 text-xs text-white/45">
                            {JSON.stringify(log.metadata || {}, null, 2)}
                          </pre>
                        </div>
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

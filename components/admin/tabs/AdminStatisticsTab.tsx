"use client";

import type { TranslationKey, CreatorProfileVisibilityFilter, CreatorProfileVerificationFilter, CreatorProfileOwnerFilter, CreatorProfileSortFilter, SupportConversationStatus } from "../hooks/useAdminPanelController";

type AdminStatisticsTabProps = {
  ctx: Record<string, any>;
};

export default function AdminStatisticsTab({ ctx }: AdminStatisticsTabProps) {
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
          {!loading && activeTab === "statistics" && (
            <div className="mt-8">
              <div className="flex items-start gap-3 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                  <BarChart3 size={20} />
                </div>

                <div>
                  <h3 className="text-xl font-black text-white">
                    {translate(t, "adminStatistics", "Estatísticas")}
                  </h3>
                  <p className="mt-1 text-sm text-white/50">
                    {translate(
                      t,
                      "adminStatisticsDescription",
                      "Resumo operacional do Cardpoc com visitas, logins, cartas conquistadas e atividades principais.",
                    )}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                  label={translate(t, "adminStatsVisits", "Visitas")}
                  value={stats.visits}
                  hint={translate(
                    t,
                    "adminStatsVisitsHint",
                    "Visualizações registradas em perfis.",
                  )}
                  dateLocale={dateLocale}
                />
                <StatCard
                  label={translate(t, "adminStatsLogins", "Logins/Usuários")}
                  value={stats.logins}
                  hint={translate(
                    t,
                    "adminStatsLoginsHint",
                    "Total de contas cadastradas.",
                  )}
                  dateLocale={dateLocale}
                />
                <StatCard
                  label={translate(
                    t,
                    "adminStatsConqueredCards",
                    "Cartas conquistadas",
                  )}
                  value={stats.conqueredCards}
                  hint={translate(
                    t,
                    "adminStatsConqueredCardsHint",
                    "Cartas no inventário dos usuários.",
                  )}
                  dateLocale={dateLocale}
                />
                <StatCard
                  label={translate(t, "adminStatsOpenedPacks", "Packs abertos")}
                  value={stats.openedPacks}
                  hint={translate(
                    t,
                    "adminStatsOpenedPacksHint",
                    "Packs já revelados pelos usuários.",
                  )}
                  dateLocale={dateLocale}
                />
                <StatCard
                  label={translate(
                    t,
                    "adminStatsCreatorFollows",
                    "Follows em criadores",
                  )}
                  value={stats.creatorFollows}
                  hint={translate(
                    t,
                    "adminStatsCreatorFollowsHint",
                    "Relações de seguidores dentro do Cardpoc.",
                  )}
                  dateLocale={dateLocale}
                />
                <StatCard
                  label={translate(
                    t,
                    "adminStatsPendingRequests",
                    "Solicitações pendentes",
                  )}
                  value={stats.pendingRequests}
                  hint={translate(
                    t,
                    "adminStatsPendingRequestsHint",
                    "Perfis aguardando aprovação.",
                  )}
                  dateLocale={dateLocale}
                />
                <StatCard
                  label={translate(
                    t,
                    "adminStatsPendingClaims",
                    "Reivindicações pendentes",
                  )}
                  value={stats.pendingClaims}
                  hint={translate(
                    t,
                    "adminStatsPendingClaimsHint",
                    "Criadores aguardando validação de posse.",
                  )}
                  dateLocale={dateLocale}
                />
                <StatCard
                  label={translate(
                    t,
                    "adminStatsCreators",
                    "Perfis de criadores",
                  )}
                  value={stats.totalCreators}
                  hint={translate(
                    t,
                    "adminStatsCreatorsHint",
                    "Total de perfis criados na plataforma.",
                  )}
                  dateLocale={dateLocale}
                />
              </div>
            </div>
          )}
    </>
  );
}

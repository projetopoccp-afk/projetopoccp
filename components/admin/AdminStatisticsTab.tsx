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

export function AdminStatisticsTab({ ctx }: AdminTabProps) {
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
  );
}

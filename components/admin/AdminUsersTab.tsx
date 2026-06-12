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

export function AdminUsersTab({ ctx }: AdminTabProps) {
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
                    value={userSearch}
                    onChange={setUserSearch}
                    placeholder={translate(
                      t,
                      "adminSearchUserPlaceholder",
                      "Buscar por nome, username ou email...",
                    )}
                  />

                  <div className="mt-5 grid gap-3">
                    {filteredUsers.length === 0 && (
                      <EmptyBox
                        text={translate(
                          t,
                          "adminNoUsersFound",
                          "Nenhum usuário encontrado.",
                        )}
                      />
                    )}

                    {filteredUsers.map((profile: any) => (
                      <div
                        key={profile.id}
                        className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <UserInfo profile={profile} t={t} />

                        <div className="flex flex-wrap items-center gap-3">
                          {profile.is_admin && (
                            <StatusPill
                              label={translate(t, "admin", "Admin")}
                              tone="yellow"
                            />
                          )}

                          {profile.is_banned && (
                            <StatusPill
                              label={translate(t, "adminBanned", "Banido")}
                              tone="red"
                            />
                          )}

                          <button
                            onClick={() => toggleAdmin(profile)}
                            disabled={actionLoading === profile.id}
                            className={`rounded-full px-5 py-2 text-sm font-bold transition disabled:opacity-40 ${
                              profile.is_admin
                                ? "border border-red-300/20 bg-red-300/10 text-red-100 hover:bg-red-300/20"
                                : "bg-cyan-300 text-black hover:scale-105"
                            }`}
                          >
                            {profile.is_admin
                              ? translate(t, "adminRemoveAdmin", "Remover Admin")
                              : translate(t, "adminMakeAdmin", "Tornar Admin")}
                          </button>

                          <button
                            onClick={() => toggleUserBan(profile)}
                            disabled={actionLoading === profile.id}
                            className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-bold transition disabled:opacity-40 ${
                              profile.is_banned
                                ? "border border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/20"
                                : "border border-red-300/20 bg-red-300/10 text-red-100 hover:bg-red-300/20"
                            }`}
                          >
                            {profile.is_banned ? (
                              <>
                                <RotateCcw size={16} />
                                {translate(t, "adminUnbanUser", "Desbanir")}
                              </>
                            ) : (
                              <>
                                <Ban size={16} />
                                {translate(t, "adminBanUser", "Banir")}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
  );
}

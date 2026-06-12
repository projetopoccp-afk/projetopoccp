"use client";

import type { TranslationKey, CreatorProfileVisibilityFilter, CreatorProfileVerificationFilter, CreatorProfileOwnerFilter, CreatorProfileSortFilter, SupportConversationStatus } from "../hooks/useAdminPanelController";

type AdminPartnershipsTabProps = {
  ctx: Record<string, any>;
};

export default function AdminPartnershipsTab({ ctx }: AdminPartnershipsTabProps) {
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
          {!loading && activeTab === "partnerships" && (
            <div className="mt-8">
              <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-cyan-100">
                      <Handshake size={14} />
                      {translate(
                        t,
                        "adminPartnershipsBadge",
                        "YouTube Detector",
                      )}
                    </div>

                    <h3 className="mt-4 text-2xl font-black text-white">
                      {translate(
                        t,
                        "adminPartnershipsTitle",
                        "Parcerias Detectadas",
                      )}
                    </h3>

                    <p className="mt-2 max-w-2xl text-sm text-white/50">
                      {translate(
                        t,
                        "adminPartnershipsDescription",
                        "Sugestões encontradas automaticamente ficam aqui para aprovação. Parcerias criadas manualmente pelo criador não passam por esta fila.",
                      )}
                    </p>
                  </div>

                  <button
                    onClick={detectYouTubePartnerships}
                    disabled={actionLoading === "detect-youtube-partnerships"}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                  >
                    <Search size={16} />
                    {actionLoading === "detect-youtube-partnerships"
                      ? translate(
                          t,
                          "adminPartnershipDetecting",
                          "Detectando...",
                        )
                      : translate(
                          t,
                          "adminDetectYouTubePartnerships",
                          "Detectar YouTube",
                        )}
                  </button>
                </div>
              </div>

              <div className="mt-5">
                <SearchInput
                  value={partnershipSearch}
                  onChange={setPartnershipSearch}
                  placeholder={translate(
                    t,
                    "adminSearchPartnershipPlaceholder",
                    "Buscar por marca, criador, plataforma ou evidência...",
                  )}
                />
              </div>

              <div className="mt-5 grid gap-4">
                {filteredPartnerships.length === 0 && (
                  <EmptyBox
                    text={translate(
                      t,
                      "adminNoDetectedPartnerships",
                      "Nenhuma parceria detectada aguardando aprovação.",
                    )}
                  />
                )}

                {filteredPartnerships.map((partnership) => {
                  const creator = getCreator(partnership.creator_id);
                  const isExpanded =
                    expandedPartnerships[partnership.id] ?? false;
                  const confidenceScore = partnership.confidence_score ?? 0;

                  return (
                    <div
                      key={partnership.id}
                      className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl"
                    >
                      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-cyan-100">
                            <Handshake size={30} />
                          </div>

                          <div>
                            <h3 className="text-xl font-black text-white">
                              {partnership.brand_name}
                            </h3>

                            <p className="text-sm text-white/45">
                              {creator
                                ? `${creator.nickname} • @${creator.username}`
                                : translate(
                                    t,
                                    "creatorNotFound",
                                    "Creator não encontrado",
                                  )}
                            </p>

                            <p className="mt-1 text-xs text-white/35">
                              {translate(t, "adminPartnershipSource", "Fonte")}:{" "}
                              {partnership.source_platform}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:justify-end">
                          <StatusPill
                            label={`${confidenceScore}% ${translate(t, "adminConfidence", "confiança")}`}
                            tone={
                              confidenceScore >= 80
                                ? "green"
                                : confidenceScore >= 60
                                  ? "yellow"
                                  : "cyan"
                            }
                          />

                          <StatusPill
                            label={getPartnershipTypeLabel(
                              partnership.partnership_type,
                              t,
                            )}
                            tone="cyan"
                          />

                          <button
                            onClick={() =>
                              setExpandedPartnerships((current) => ({
                                ...current,
                                [partnership.id]: !isExpanded,
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
                              label={translate(
                                t,
                                "adminPartnershipBrand",
                                "Marca",
                              )}
                              value={partnership.brand_name}
                              highlight
                            />

                            <InfoBox
                              label={translate(
                                t,
                                "adminPartnershipType",
                                "Tipo",
                              )}
                              value={getPartnershipTypeLabel(
                                partnership.partnership_type,
                                t,
                              )}
                            />

                            <InfoBox
                              label={translate(
                                t,
                                "adminDetectionReason",
                                "Motivo da detecção",
                              )}
                              value={
                                partnership.detection_reason ||
                                translate(t, "notInformed", "Não informado")
                              }
                            />

                            <InfoBox
                              label={translate(t, "createdAt", "Criado em")}
                              value={new Date(
                                partnership.created_at,
                              ).toLocaleString(dateLocale)}
                            />

                            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                              <p className="text-xs text-white/40">
                                {translate(
                                  t,
                                  "adminEvidenceText",
                                  "Evidência encontrada",
                                )}
                              </p>

                              <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">
                                {partnership.evidence_text ||
                                  translate(
                                    t,
                                    "adminNoEvidenceText",
                                    "Sem texto de evidência.",
                                  )}
                              </p>
                            </div>

                            {partnership.source_url && (
                              <div className="rounded-2xl border border-white/10 bg-black/30 p-4 md:col-span-2">
                                <p className="text-xs text-white/40">
                                  {translate(
                                    t,
                                    "adminSourceUrl",
                                    "URL da fonte",
                                  )}
                                </p>

                                <a
                                  href={partnership.source_url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="mt-2 inline-flex items-center gap-2 break-all text-sm font-bold text-cyan-100 hover:text-cyan-200"
                                >
                                  <ExternalLink size={16} />
                                  {partnership.source_url}
                                </a>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-3 border-t border-white/10 bg-black/20 p-5">
                            <button
                              onClick={() =>
                                openPartnershipApproval(partnership)
                              }
                              disabled={actionLoading === partnership.id}
                              className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                            >
                              <Check size={16} />
                              {actionLoading === partnership.id
                                ? translate(t, "approving", "Aprovando...")
                                : translate(t, "approve", "Aprovar")}
                            </button>

                            <button
                              onClick={() => rejectPartnership(partnership)}
                              disabled={actionLoading === partnership.id}
                              className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-5 py-3 text-sm font-bold text-red-100 transition hover:bg-red-300/20 disabled:opacity-40"
                            >
                              <X size={16} />
                              {actionLoading === partnership.id
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

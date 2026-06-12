"use client";

import type { AdminPanelContext, TranslationKey } from "../hooks/useAdminPanelController";

type AdminGlobalOverlaysProps = {
  ctx: AdminPanelContext;
};

export default function AdminGlobalOverlays({ ctx }: AdminGlobalOverlaysProps) {
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
      <AnimatePresence>
        {successToast && (
          <motion.div
            key="admin-success-toast"
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -18, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="fixed right-4 top-4 z-[180] w-[calc(100vw-2rem)] max-w-md rounded-3xl border border-emerald-300/25 bg-[#07120d]/95 p-4 text-white shadow-2xl shadow-emerald-500/15 backdrop-blur-xl sm:right-6 sm:top-6"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-emerald-300 text-black shadow-lg shadow-emerald-300/20">
                <Check size={18} />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-100/80">
                  {translate(t, "adminActionCompleted", "Ação concluída")}
                </p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-white/90">
                  {successToast}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSuccessToast(null)}
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-white/50 transition hover:bg-white/[0.08] hover:text-white"
                aria-label={translate(t, "close", "Fechar")}
              >
                <X size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

          <AnimatePresence>
            {partnershipApprovalDraft && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl"
              >
                <motion.div
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 18, scale: 0.96 }}
                  className="no-scrollbar max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[32px] border border-cyan-300/20 bg-[#05070d] p-6 shadow-2xl shadow-cyan-500/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.24em] text-cyan-100">
                        <ShieldCheck size={14} />
                        {translate(
                          t,
                          "adminSmartApprovalBadge",
                          "Aprovação Inteligente",
                        )}
                      </div>

                      <h3 className="mt-4 text-2xl font-black text-white">
                        {translate(
                          t,
                          "adminApprovePartnershipTitle",
                          "Aprovar parceria",
                        )}
                      </h3>

                      <p className="mt-2 max-w-2xl text-sm text-white/50">
                        {translate(
                          t,
                          "adminApprovePartnershipDescription",
                          "Revise a marca uma vez e o Cardpoc reaproveita logo, site e descrição em futuras parcerias com a mesma empresa.",
                        )}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setPartnershipApprovalDraft(null);
                        setBrandEnrichmentConfidence(null);
                        setBrandEnrichmentSource(null);
                      }}
                      className="rounded-full border border-white/10 bg-white/[0.04] p-3 text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-[220px_1fr]">
                    <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
                      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-3xl border border-cyan-300/15 bg-cyan-300/10">
                        {partnershipApprovalDraft.brandLogoUrl ? (
                          <img
                            loading="lazy"
                            decoding="async"
                            src={partnershipApprovalDraft.brandLogoUrl}
                            alt={partnershipApprovalDraft.brandName}
                            className="h-full w-full object-contain p-4"
                          />
                        ) : (
                          <Handshake className="text-cyan-100/70" size={54} />
                        )}
                      </div>

                      <p className="mt-4 text-xs text-white/40">
                        {translate(
                          t,
                          "adminBrandPreviewHint",
                          "Prévia da logo da marca. Você pode deixar vazio e completar depois.",
                        )}
                      </p>

                      <button
                        type="button"
                        onClick={enrichBrand}
                        disabled={brandEnrichmentLoading}
                        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Search size={16} />
                        {brandEnrichmentLoading
                          ? translate(
                              t,
                              "adminBrandSearching",
                              "Pesquisando marca...",
                            )
                          : translate(t, "adminBrandSearch", "Pesquisar marca")}
                      </button>

                      {brandEnrichmentConfidence !== null && (
                        <p className="mt-3 rounded-2xl border border-emerald-300/15 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-emerald-100">
                          {translate(
                            t,
                            "adminBrandConfidence",
                            "Confiança da busca",
                          )}
                          : {brandEnrichmentConfidence}%
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(
                            t,
                            "adminPartnershipBrandName",
                            "Nome da marca",
                          )}
                        </span>
                        <input
                          value={partnershipApprovalDraft.brandName}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "brandName",
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(t, "adminPartnershipType", "Tipo")}
                        </span>
                        <select
                          value={partnershipApprovalDraft.partnershipType}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "partnershipType",
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-white outline-none focus:border-cyan-300/40"
                        >
                          {PARTNERSHIP_TYPE_OPTIONS.map((option: any) => (
                            <option key={option.id} value={option.id}>
                              {translate(
                                t,
                                option.labelKey as TranslationKey,
                                option.fallback,
                              )}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(t, "adminBrandLogoUrl", "Logo da marca")}
                        </span>
                        <input
                          value={partnershipApprovalDraft.brandLogoUrl}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "brandLogoUrl",
                              event.target.value,
                            )
                          }
                          placeholder="https://..."
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(
                            t,
                            "adminBrandWebsiteUrl",
                            "Site da marca",
                          )}
                        </span>
                        <input
                          value={partnershipApprovalDraft.brandWebsiteUrl}
                          onChange={(event) => {
                            updatePartnershipApprovalDraft(
                              "brandWebsiteUrl",
                              event.target.value,
                            );
                            updatePartnershipApprovalDraft(
                              "websiteUrl",
                              event.target.value,
                            );
                          }}
                          placeholder="https://..."
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(
                            t,
                            "adminCampaignName",
                            "Nome da campanha",
                          )}
                        </span>
                        <input
                          value={partnershipApprovalDraft.campaignName}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "campaignName",
                              event.target.value,
                            )
                          }
                          placeholder={translate(
                            t,
                            "adminCampaignNamePlaceholder",
                            "Ex: Black Friday 2026",
                          )}
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(
                            t,
                            "adminPartnershipPublicUrl",
                            "Link público",
                          )}
                        </span>
                        <input
                          value={partnershipApprovalDraft.websiteUrl}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "websiteUrl",
                              event.target.value,
                            )
                          }
                          placeholder="https://..."
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(t, "adminPartnershipStartDate", "Início")}
                        </span>
                        <input
                          type="date"
                          value={partnershipApprovalDraft.startDate}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "startDate",
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(t, "adminPartnershipEndDate", "Fim")}
                        </span>
                        <input
                          type="date"
                          value={partnershipApprovalDraft.endDate}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "endDate",
                              event.target.value,
                            )
                          }
                          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(
                            t,
                            "adminBrandDescription",
                            "Descrição da marca",
                          )}
                        </span>
                        <textarea
                          value={partnershipApprovalDraft.brandDescription}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "brandDescription",
                              event.target.value,
                            )
                          }
                          rows={3}
                          className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block md:col-span-2">
                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(
                            t,
                            "adminPartnershipPublicDescription",
                            "Descrição pública da parceria",
                          )}
                        </span>
                        <textarea
                          value={partnershipApprovalDraft.publicDescription}
                          onChange={(event) =>
                            updatePartnershipApprovalDraft(
                              "publicDescription",
                              event.target.value,
                            )
                          }
                          rows={4}
                          className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/40"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.04] p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-100/70">
                          {translate(
                            t,
                            "adminPartnershipEvidenceTitle",
                            "Evidência do YouTube",
                          )}
                        </p>
                        <p className="mt-1 text-sm text-white/45">
                          {translate(
                            t,
                            "adminPartnershipEvidenceHint",
                            "Revise a origem da detecção antes de publicar a parceria.",
                          )}
                        </p>
                      </div>

                      {partnershipApprovalDraft.partnership.source_url && (
                        <a
                          href={partnershipApprovalDraft.partnership.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/70 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-100"
                        >
                          <ExternalLink size={14} />
                          {translate(
                            t,
                            "adminPartnershipOpenVideo",
                            "Abrir vídeo",
                          )}
                        </a>
                      )}
                    </div>

                    <div className="mt-4 grid gap-4 md:grid-cols-[220px_1fr]">
                      <div className="overflow-hidden rounded-3xl border border-white/10 bg-black/40">
                        {partnershipApprovalDraft.partnership
                          .source_thumbnail ? (
                          <img
                            loading="lazy"
                            decoding="async"
                            src={
                              partnershipApprovalDraft.partnership
                                .source_thumbnail
                            }
                            alt={
                              partnershipApprovalDraft.partnership
                                .source_title ||
                              translate(
                                t,
                                "adminPartnershipVideoThumbnail",
                                "Thumbnail do vídeo",
                              )
                            }
                            className="aspect-video w-full object-cover"
                          />
                        ) : (
                          <div className="flex aspect-video items-center justify-center bg-white/[0.04] text-white/30">
                            <ExternalLink size={34} />
                          </div>
                        )}
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                            {translate(t, "adminPartnershipVideo", "Vídeo")}
                          </p>
                          <p className="mt-2 text-sm font-bold leading-5 text-white">
                            {partnershipApprovalDraft.partnership
                              .source_title ||
                              translate(
                                t,
                                "adminPartnershipVideoUnavailable",
                                "Título do vídeo indisponível",
                              )}
                          </p>
                        </div>

                        <div className="grid gap-3 md:grid-cols-2">
                          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                              {translate(t, "adminPartnershipChannel", "Canal")}
                            </p>
                            <p className="mt-2 truncate text-sm font-bold text-white">
                              {partnershipApprovalDraft.partnership
                                .source_channel ||
                                translate(
                                  t,
                                  "adminPartnershipUnknownChannel",
                                  "Canal não informado",
                                )}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                            <p className="text-xs uppercase tracking-[0.18em] text-white/35">
                              {translate(
                                t,
                                "adminPartnershipPublishedAt",
                                "Publicado em",
                              )}
                            </p>
                            <p className="mt-2 text-sm font-bold text-white">
                              {partnershipApprovalDraft.partnership
                                .source_published_at
                                ? new Date(
                                    partnershipApprovalDraft.partnership
                                      .source_published_at,
                                  ).toLocaleDateString(dateLocale)
                                : translate(
                                    t,
                                    "adminPartnershipUnknownDate",
                                    "Data não informada",
                                  )}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-emerald-300/15 bg-emerald-300/10 p-4">
                          <p className="text-xs uppercase tracking-[0.18em] text-emerald-100/60">
                            {translate(
                              t,
                              "adminDetectionReason",
                              "Motivo da detecção",
                            )}
                          </p>
                          <p className="mt-2 text-sm font-bold text-emerald-50">
                            {partnershipApprovalDraft.partnership
                              .detection_reason === "paid_product_placement"
                              ? translate(
                                  t,
                                  "adminPartnershipPaidPromotion",
                                  "Promoção paga detectada pelo YouTube",
                                )
                              : partnershipApprovalDraft.partnership
                                    .detection_reason === "keyword_match"
                                ? translate(
                                    t,
                                    "adminPartnershipKeywordMatch",
                                    "Termos de parceria encontrados no título ou descrição",
                                  )
                                : partnershipApprovalDraft.partnership
                                    .detection_reason ||
                                  translate(
                                    t,
                                    "adminPartnershipUnknownReason",
                                    "Motivo não informado",
                                  )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-[24px] border border-white/10 bg-black/30 p-4">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                        {translate(
                          t,
                          "adminEvidenceText",
                          "Evidência encontrada",
                        )}
                      </p>
                      <p className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-sm text-white/55">
                        {partnershipApprovalDraft.partnership.evidence_text ||
                          translate(
                            t,
                            "adminNoEvidenceText",
                            "Sem texto de evidência.",
                          )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-wrap justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setPartnershipApprovalDraft(null);
                        setBrandEnrichmentConfidence(null);
                        setBrandEnrichmentSource(null);
                      }}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70 transition hover:bg-white/[0.08]"
                    >
                      {translate(t, "cancel", "Cancelar")}
                    </button>

                    <button
                      type="button"
                      onClick={approvePartnership}
                      disabled={
                        actionLoading ===
                        partnershipApprovalDraft.partnership.id
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                    >
                      <Check size={16} />
                      {actionLoading === partnershipApprovalDraft.partnership.id
                        ? translate(t, "approving", "Aprovando...")
                        : translate(
                            t,
                            "adminApproveAndPublish",
                            "Aprovar e publicar",
                          )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {imageEditorCreator && (
              <motion.div
                className="fixed inset-0 z-[115] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 18 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 18 }}
                  className="w-full max-w-2xl overflow-hidden rounded-[32px] border border-white/10 bg-zinc-950/95 shadow-2xl shadow-cyan-500/10"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 p-6">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.28em] text-cyan-100/60">
                        {translate(t, "adminCreatorImage", "Imagem do criador")}
                      </p>
                      <h3 className="mt-2 text-2xl font-black text-white">
                        {translate(
                          t,
                          "adminChangeCreatorImage",
                          "Alterar imagem",
                        )}
                      </h3>
                      <p className="mt-1 text-sm text-white/45">
                        {imageEditorCreator.nickname} @
                        {imageEditorCreator.username}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={closeCreatorImageEditor}
                      className="rounded-full border border-white/10 bg-white/[0.04] p-3 text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="grid gap-5 p-6 md:grid-cols-[180px_1fr]">
                    <div className="overflow-hidden rounded-[28px] border border-white/10 bg-black/40">
                      {imageEditorObjectUrl ? (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={imageEditorObjectUrl}
                          alt={translate(
                            t,
                            "adminCreatorImagePreview",
                            "Prévia da imagem",
                          )}
                          className="aspect-[3/4] w-full object-cover"
                        />
                      ) : imageEditorUrl.trim() ? (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={imageEditorUrl.trim()}
                          alt={translate(
                            t,
                            "adminCreatorImagePreview",
                            "Prévia da imagem",
                          )}
                          className="aspect-[3/4] w-full object-cover"
                        />
                      ) : imageEditorCreator.avatar_url ? (
                        <img
                          loading="lazy"
                          decoding="async"
                          src={imageEditorCreator.avatar_url}
                          alt={translate(
                            t,
                            "adminCreatorImagePreview",
                            "Prévia da imagem",
                          )}
                          className="aspect-[3/4] w-full object-cover"
                        />
                      ) : (
                        <div className="flex aspect-[3/4] w-full items-center justify-center text-white/30">
                          <ImageIcon size={36} />
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <label className="block">
                        <span className="mb-2 inline-flex items-center gap-2 text-sm font-bold text-white/70">
                          <Link size={16} />
                          {translate(
                            t,
                            "adminCreatorImageUrl",
                            "URL da imagem",
                          )}
                        </span>
                        <input
                          value={imageEditorUrl}
                          onChange={(event) => {
                            setImageEditorUrl(event.target.value);
                            if (event.target.value.trim())
                              setImageEditorFile(null);
                          }}
                          placeholder="https://..."
                          className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/40"
                        />
                      </label>

                      <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-4">
                        <p className="mb-3 inline-flex items-center gap-2 text-sm font-bold text-white/70">
                          <Upload size={16} />
                          {translate(
                            t,
                            "adminCreatorImageUpload",
                            "Upload de arquivo",
                          )}
                        </p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0] || null;
                            setImageEditorFile(file);
                            if (file) setImageEditorUrl("");
                          }}
                          className="block w-full cursor-pointer rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white file:mr-4 file:rounded-full file:border-0 file:bg-cyan-300 file:px-4 file:py-2 file:text-sm file:font-black file:text-black hover:file:bg-cyan-200"
                        />
                        <p className="mt-3 text-xs text-white/35">
                          {translate(
                            t,
                            "adminCreatorImageUploadHint",
                            "Use uma imagem vertical para preservar o visual premium da carta.",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 p-6">
                    <button
                      type="button"
                      onClick={closeCreatorImageEditor}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/70 transition hover:bg-white/[0.08]"
                    >
                      {translate(t, "cancel", "Cancelar")}
                    </button>

                    <button
                      type="button"
                      onClick={saveCreatorImage}
                      disabled={
                        actionLoading ===
                        `creator-image-${imageEditorCreator.id}`
                      }
                      className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                    >
                      <Check size={16} />
                      {actionLoading ===
                      `creator-image-${imageEditorCreator.id}`
                        ? translate(t, "saving", "Salvando...")
                        : translate(t, "save", "Salvar")}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
    </>
  );
}

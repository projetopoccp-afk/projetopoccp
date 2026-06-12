"use client";

import type { AdminPanelContext, CreatorProfileVisibilityFilter, CreatorProfileVerificationFilter, CreatorProfileOwnerFilter, CreatorProfileSortFilter } from "../hooks/useAdminPanelController";

type AdminCreatorsTabProps = {
  ctx: AdminPanelContext;
};

export default function AdminCreatorsTab({ ctx }: AdminCreatorsTabProps) {
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
          {!loading && activeTab === "creators" && (
            <div className="mt-8">
              <SearchInput
                value={creatorSearch}
                onChange={setCreatorSearch}
                placeholder={translate(
                  t,
                  "adminSearchCreatorPlaceholder",
                  "Buscar por creator, dono, email ou username...",
                )}
              />

              <div className="mt-5 rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-cyan-100">
                      <Search size={14} />
                      {translate(
                        t,
                        "adminCreatorAdvancedSearch",
                        "Pesquisa avançada",
                      )}
                    </div>

                    <p className="mt-3 text-sm text-white/50">
                      {translate(
                        t,
                        "adminCreatorAdvancedSearchDescription",
                        "Filtre perfis por visibilidade, verificação e dono. As ações em massa afetam apenas o resultado filtrado.",
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <StatusPill
                      label={`${creatorProfileStats.filtered}/${creatorProfileStats.total} ${translate(
                        t,
                        "adminProfilesFiltered",
                        "filtrados",
                      )}`}
                      tone="cyan"
                    />
                    <StatusPill
                      label={`🌐 ${creatorProfileStats.public} ${translate(
                        t,
                        "public",
                        "Públicos",
                      )}`}
                    />
                    <StatusPill
                      label={`🔒 ${creatorProfileStats.hidden} ${translate(
                        t,
                        "hidden",
                        "Ocultos",
                      )}`}
                    />
                    <StatusPill
                      label={`✓ ${creatorProfileStats.verified} ${translate(
                        t,
                        "verified",
                        "Verificados",
                      )}`}
                      tone="yellow"
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                      {translate(t, "adminVisibilityFilter", "Visibilidade")}
                    </span>
                    <select
                      value={creatorVisibilityFilter}
                      onChange={(event) =>
                        setCreatorVisibilityFilter(
                          event.target.value as CreatorProfileVisibilityFilter,
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="all">
                        {translate(t, "adminAllProfiles", "Todos os perfis")}
                      </option>
                      <option value="public">
                        {translate(
                          t,
                          "adminOnlyPublicProfiles",
                          "Apenas publicados",
                        )}
                      </option>
                      <option value="hidden">
                        {translate(
                          t,
                          "adminOnlyHiddenProfiles",
                          "Apenas ocultos",
                        )}
                      </option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                      {translate(t, "adminVerificationFilter", "Verificação")}
                    </span>
                    <select
                      value={creatorVerificationFilter}
                      onChange={(event) =>
                        setCreatorVerificationFilter(
                          event.target
                            .value as CreatorProfileVerificationFilter,
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="all">
                        {translate(t, "adminAllVerification", "Todos")}
                      </option>
                      <option value="verified">
                        {translate(t, "adminOnlyVerified", "Verificados")}
                      </option>
                      <option value="not_verified">
                        {translate(
                          t,
                          "adminOnlyNotVerified",
                          "Não verificados",
                        )}
                      </option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                      {translate(t, "adminOwnerFilter", "Dono")}
                    </span>
                    <select
                      value={creatorOwnerFilter}
                      onChange={(event) =>
                        setCreatorOwnerFilter(
                          event.target.value as CreatorProfileOwnerFilter,
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="all">
                        {translate(t, "adminAllOwners", "Com ou sem dono")}
                      </option>
                      <option value="claimed">
                        {translate(t, "adminOnlyClaimed", "Reivindicados")}
                      </option>
                      <option value="unclaimed">
                        {translate(t, "adminOnlyUnclaimed", "Sem dono")}
                      </option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">
                      {translate(t, "adminSortProfiles", "Ordenar")}
                    </span>
                    <select
                      value={creatorSortFilter}
                      onChange={(event) =>
                        setCreatorSortFilter(
                          event.target.value as CreatorProfileSortFilter,
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none"
                    >
                      <option value="newest">
                        {translate(t, "adminSortNewest", "Mais recentes")}
                      </option>
                      <option value="oldest">
                        {translate(t, "adminSortOldest", "Mais antigos")}
                      </option>
                      <option value="name">
                        {translate(t, "adminSortName", "Nome")}
                      </option>
                      <option value="views">
                        {translate(t, "adminSortViews", "Mais visualizações")}
                      </option>
                      <option value="followers">
                        {translate(t, "adminSortFollowers", "Mais seguidores")}
                      </option>
                      <option value="shares">
                        {translate(t, "adminSortShares", "Mais shares")}
                      </option>
                      <option value="trending">
                        {translate(t, "adminSortTrending", "Trending")}
                      </option>
                    </select>
                  </label>
                </div>

                <div className="mt-5 flex flex-wrap gap-3 border-t border-white/10 pt-5">
                  <button
                    type="button"
                    onClick={() =>
                      bulkUpdateFilteredCreators(
                        { is_public: true },
                        "bulk_publish_creator_profiles",
                        translate(
                          t,
                          "adminBulkPublishSuccess",
                          "Perfis filtrados publicados com sucesso.",
                        ),
                      )
                    }
                    disabled={
                      actionLoading === "bulk_publish_creator_profiles" ||
                      filteredCreators.length === 0
                    }
                    className="inline-flex items-center gap-2 rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                  >
                    <Eye size={16} />
                    {translate(
                      t,
                      "adminPublishFilteredProfiles",
                      "Publicar filtrados",
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      bulkUpdateFilteredCreators(
                        { is_public: false },
                        "bulk_hide_creator_profiles",
                        translate(
                          t,
                          "adminBulkHideSuccess",
                          "Perfis filtrados ocultados com sucesso.",
                        ),
                      )
                    }
                    disabled={
                      actionLoading === "bulk_hide_creator_profiles" ||
                      filteredCreators.length === 0
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-red-300/20 bg-red-300/10 px-5 py-2 text-sm font-bold text-red-100 transition hover:bg-red-300/20 disabled:opacity-40"
                  >
                    <EyeOff size={16} />
                    {translate(
                      t,
                      "adminHideFilteredProfiles",
                      "Ocultar filtrados",
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      bulkUpdateFilteredCreators(
                        { is_verified: true },
                        "bulk_verify_creator_profiles",
                        translate(
                          t,
                          "adminBulkVerifySuccess",
                          "Perfis filtrados verificados com sucesso.",
                        ),
                      )
                    }
                    disabled={
                      actionLoading === "bulk_verify_creator_profiles" ||
                      filteredCreators.length === 0
                    }
                    className="inline-flex items-center gap-2 rounded-full border border-yellow-300/20 bg-yellow-300/10 px-5 py-2 text-sm font-bold text-yellow-100 transition hover:bg-yellow-300/20 disabled:opacity-40"
                  >
                    <ShieldCheck size={16} />
                    {translate(
                      t,
                      "adminVerifyFilteredProfiles",
                      "Verificar filtrados",
                    )}
                  </button>

                  {hasCreatorProfileFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        setCreatorSearch("");
                        setCreatorVisibilityFilter("all");
                        setCreatorVerificationFilter("all");
                        setCreatorOwnerFilter("all");
                        setCreatorSortFilter("newest");
                      }}
                      className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-bold text-white transition hover:bg-white/[0.08]"
                    >
                      <RotateCcw size={16} />
                      {translate(t, "adminClearProfileFilters", "Limpar filtros")}
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                {filteredCreators.length === 0 && (
                  <EmptyBox
                    text={translate(
                      t,
                      "adminNoCreatorsFound",
                      "Nenhum creator encontrado.",
                    )}
                  />
                )}

                {filteredCreators.map((creator: any) => {
                  const owner = getOwner(creator.user_id);
                  const selectedOwnerId =
                    selectedOwners[creator.id] ?? creator.user_id ?? "";
                  const isExpanded = expandedCreators[creator.id] ?? false;

                  return (
                    <div
                      key={creator.id}
                      className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.04] backdrop-blur-xl"
                    >
                      <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-lg font-black text-cyan-100">
                            {creator.nickname?.slice(0, 1).toUpperCase() || "C"}
                          </div>

                          <div>
                            <h3 className="text-xl font-black text-white">
                              {creator.nickname}
                            </h3>

                            {creator.title && (
                              <p className="mt-1 text-sm font-semibold text-cyan-100">
                                {creator.title}
                              </p>
                            )}

                            <p className="text-sm text-white/45">
                              @{creator.username}
                            </p>

                            <p className="mt-1 text-xs text-white/35">
                              {translate(t, "owner", "Dono")}:{" "}
                              {owner
                                ? owner.email ||
                                  owner.display_name ||
                                  translate(t, "noEmail", "Sem email")
                                : translate(t, "noOwner", "Sem dono")}
                            </p>

                            <div className="mt-2 flex flex-wrap gap-2">
                              <StatusPill
                                label={`👁 ${Number(
                                  creator.views_count || 0,
                                ).toLocaleString(dateLocale)}`}
                                tone="cyan"
                              />

                              <StatusPill
                                label={`👥 ${Number(
                                  creator.followers_count || 0,
                                ).toLocaleString(dateLocale)}`}
                              />

                              <StatusPill
                                label={`🔗 ${Number(
                                  creator.share_count || 0,
                                ).toLocaleString(dateLocale)}`}
                                tone="yellow"
                              />

                              <StatusPill
                                label={`🔥 ${Number(
                                  creator.trending_score || 0,
                                ).toLocaleString(dateLocale)}`}
                                tone="yellow"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 md:justify-end">
                          <StatusPill
                            label={
                              creator.user_id
                                ? `👤 ${translate(t, "claimed", "Reivindicado")}`
                                : `👤 ${translate(t, "noOwner", "Sem dono")}`
                            }
                          />

                          <StatusPill
                            label={
                              creator.is_verified
                                ? `✓ ${translate(t, "verified", "Verificado")}`
                                : `○ ${translate(t, "notVerified", "Não verificado")}`
                            }
                            tone={creator.is_verified ? "yellow" : "default"}
                          />

                          <StatusPill
                            label={
                              creator.is_public
                                ? `🌐 ${translate(t, "public", "Público")}`
                                : `🔒 ${translate(t, "hidden", "Oculto")}`
                            }
                            tone={creator.is_public ? "cyan" : "default"}
                          />

                          <button
                            onClick={() =>
                              setExpandedCreators((current) => ({
                                ...current,
                                [creator.id]: !isExpanded,
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
                            <div className="rounded-3xl border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
                              <h4 className="font-bold text-white">
                                {translate(
                                  t,
                                  "adminOwnerManagement",
                                  "Gerenciamento do proprietário",
                                )}
                              </h4>

                              <p className="mt-2 text-sm text-white/45">
                                {translate(
                                  t,
                                  "adminOwnerManagementDescription",
                                  "Atribua este perfil a um usuário logado ou remova o dono atual.",
                                )}
                              </p>

                              <select
                                value={selectedOwnerId}
                                onChange={(event) =>
                                  setSelectedOwners((current) => ({
                                    ...current,
                                    [creator.id]: event.target.value,
                                  }))
                                }
                                className="mt-4 w-full rounded-2xl border border-white/10 bg-zinc-950 px-4 py-3 text-sm text-white outline-none"
                              >
                                <option value="">
                                  {translate(t, "noOwner", "Sem dono")}
                                </option>

                                {users.map((user: any) => (
                                  <option key={user.id} value={user.id}>
                                    {user.email || user.display_name || user.id}
                                  </option>
                                ))}
                              </select>

                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  onClick={() =>
                                    changeCreatorOwner(creator, selectedOwnerId)
                                  }
                                  disabled={actionLoading === creator.id}
                                  className="rounded-full bg-cyan-300 px-5 py-2 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                                >
                                  {translate(
                                    t,
                                    "adminAssignOwner",
                                    "Atribuir proprietário",
                                  )}
                                </button>

                                <button
                                  onClick={() => removeCreatorOwner(creator)}
                                  disabled={
                                    actionLoading === creator.id ||
                                    !creator.user_id
                                  }
                                  className="rounded-full border border-red-300/20 bg-red-300/10 px-5 py-2 text-sm font-bold text-red-100 transition hover:bg-red-300/20 disabled:opacity-40"
                                >
                                  {translate(
                                    t,
                                    "adminRemoveOwner",
                                    "Remover dono",
                                  )}
                                </button>
                              </div>
                            </div>

                            <div className="rounded-3xl border border-purple-300/15 bg-purple-300/[0.04] p-5">
                              <h4 className="font-bold text-white">
                                {translate(
                                  t,
                                  "adminQuickActions",
                                  "Ações rápidas",
                                )}
                              </h4>

                              <p className="mt-2 text-sm text-white/45">
                                {translate(
                                  t,
                                  "adminQuickActionsDescription",
                                  "Controle visibilidade e validação pública do creator.",
                                )}
                              </p>

                              <div className="mt-4 flex flex-wrap gap-3">
                                <button
                                  onClick={() => toggleCreatorVerified(creator)}
                                  disabled={actionLoading === creator.id}
                                  className="rounded-full border border-yellow-300/20 bg-yellow-300/10 px-5 py-2 text-sm font-bold text-yellow-100 transition hover:bg-yellow-300/20 disabled:opacity-40"
                                >
                                  {creator.is_verified
                                    ? translate(
                                        t,
                                        "adminRemoveVerification",
                                        "Remover verificação",
                                      )
                                    : translate(
                                        t,
                                        "adminVerifyProfile",
                                        "Verificar perfil",
                                      )}
                                </button>

                                <button
                                  onClick={() => toggleCreatorPublic(creator)}
                                  disabled={actionLoading === creator.id}
                                  className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-5 py-2 text-sm font-bold text-cyan-100 transition hover:bg-cyan-300/20 disabled:opacity-40"
                                >
                                  {creator.is_public ? (
                                    <>
                                      <EyeOff size={16} />
                                      {translate(
                                        t,
                                        "adminHideProfile",
                                        "Ocultar perfil",
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <Eye size={16} />
                                      {translate(
                                        t,
                                        "adminPublishProfile",
                                        "Publicar perfil",
                                      )}
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() =>
                                    openCreatorImageEditor(creator)
                                  }
                                  disabled={
                                    actionLoading ===
                                    `creator-image-${creator.id}`
                                  }
                                  className="inline-flex items-center gap-2 rounded-full border border-purple-300/20 bg-purple-300/10 px-5 py-2 text-sm font-bold text-purple-100 transition hover:bg-purple-300/20 disabled:opacity-40"
                                >
                                  <ImageIcon size={16} />
                                  {translate(
                                    t,
                                    "adminChangeCreatorImage",
                                    "Alterar imagem",
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>

                          <div className="grid gap-3 border-t border-white/10 bg-black/20 p-5 text-sm text-white/45 sm:grid-cols-3 lg:grid-cols-6">
                            <SmallInfo
                              label={translate(t, "id", "ID")}
                              value={creator.id}
                            />
                            <SmallInfo
                              label={translate(t, "createdAt", "Criado em")}
                              value={new Date(
                                creator.created_at,
                              ).toLocaleDateString(dateLocale)}
                            />
                            <SmallInfo
                              label={translate(t, "category", "Categoria")}
                              value={
                                creator.category ||
                                translate(t, "creator", "Creator")
                              }
                            />
                            <SmallInfo
                              label={translate(t, "views", "Views")}
                              value={Number(
                                creator.views_count || 0,
                              ).toLocaleString(dateLocale)}
                            />
                            <SmallInfo
                              label={translate(t, "followers", "Seguidores")}
                              value={Number(
                                creator.followers_count || 0,
                              ).toLocaleString(dateLocale)}
                            />
                            <SmallInfo
                              label={translate(
                                t,
                                "shares",
                                "Compartilhamentos",
                              )}
                              value={Number(
                                creator.share_count || 0,
                              ).toLocaleString(dateLocale)}
                            />
                            <SmallInfo
                              label="Trending"
                              value={Number(
                                creator.trending_score || 0,
                              ).toLocaleString(dateLocale)}
                            />
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

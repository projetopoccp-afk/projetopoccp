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

export function AdminCreatorDetectorTab({ ctx }: AdminTabProps) {
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
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.25em] text-cyan-100">
                          <Search size={14} />
                          {translate(
                            t,
                            "adminCreatorDetectorBadge",
                            "Detector Kick + Twitch",
                          )}
                        </div>

                        <h3 className="mt-4 text-2xl font-black text-white">
                          {translate(
                            t,
                            "adminCreatorDetectorTitle",
                            "Detectar Criadores",
                          )}
                        </h3>

                        <p className="mt-2 max-w-2xl text-sm text-white/50">
                          {translate(
                            t,
                            "adminCreatorDetectorDescription",
                            "Busque criadores ao vivo na Kick e na Twitch ao mesmo tempo, revise os resultados e importe apenas os selecionados como rascunho.",
                          )}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={detectKickCreators}
                        disabled={actionLoading === "detect-kick-creators"}
                        className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-300 px-5 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                      >
                        <Search size={16} />
                        {actionLoading === "detect-kick-creators"
                          ? translate(
                              t,
                              "adminCreatorDetectorDetecting",
                              "Detectando...",
                            )
                          : translate(
                              t,
                              "adminCreatorDetectorDetectButton",
                              "Detectar Kick + Twitch",
                            )}
                      </button>
                    </div>

                    <div className="mt-5 grid gap-3 md:grid-cols-4">
                      <label className="block md:col-span-2">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(t, "adminCreatorDetectorCategory", "Categoria")}
                        </span>
                        <input
                          value={kickDetectorCategory}
                          onChange={(event) =>
                            setKickDetectorCategory(event.target.value)
                          }
                          placeholder="Black Desert"
                          className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(t, "adminCreatorDetectorLanguage", "Idioma")}
                        </span>
                        <input
                          value={kickDetectorLanguage}
                          onChange={(event) =>
                            setKickDetectorLanguage(event.target.value)
                          }
                          placeholder="pt"
                          className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/40"
                        />
                      </label>

                      <label className="block">
                        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.18em] text-white/35">
                          {translate(
                            t,
                            "adminCreatorDetectorMinViewers",
                            "Viewers mín.",
                          )}
                        </span>
                        <input
                          type="number"
                          min={0}
                          value={kickDetectorMinViewers}
                          onChange={(event) =>
                            setKickDetectorMinViewers(
                              Number(event.target.value || 0),
                            )
                          }
                          className="w-full rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/40"
                        />
                      </label>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                    <SearchInput
                      value={kickDetectorSearch}
                      onChange={setKickDetectorSearch}
                      placeholder={translate(
                        t,
                        "adminSearchCreatorDetectorPlaceholder",
                        "Buscar por criador, categoria, título ou idioma...",
                      )}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setHideRegisteredDetectorCreators((current) => !current)
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/20"
                    >
                      {hideRegisteredDetectorCreators ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                      {hideRegisteredDetectorCreators
                        ? translate(
                            t,
                            "adminCreatorDetectorHidingRegistered",
                            "Ocultando cadastrados",
                          )
                        : translate(
                            t,
                            "adminCreatorDetectorShowingRegistered",
                            "Mostrando cadastrados",
                          )}
                    </button>

                    <button
                      type="button"
                      onClick={importSelectedKickCreators}
                      disabled={
                        selectedKickCreatorsCount === 0 ||
                        actionLoading === "import-kick-creators"
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-300 px-5 py-3 text-sm font-black text-black transition hover:scale-105 disabled:opacity-40"
                    >
                      <Check size={16} />
                      {actionLoading === "import-kick-creators"
                        ? translate(t, "adminCreatorDetectorImporting", "Importando...")
                        : `${translate(
                            t,
                            "adminCreatorDetectorImportSelected",
                            "Importar selecionados",
                          )} (${selectedKickCreatorsCount})`}
                    </button>
                  </div>

                  <div className="mt-5 grid gap-4">
                    {filteredDetectedKickCreators.length === 0 && (
                      <EmptyBox
                        text={translate(
                          t,
                          "adminNoCreatorsDetectedByPlatform",
                          "Nenhum criador detectado ainda. Escolha uma categoria e clique em detectar Kick + Twitch.",
                        )}
                      />
                    )}

                    {filteredDetectedKickCreators.map((creator) => {
                      const key = getDetectedKickKey(creator);
                      const selected = !!selectedDetectedKickCreators[key];
                      const creatorPlatform =
                        creator.platform || creatorDetectorPlatform;
                      const creatorPlatformLabel =
                        getCreatorDetectorPlatformLabel(creatorPlatform);
                      const creatorUrl =
                        creator.url ||
                        (creatorPlatform === "twitch"
                          ? `https://www.twitch.tv/${creator.slug}`
                          : `https://kick.com/${creator.slug}`);
                      const possibleMatches = creator.already_exists
                        ? []
                        : getPossibleCreatorMatches(creator);

                      return (
                        <div
                          key={key}
                          className={`overflow-hidden rounded-[28px] border backdrop-blur-xl ${
                            selected
                              ? "border-emerald-300/30 bg-emerald-300/[0.06]"
                              : "border-white/10 bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
                            <div className="flex min-w-0 items-center gap-4">
                              <button
                                type="button"
                                onClick={() => toggleDetectedKickCreator(creator)}
                                disabled={creator.already_exists}
                                className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition disabled:opacity-40 ${
                                  selected
                                    ? "border-emerald-300/30 bg-emerald-300 text-black"
                                    : "border-cyan-300/25 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/20"
                                }`}
                              >
                                <span
                                  className={`flex h-5 w-5 items-center justify-center rounded-md border ${
                                    selected
                                      ? "border-black/30 bg-black/10"
                                      : "border-cyan-100/35 bg-black/20"
                                  }`}
                                >
                                  {selected && <Check size={14} />}
                                </span>
                                {selected
                                  ? translate(
                                      t,
                                      "adminCreatorDetectorSelected",
                                      "Selecionado",
                                    )
                                  : translate(
                                      t,
                                      "adminCreatorDetectorSelect",
                                      "Selecionar",
                                    )}
                              </button>

                              <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                                {creator.avatar_url ? (
                                  <img
                                    loading="lazy"
                                    decoding="async"
                                    src={creator.avatar_url}
                                    alt={creator.display_name || creator.slug}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <UserCog className="text-white/35" />
                                )}
                              </div>

                              <div className="min-w-0">
                                <h3 className="truncate text-xl font-black text-white">
                                  {creator.display_name ||
                                    creator.username ||
                                    creator.slug}
                                </h3>

                                <p className="truncate text-sm text-white/45">
                                  @{creator.slug}
                                </p>

                                <p className="mt-1 truncate text-xs text-white/35">
                                  {creator.category ||
                                    translate(t, "notInformed", "Não informado")}
                                  {creator.stream_title
                                    ? ` • ${creator.stream_title}`
                                    : ""}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 md:justify-end">
                              {creator.already_exists && (
                                <StatusPill
                                  label={translate(
                                    t,
                                    "adminCreatorDetectorAlreadyExists",
                                    "Já existe",
                                  )}
                                  tone="yellow"
                                />
                              )}

                              <StatusPill
                                label={`${Number(creator.viewer_count || 0).toLocaleString(dateLocale)} ${translate(t, "viewers", "viewers")}`}
                                tone="green"
                              />

                              {typeof creator.followers_count === "number" && (
                                <StatusPill
                                  label={`${creator.followers_count.toLocaleString(dateLocale)} ${translate(t, "followers", "seguidores")}`}
                                  tone="cyan"
                                />
                              )}

                              <a
                                href={creatorUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-bold text-cyan-100 transition hover:bg-white/[0.08]"
                              >
                                <ExternalLink size={16} />
                                {creatorPlatformLabel}
                              </a>
                            </div>
                          </div>

                          {possibleMatches.length > 0 && (
                            <div className="border-t border-white/10 bg-black/20 px-5 py-4">
                              <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-amber-100">
                                <Handshake size={15} />
                                {translate(
                                  t,
                                  "adminCreatorDetectorPossibleDuplicate",
                                  "Possível duplicado",
                                )}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                {possibleMatches.map((match) => {
                                  const linkKey = `${key}:${match.creator.id}`;
                                  const confidence = Math.round(match.score * 100);

                                  return (
                                    <button
                                      key={match.creator.id}
                                      type="button"
                                      onClick={() =>
                                        linkDetectedCreatorToExisting(
                                          creator,
                                          match.creator,
                                        )
                                      }
                                      disabled={linkingDetectedCreatorKey === linkKey}
                                      className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-black text-amber-100 transition hover:bg-amber-300/20 disabled:opacity-40"
                                    >
                                      <Link size={14} />
                                      {linkingDetectedCreatorKey === linkKey
                                        ? translate(
                                            t,
                                            "adminCreatorDetectorLinking",
                                            "Vinculando...",
                                          )
                                        : `${translate(
                                            t,
                                            "adminCreatorDetectorLinkToExisting",
                                            "Vincular ao existente",
                                          )}: ${match.creator.nickname} (${confidence}%)`}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
  );
}

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

export function AdminCardsTab({ ctx }: AdminTabProps) {
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
    <div className="mt-8 space-y-6">
                  <div className="rounded-[28px] border border-cyan-300/15 bg-cyan-300/[0.04] p-5">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-100">
                        <Gift size={20} />
                      </div>

                      <div>
                        <h3 className="text-xl font-black text-white">
                          {translate(t, "adminManageCards", "Gerenciar Cartas")}
                        </h3>
                        <p className="mt-1 text-sm text-white/50">
                          {translate(
                            t,
                            "adminRewardCenterDescription",
                            "Escolha se deseja enviar carta ou pacote, defina quantidade, destinatário e envie em poucos passos.",
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
                    <div className="space-y-5">
                      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/50">
                          {translate(t, "adminWhatSend", "O que deseja enviar?")}
                        </p>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setAdminRewardType("card")}
                            className={`rounded-3xl border p-4 text-left transition ${
                              adminRewardType === "card"
                                ? "border-cyan-300/60 bg-cyan-300/10"
                                : "border-white/10 bg-black/20 hover:bg-white/[0.05]"
                            }`}
                          >
                            <Gift size={22} className="mb-3 text-cyan-100" />
                            <p className="font-black text-white">
                              {translate(t, "cards", "Cartas")}
                            </p>
                            <p className="mt-1 text-xs text-white/45">
                              {translate(
                                t,
                                "adminSendCardsShortDescription",
                                "Entregue uma carta específica de um criador.",
                              )}
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAdminRewardType("pack")}
                            className={`rounded-3xl border p-4 text-left transition ${
                              adminRewardType === "pack"
                                ? "border-purple-300/60 bg-purple-300/10"
                                : "border-white/10 bg-black/20 hover:bg-white/[0.05]"
                            }`}
                          >
                            <Package size={22} className="mb-3 text-purple-100" />
                            <p className="font-black text-white">
                              {translate(t, "packs", "Pacotes")}
                            </p>
                            <p className="mt-1 text-xs text-white/45">
                              {translate(
                                t,
                                "adminSendPacksShortDescription",
                                "Entregue pacotes de raridade fixa ou aleatória.",
                              )}
                            </p>
                          </button>
                        </div>
                      </div>

                      {adminRewardType === "card" && (
                        <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                          <h4 className="font-black text-white">
                            {translate(t, "adminWhichCard", "Qual carta?")}
                          </h4>
                          <p className="mt-1 text-sm text-white/45">
                            {translate(
                              t,
                              "adminChooseCardDescription",
                              "Pesquise pelo nome do criador, username, categoria ou dono.",
                            )}
                          </p>

                          <div className="mt-4">
                            <SearchInput
                              value={cardCreatorSearch}
                              onChange={setCardCreatorSearch}
                              placeholder={translate(
                                t,
                                "adminSearchCardPlaceholder",
                                "Buscar criador/carta...",
                              )}
                            />
                          </div>

                          <div className="mt-4 grid max-h-[220px] gap-3 hide-scrollbar overflow-y-auto pr-1">
                            {filteredCardCreators.length === 0 && (
                              <EmptyBox
                                text={translate(
                                  t,
                                  "adminNoCardsFound",
                                  "Nenhuma carta encontrada.",
                                )}
                              />
                            )}

                            {filteredCardCreators.map((creator) => {
                              const selected = selectedCardCreatorId === creator.id;
                              const owner = getOwner(creator.user_id);

                              return (
                                <button
                                  key={creator.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedCardCreatorId(creator.id)
                                  }
                                  className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                                    selected
                                      ? "border-cyan-300/60 bg-cyan-300/10"
                                      : "border-white/10 bg-black/20 hover:bg-white/[0.05]"
                                  }`}
                                >
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-300/15 bg-cyan-300/10 text-sm font-black text-cyan-100">
                                    {creator.nickname?.slice(0, 1).toUpperCase() ||
                                      "C"}
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <h5 className="truncate font-black text-white">
                                      {creator.nickname}
                                    </h5>
                                    <p className="truncate text-sm text-cyan-100/70">
                                      @{creator.username}
                                    </p>
                                    <p className="mt-1 truncate text-xs text-white/40">
                                      {translate(t, "owner", "Dono")}:{" "}
                                      {owner?.email ||
                                        owner?.username ||
                                        translate(t, "noOwner", "Sem dono")}
                                    </p>
                                  </div>

                                  {selected && (
                                    <Check
                                      size={18}
                                      className="shrink-0 text-cyan-200"
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                        <h4 className="font-black text-white">
                          {adminRewardType === "card"
                            ? translate(t, "adminWhichRarity", "Qual raridade?")
                            : translate(t, "adminWhichPack", "Qual pacote?")}
                        </h4>

                        {adminRewardType === "card" ? (
                          <div className="mt-4 grid grid-cols-2 gap-3">
                            {GRANT_RARITIES.map((rarityOption) => {
                              const selected =
                                selectedGrantRarity === rarityOption.id;

                              return (
                                <button
                                  key={rarityOption.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedGrantRarity(rarityOption.id)
                                  }
                                  className={`rounded-2xl border p-3 text-left transition ${
                                    selected
                                      ? "border-yellow-300/60 bg-yellow-300/10"
                                      : "border-white/10 bg-black/20 hover:bg-white/[0.05]"
                                  }`}
                                >
                                  <p className="font-bold text-white">
                                    {translate(
                                      t,
                                      rarityOption.labelKey,
                                      rarityOption.fallback,
                                    )}
                                  </p>
                                  <p className="mt-1 text-xs text-white/40">
                                    {translate(
                                      t,
                                      rarityOption.descriptionKey,
                                      rarityOption.descriptionFallback,
                                    )}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {ADMIN_PACK_TYPES.map((packOption) => {
                              const selected =
                                selectedAdminPackType === packOption.id;

                              return (
                                <button
                                  key={packOption.id}
                                  type="button"
                                  onClick={() =>
                                    setSelectedAdminPackType(packOption.id)
                                  }
                                  className={`rounded-3xl border p-4 text-left transition ${
                                    selected
                                      ? "border-purple-300/60 bg-purple-300/10"
                                      : "border-white/10 bg-black/20 hover:bg-white/[0.05]"
                                  }`}
                                >
                                  <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-purple-100">
                                    <Package size={20} />
                                  </div>
                                  <p className="font-black text-white">
                                    {translate(
                                      t,
                                      packOption.labelKey as TranslationKey,
                                      packOption.fallback,
                                    )}
                                  </p>
                                  <p className="mt-1 text-xs text-white/45">
                                    {translate(
                                      t,
                                      packOption.descriptionKey,
                                      packOption.descriptionFallback,
                                    )}
                                  </p>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                        <h4 className="font-black text-white">
                          {translate(t, "adminHowMany", "Quantas?")}
                        </h4>

                        <input
                          type="number"
                          min={1}
                          max={100}
                          value={
                            adminRewardType === "card"
                              ? adminCardQuantity
                              : adminPackQuantity
                          }
                          onChange={(event) => {
                            const value = getSafeQuantity(
                              Number(event.target.value),
                            );

                            if (adminRewardType === "card") {
                              setAdminCardQuantity(value);
                              return;
                            }

                            setAdminPackQuantity(value);
                          }}
                          className="mt-4 w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm font-bold text-white outline-none transition placeholder:text-white/30 focus:border-cyan-300/50"
                        />

                        <p className="mt-2 text-xs text-white/40">
                          {translate(
                            t,
                            "adminQuantityLimitHint",
                            "Limite de segurança: 1 a 100 por envio.",
                          )}
                        </p>
                      </div>

                      <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-5">
                        <h4 className="font-black text-white">
                          {translate(t, "adminToWho", "Para quem?")}
                        </h4>

                        <div className="mt-4 grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setAdminRewardTarget("user")}
                            className={`rounded-2xl border p-3 text-left transition ${
                              adminRewardTarget === "user"
                                ? "border-cyan-300/60 bg-cyan-300/10"
                                : "border-white/10 bg-black/20 hover:bg-white/[0.05]"
                            }`}
                          >
                            <p className="font-bold text-white">
                              {translate(
                                t,
                                "adminSpecificUser",
                                "Usuário específico",
                              )}
                            </p>
                            <p className="mt-1 text-xs text-white/40">
                              {translate(
                                t,
                                "adminSpecificUserDescription",
                                "Pesquise e selecione um usuário.",
                              )}
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => setAdminRewardTarget("all_users")}
                            className={`rounded-2xl border p-3 text-left transition ${
                              adminRewardTarget === "all_users"
                                ? "border-emerald-300/60 bg-emerald-300/10"
                                : "border-white/10 bg-black/20 hover:bg-white/[0.05]"
                            }`}
                          >
                            <p className="font-bold text-white">
                              {translate(
                                t,
                                "adminGiveawayAllUsers",
                                "Giveaway para todos",
                              )}
                            </p>
                            <p className="mt-1 text-xs text-white/40">
                              {translate(
                                t,
                                "adminGiveawayAllUsersDescription",
                                "Entrega para todos os usuários cadastrados.",
                              )}
                            </p>
                          </button>
                        </div>

                        {adminRewardTarget === "user" && (
                          <>
                            <div className="mt-4">
                              <SearchInput
                                value={cardUserSearch}
                                onChange={setCardUserSearch}
                                placeholder={translate(
                                  t,
                                  "adminSearchUserShortPlaceholder",
                                  "Buscar usuário...",
                                )}
                              />
                            </div>

                            <div className="mt-4 grid max-h-[200px] gap-3 hide-scrollbar overflow-y-auto pr-1">
                              {filteredCardUsers.length === 0 && (
                                <EmptyBox
                                  text={translate(
                                    t,
                                    "adminNoUsersFound",
                                    "Nenhum usuário encontrado.",
                                  )}
                                />
                              )}

                              {filteredCardUsers.map((profile) => {
                                const selected = selectedCardUserId === profile.id;

                                return (
                                  <button
                                    key={profile.id}
                                    type="button"
                                    onClick={() =>
                                      setSelectedCardUserId(profile.id)
                                    }
                                    className={`flex items-center justify-between gap-3 rounded-3xl border p-3 text-left transition ${
                                      selected
                                        ? "border-purple-300/60 bg-purple-300/10"
                                        : "border-white/10 bg-black/20 hover:bg-white/[0.05]"
                                    }`}
                                  >
                                    <UserInfo profile={profile} t={t} />
                                    {selected && (
                                      <Check
                                        size={18}
                                        className="shrink-0 text-purple-200"
                                      />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}

                        {adminRewardTarget === "all_users" && (
                          <div className="mt-4 rounded-3xl border border-emerald-300/15 bg-emerald-300/[0.06] p-4 text-sm text-emerald-50/75">
                            {translate(
                              t,
                              "adminGiveawayLoggedUsersOnlyHint",
                              "Este giveaway entrega automaticamente para usuários cadastrados. Visitantes sem login ainda não possuem inventário; para eles, o ideal é criar depois um giveaway público por código ou link de resgate.",
                            )}
                          </div>
                        )}
                      </div>

                      <div className="rounded-[28px] border border-white/10 bg-black/25 p-5">
                        <p className="text-xs uppercase tracking-[0.2em] text-white/35">
                          {translate(t, "summary", "Resumo")}
                        </p>

                        <div className="mt-3 space-y-2 text-sm text-white/65">
                          <p>
                            {translate(t, "type", "Tipo")}:{" "}
                            <span className="font-bold text-white">
                              {adminRewardType === "card"
                                ? translate(t, "cards", "Cartas")
                                : translate(t, "packs", "Pacotes")}
                            </span>
                          </p>

                          {adminRewardType === "card" ? (
                            <>
                              <p>
                                {translate(t, "card", "Carta")}:{" "}
                                <span className="font-bold text-white">
                                  {selectedCardCreator?.nickname ||
                                    translate(
                                      t,
                                      "noneSelectedFeminine",
                                      "Nenhuma selecionada",
                                    )}
                                </span>
                              </p>
                              <p>
                                {translate(t, "rarity", "Raridade")}:{" "}
                                <span className="font-bold text-white">
                                  {getGrantRarityLabel(selectedGrantRarity, t)}
                                </span>
                              </p>
                            </>
                          ) : (
                            <p>
                              {translate(t, "pack", "Pacote")}:{" "}
                              <span className="font-bold text-white">
                                {getAdminPackLabel(selectedAdminPackType, t)}
                              </span>
                            </p>
                          )}

                          <p>
                            {translate(t, "quantity", "Quantidade")}:{" "}
                            <span className="font-bold text-white">
                              {adminRewardType === "card"
                                ? adminCardQuantity
                                : adminPackQuantity}
                            </span>
                          </p>

                          <p>
                            {translate(t, "recipient", "Destinatário")}:{" "}
                            <span className="font-bold text-white">
                              {adminRewardTarget === "all_users"
                                ? translate(
                                    t,
                                    "adminAllRegisteredUsers",
                                    "Todos os usuários cadastrados",
                                  )
                                : selectedCardUser?.display_name ||
                                  selectedCardUser?.username ||
                                  selectedCardUser?.email ||
                                  translate(
                                    t,
                                    "noneSelectedMasculine",
                                    "Nenhum selecionado",
                                  )}
                            </span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={
                            adminRewardType === "card"
                              ? grantCardToUser
                              : grantPackToUser
                          }
                          disabled={
                            actionLoading !== null ||
                            (adminRewardType === "card" &&
                              !selectedCardCreatorId) ||
                            (adminRewardTarget === "user" && !selectedCardUserId)
                          }
                          className={`mt-5 w-full rounded-full px-5 py-3 text-sm font-black text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40 ${
                            adminRewardType === "card"
                              ? "bg-cyan-300"
                              : "bg-purple-300"
                          }`}
                        >
                          {actionLoading
                            ? translate(t, "adminSendingReward", "Enviando...")
                            : adminRewardTarget === "all_users"
                              ? translate(t, "adminSendGiveaway", "Enviar giveaway")
                              : translate(t, "adminSendReward", "Enviar")}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
  );
}

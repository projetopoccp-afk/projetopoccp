import { Loader2, Plus, ShieldCheck } from "lucide-react";

import type { useLanguage } from "@/contexts/LanguageContext";
import { translate } from "@/lib/i18n/translate";
import {
  formatProfileDate,
  getPartnershipDisplayName,
  getPartnershipLogo,
  getPartnershipTypeLabel,
  getPartnershipWebsite,
} from "./creator-profile-shared";
import type {
  CreatorPartnershipRow,
  CreatorProfileEditDraft,
  ManualPartnershipDraft,
} from "./creator-profile-shared";

type TranslateFunction = ReturnType<typeof useLanguage>["t"];

type CreatorPartnershipsSectionProps = {
  t: TranslateFunction;
  isEditing: boolean;
  editDraft: CreatorProfileEditDraft | null;
  visiblePartnerships: CreatorPartnershipRow[];
  partnershipHistoryCount: number;
  manualPartnershipDraft: ManualPartnershipDraft;
  manualPartnershipSaving: boolean;
  manualPartnershipError: string | null;
  onManualPartnershipDraftChange: (
    field: keyof ManualPartnershipDraft,
    value: string,
  ) => void;
  onAddManualPartnership: () => void | Promise<void>;
};

export function CreatorPartnershipsSection({
  t,
  isEditing,
  editDraft,
  visiblePartnerships,
  partnershipHistoryCount,
  manualPartnershipDraft,
  manualPartnershipSaving,
  manualPartnershipError,
  onManualPartnershipDraftChange,
  onAddManualPartnership,
}: CreatorPartnershipsSectionProps) {
  return (
    <article className="rounded-[2rem] border border-fuchsia-300/15 bg-white/[0.04] p-5 shadow-2xl shadow-black/20 backdrop-blur-xl md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-fuchsia-200" />
          <div>
            <h2 className="text-2xl font-black tracking-tight">
              {translate(
                t,
                "creatorProfilePartnershipsTitle",
                "Parcerias Verificadas",
              )}
            </h2>
            <p className="mt-1 text-sm leading-6 text-white/45">
              {translate(
                t,
                "creatorProfilePartnershipsDescription",
                "Parcerias, patrocínios, campanhas e marcas verificadas no Cardpoc.",
              )}
            </p>
          </div>
        </div>

        {partnershipHistoryCount > 12 ? (
          <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-1 text-xs font-black text-fuchsia-100">
            +{partnershipHistoryCount - 12}
          </span>
        ) : null}
      </div>

      {visiblePartnerships.length > 0 ? (
        <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visiblePartnerships.map((partnership: CreatorPartnershipRow) => {
            const brandName = getPartnershipDisplayName(partnership);
            const logo = getPartnershipLogo(partnership);
            const website = getPartnershipWebsite(partnership);
            const startDate =
              partnership.start_date || partnership.source_published_at;

            const cardContent = (
              <div className="group relative flex min-h-[92px] overflow-hidden rounded-[1.15rem] border border-white/10 bg-black/25 p-3 transition hover:border-fuchsia-300/25 hover:bg-fuchsia-300/[0.04]">
                <div className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-fuchsia-500/10 blur-2xl" />

                <div className="relative flex min-w-0 items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] text-sm font-black text-white/60">
                    {logo ? (
                      <img
                        src={logo}
                        alt={brandName}
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-contain p-2"
                      />
                    ) : (
                      brandName.slice(0, 2).toUpperCase()
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-black text-white">
                        {brandName}
                      </h3>
                      <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-cyan-200" />
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-fuchsia-100">
                        {getPartnershipTypeLabel(
                          partnership.partnership_type,
                        )}
                      </span>
                    </div>

                    {startDate ? (
                      <p className="mt-1.5 truncate text-[11px] font-bold text-white/42">
                        {translate(
                          t,
                          "creatorProfilePartnershipSince",
                          "Desde",
                        )}{" "}
                        {formatProfileDate(startDate)}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );

            return website ? (
              <a
                key={partnership.id}
                href={website}
                target="_blank"
                rel="noreferrer"
                className="block"
              >
                {cardContent}
              </a>
            ) : (
              <div key={partnership.id}>{cardContent}</div>
            );
          })}
        </div>
      ) : (
        <p className="mt-5 text-sm leading-7 text-white/50">
          {translate(
            t,
            "creatorProfileNoPartnerships",
            "Nenhuma parceria verificada publicada ainda.",
          )}
        </p>
      )}

      {isEditing && editDraft ? (
        <div className="mt-5 rounded-[1.35rem] border border-cyan-300/15 bg-cyan-300/[0.035] p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-100/80">
                {translate(
                  t,
                  "creatorProfileManualPartnershipTitle",
                  "Adicionar parceria manual",
                )}
              </h3>
              <p className="mt-1 text-sm leading-6 text-white/45">
                {translate(
                  t,
                  "creatorProfileManualPartnershipDescription",
                  "Parcerias adicionadas pelo criador aparecem publicamente sem passar pela fila automática.",
                )}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <input
              value={manualPartnershipDraft.brandName}
              onChange={(event) =>
                onManualPartnershipDraftChange(
                  "brandName",
                  event.target.value,
                )
              }
              placeholder={translate(
                t,
                "creatorProfileManualPartnershipBrand",
                "Nome da marca",
              )}
              className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
            />

            <select
              value={manualPartnershipDraft.partnershipType}
              onChange={(event) =>
                onManualPartnershipDraftChange(
                  "partnershipType",
                  event.target.value,
                )
              }
              className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm font-bold text-cyan-100 outline-none transition focus:border-cyan-300/45"
            >
              <option value="sponsorship">
                {translate(
                  t,
                  "creatorProfilePartnershipTypeSponsorship",
                  "Patrocínio",
                )}
              </option>
              <option value="ambassador">
                {translate(
                  t,
                  "creatorProfilePartnershipTypeAmbassador",
                  "Embaixador",
                )}
              </option>
              <option value="campaign">
                {translate(
                  t,
                  "creatorProfilePartnershipTypeCampaign",
                  "Campanha",
                )}
              </option>
              <option value="event">
                {translate(
                  t,
                  "creatorProfilePartnershipTypeEvent",
                  "Evento",
                )}
              </option>
              <option value="partnership">
                {translate(
                  t,
                  "creatorProfilePartnershipTypePartnership",
                  "Parceria",
                )}
              </option>
            </select>

            <input
              value={manualPartnershipDraft.brandLogoUrl}
              onChange={(event) =>
                onManualPartnershipDraftChange(
                  "brandLogoUrl",
                  event.target.value,
                )
              }
              placeholder={translate(
                t,
                "creatorProfileManualPartnershipLogoUrl",
                "Logo da marca (URL da imagem)",
              )}
              className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
            />

            <input
              value={manualPartnershipDraft.brandWebsiteUrl}
              onChange={(event) =>
                onManualPartnershipDraftChange(
                  "brandWebsiteUrl",
                  event.target.value,
                )
              }
              placeholder={translate(
                t,
                "creatorProfileManualPartnershipBrandWebsite",
                "Site oficial da marca",
              )}
              className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
            />

            <input
              value={manualPartnershipDraft.campaignName}
              onChange={(event) =>
                onManualPartnershipDraftChange(
                  "campaignName",
                  event.target.value,
                )
              }
              placeholder={translate(
                t,
                "creatorProfileManualPartnershipCampaign",
                "Campanha ou ação",
              )}
              className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
            />

            <input
              value={manualPartnershipDraft.websiteUrl}
              onChange={(event) =>
                onManualPartnershipDraftChange("websiteUrl", event.target.value)
              }
              placeholder={translate(
                t,
                "creatorProfileManualPartnershipPublicLink",
                "Link público da parceria",
              )}
              className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
            />

            <textarea
              value={manualPartnershipDraft.brandDescription}
              onChange={(event) =>
                onManualPartnershipDraftChange(
                  "brandDescription",
                  event.target.value,
                )
              }
              rows={2}
              placeholder={translate(
                t,
                "creatorProfileManualPartnershipBrandDescription",
                "Descrição da marca",
              )}
              className="resize-none rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45 md:col-span-2"
            />

            <input
              type="date"
              value={manualPartnershipDraft.startDate}
              onChange={(event) =>
                onManualPartnershipDraftChange("startDate", event.target.value)
              }
              title={translate(
                t,
                "creatorProfileManualPartnershipStartDate",
                "Data de início",
              )}
              className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition focus:border-cyan-300/45"
            />

            <input
              type="date"
              value={manualPartnershipDraft.endDate}
              onChange={(event) =>
                onManualPartnershipDraftChange("endDate", event.target.value)
              }
              title={translate(
                t,
                "creatorProfileManualPartnershipEndDate",
                "Data de fim",
              )}
              className="rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition focus:border-cyan-300/45"
            />
          </div>

          <textarea
            value={manualPartnershipDraft.publicDescription}
            onChange={(event) =>
              onManualPartnershipDraftChange(
                "publicDescription",
                event.target.value,
              )
            }
            rows={3}
            placeholder={translate(
              t,
              "creatorProfileManualPartnershipPublicDescription",
              "Descrição pública da parceria",
            )}
            className="mt-3 w-full resize-none rounded-[1rem] border border-white/10 bg-black/35 px-4 py-3 text-sm text-white/80 outline-none transition placeholder:text-white/25 focus:border-cyan-300/45"
          />

          {manualPartnershipError ? (
            <p className="mt-3 text-sm font-bold text-red-200">
              {manualPartnershipError}
            </p>
          ) : null}

          <button
            type="button"
            onClick={onAddManualPartnership}
            disabled={manualPartnershipSaving}
            className="mt-4 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-100 transition hover:bg-cyan-300/15 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {manualPartnershipSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {translate(
              t,
              "creatorProfileManualPartnershipSave",
              "Adicionar parceria",
            )}
          </button>
        </div>
      ) : null}
    </article>
  );
}

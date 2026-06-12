import { useMemo } from "react";
import type { CreatorPartnershipRow } from "../core/creator-profile-shared";
import { getPartnershipTimestamp } from "../core/creator-profile-shared";

function isVisiblePartnership(partnership: CreatorPartnershipRow) {
  return Boolean(
    partnership.is_active !== false &&
      ["verified", "manual"].includes(String(partnership.status || "")),
  );
}

type UseCreatorPartnershipsViewArgs = {
  partnerships: CreatorPartnershipRow[];
};

export function useCreatorPartnershipsView({
  partnerships,
}: UseCreatorPartnershipsViewArgs) {
  const visiblePartnershipHistory = useMemo(() => {
    return partnerships
      .filter(isVisiblePartnership)
      .sort(
        (partnershipA, partnershipB) =>
          getPartnershipTimestamp(partnershipB) -
          getPartnershipTimestamp(partnershipA),
      );
  }, [partnerships]);

  const visiblePartnerships = useMemo(
    () => visiblePartnershipHistory.slice(0, 12),
    [visiblePartnershipHistory],
  );

  return {
    visiblePartnerships,
    partnershipHistoryCount: visiblePartnershipHistory.length,
  };
}

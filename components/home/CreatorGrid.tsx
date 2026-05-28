"use client";

import { useState } from "react";

import { CreatorCard } from "@/components/cards/CreatorCard";
import { CreatorPopup } from "@/components/creator/CreatorPopup";
import { mockCreators } from "@/data/mock-creators";
import { Creator } from "@/types/creator";

type CreatorGridProps = {
  search: string;
};

export function CreatorGrid({ search }: CreatorGridProps) {
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);

  const normalizedSearch = search.toLowerCase().trim();

  const filteredCreators = mockCreators.filter((creator) => {
    const searchableText = [
      creator.nickname,
      creator.username,
      creator.category,
      creator.rank,
      creator.rarity,
      creator.aura,
      creator.mainPlatform,
      ...creator.tags,
    ]
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedSearch);
  });

  return (
    <>
      <section className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 justify-items-center gap-8 px-6 pb-20 pt-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredCreators.map((creator) => (
          <CreatorCard
            key={creator.id}
            creator={creator}
            onClick={setSelectedCreator}
          />
        ))}

        {filteredCreators.length === 0 && (
  <div className="col-span-full flex w-full max-w-2xl flex-col items-center rounded-[32px] border border-white/10 bg-white/[0.03] px-8 py-16 text-center backdrop-blur-xl">
    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 blur-2xl" />

    <div className="relative -mt-12 flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-black/40 text-3xl">
      ✦
    </div>

    <h3 className="mt-6 text-2xl font-bold text-white">
      No digital identities detected
    </h3>

    <p className="mt-3 max-w-md text-sm text-white/50">
      Try searching by creator name, category, rarity,
      platform or tags.
    </p>
  </div>
)}
      </section>

      <CreatorPopup
        creator={selectedCreator}
        onClose={() => setSelectedCreator(null)}
      />
    </>
  );
}
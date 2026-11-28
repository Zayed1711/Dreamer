"use client";

import { useMemo, useState } from "react";
import { defaultCountries, withLiveCountryCosts } from "@dreamer/journey-engine";
import { useBdtRates } from "@/lib/rates";
import { DestinationStage } from "./DestinationStage";
import { PackingStory } from "./PackingStory";

/** The two editorial sections of the public landing page. The chosen country carries into the story. */
export function LandingStory() {
  const [index, setIndex] = useState(0);
  const fx = useBdtRates();
  const countries = useMemo(() => withLiveCountryCosts(defaultCountries, fx.rates), [fx.rates]);
  return (
    <>
      <DestinationStage countries={countries} index={index} onChange={setIndex} />
      <PackingStory country={countries[index]!} />
    </>
  );
}

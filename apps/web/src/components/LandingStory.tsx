"use client";

import { useState } from "react";
import { ALL_18_COUNTRIES } from "@/lib/destinations";
import { DestinationStage } from "./DestinationStage";
import { PackingStory } from "./PackingStory";

/** The two editorial sections of the public landing page. The chosen country carries into the story. */
export function LandingStory() {
  const [index, setIndex] = useState(0);
  return (
    <>
      <DestinationStage countries={ALL_18_COUNTRIES} index={index} onChange={setIndex} />
      <PackingStory country={ALL_18_COUNTRIES[index]!} />
    </>
  );
}

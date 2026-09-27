import React from "react";
import { Hero } from "./sections/hero";
import { LogoStrip } from "./sections/logo-strip";
import { FeatureGrid } from "./sections/features-grid";
import { Comparison } from "./sections/comparison";
import { Stats } from "./sections/stats";
import { FinalCTA } from "@/components/shared/final-cta";
import { WelcomePopup } from "@/components/shared/welcome-popup";

const HomePage = () => {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <Comparison />
      <Stats />
      <FinalCTA />
      <WelcomePopup />
    </>
  );
};

export default HomePage;

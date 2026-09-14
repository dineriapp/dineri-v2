export const LogoStrip = () => {
  return (
    <section className="relative border-y border-foreground/5 bg-surface-1/30">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 lg:flex-row lg:items-center lg:gap-10 lg:px-8">
        {/* Label */}
        <div className="flex shrink-0 items-center gap-2 font-jetbrains-mono text-[11px] text-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
          Trusted by independent restaurants
        </div>

        {/* Marquee track */}
        <div
          className="group relative flex-1 overflow-hidden"
          style={{
            maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <div className="flex w-max animate-marquee items-center gap-10 group-hover:paused">
            {[
              ...[
                "Trattoria Milano",
                "Café Parisienne",
                "Spice Garden",
                "Ocean Grill",
                "Bistro Moderne",
                "Sakura Ramen",
                "Casa de Tapas",
                "The Old Quarter",
                "Maison Bleue",
                "Olive & Vine",
                "Nordic Table",
                "La Pergola",
              ],
              ...[
                "Trattoria Milano",
                "Café Parisienne",
                "Spice Garden",
                "Ocean Grill",
                "Bistro Moderne",
                "Sakura Ramen",
                "Casa de Tapas",
                "The Old Quarter",
                "Maison Bleue",
                "Olive & Vine",
                "Nordic Table",
                "La Pergola",
              ],
            ].map((v, i) => (
              <div key={`${v}-${i}`} className="flex items-center gap-10">
                <span className="font-inter-tight whitespace-nowrap text-[15px] font-medium text-foreground/70 transition-colors hover:text-foreground">
                  {v}
                </span>
                <span className="text-foreground/10">/</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

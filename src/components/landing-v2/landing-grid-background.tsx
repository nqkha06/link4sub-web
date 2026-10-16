export function LandingGridBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute right-[-200px] top-[20%] h-[520px] w-[520px] rounded-full opacity-30 blur-[100px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklab, var(--primary) 28%, transparent) 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-[0.22] dark:opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(
              to right,
              color-mix(in oklab, var(--foreground) 9%, transparent) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              color-mix(in oklab, var(--foreground) 9%, transparent) 1px,
              transparent 1px
            )
          `,
          backgroundSize: "52px 52px",
          maskImage:
            "linear-gradient(to bottom, black 0%, black 48%, transparent 92%)",
        }}
      />

      <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}

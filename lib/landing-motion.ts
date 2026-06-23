export const landingEase = [0.25, 0.46, 0.45, 0.94] as const;

export const landingReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: i * 0.06,
      ease: landingEase,
    },
  }),
};

export const landingViewport = {
  once: true,
  amount: 0.15 as const,
  margin: "-40px" as const,
};

export type PlanId = "free" | "starter" | "pro";

export type Entitlements = {
  maxProperties: number;
  monthlyFastScans: number;
  monthlyAccurateScans: number;
  monthlyReports: number;
  canUseAccurateScan: boolean;
  canGenerateZip: boolean;
  canGeneratePdf: boolean;
  canUseCustomCategories: boolean;
};

export const PLAN_ENTITLEMENTS: Record<PlanId, Entitlements> = {
  free: {
    maxProperties: 1,
    monthlyFastScans: 5,
    monthlyAccurateScans: 0,
    monthlyReports: 1,
    canUseAccurateScan: false,
    canGenerateZip: false,
    canGeneratePdf: false,
    canUseCustomCategories: false
  },
  starter: {
    maxProperties: 2,
    monthlyFastScans: 40,
    monthlyAccurateScans: 5,
    monthlyReports: 10,
    canUseAccurateScan: true,
    canGenerateZip: true,
    canGeneratePdf: true,
    canUseCustomCategories: false
  },
  pro: {
    maxProperties: 10,
    monthlyFastScans: 150,
    monthlyAccurateScans: 40,
    monthlyReports: 50,
    canUseAccurateScan: true,
    canGenerateZip: true,
    canGeneratePdf: true,
    canUseCustomCategories: true
  }
};

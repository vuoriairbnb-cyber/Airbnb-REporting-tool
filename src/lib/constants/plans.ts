export type PlanId = "free" | "starter" | "pro";

export type Entitlements = {
  maxProperties: number;
  monthlyStandardScans: number;
  monthlyPlusScans: number;
  monthlyProScans: number;
  monthlyReports: number;
  canUsePlusScan: boolean;
  canUseProScan: boolean;
  canGenerateZip: boolean;
  canGeneratePdf: boolean;
  canUseCustomCategories: boolean;
};

export const PLAN_ENTITLEMENTS: Record<PlanId, Entitlements> = {
  free: {
    maxProperties: 1,
    monthlyStandardScans: 5,
    monthlyPlusScans: 0,
    monthlyProScans: 0,
    monthlyReports: 1,
    canUsePlusScan: false,
    canUseProScan: false,
    canGenerateZip: false,
    canGeneratePdf: false,
    canUseCustomCategories: false
  },
  starter: {
    maxProperties: 2,
    monthlyStandardScans: 40,
    monthlyPlusScans: 5,
    monthlyProScans: 0,
    monthlyReports: 10,
    canUsePlusScan: true,
    canUseProScan: false,
    canGenerateZip: true,
    canGeneratePdf: true,
    canUseCustomCategories: false
  },
  pro: {
    maxProperties: 10,
    monthlyStandardScans: 150,
    monthlyPlusScans: 40,
    monthlyProScans: 20,
    monthlyReports: 50,
    canUsePlusScan: true,
    canUseProScan: true,
    canGenerateZip: true,
    canGeneratePdf: true,
    canUseCustomCategories: true
  }
};

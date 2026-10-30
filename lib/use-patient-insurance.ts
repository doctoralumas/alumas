"use client";

import { useCallback, useEffect, useState } from "react";
import {
  InsuranceDomainError,
  validatePatientInsurancePreferenceInput,
  type CatalogNetworkOption,
  type CatalogProductOption,
  type InsuranceProductType,
} from "@/lib/insurance-domain";

export interface PublicInsurerCatalogItem {
  id: string;
  name: string;
  slug: string;
  legalName?: string | null;
  seddkLicenseRef?: string | null;
  tsbMemberCode?: string | null;
  headquartersCity?: string | null;
  headquartersDistrict?: string | null;
  website?: string | null;
  phone?: string | null;
  claimsPhone?: string | null;
  provisionPortalUrl?: string | null;
  description?: string | null;
  supportedProductTypes?: InsuranceProductType[];
  products?: CatalogProductOption[];
  networks?: CatalogNetworkOption[];
  isVerifiedOrganization?: boolean;
  verifiedOrganizationSlug?: string | null;
  confirmedAgreementCount?: number;
  declaredAgreementCount?: number;
  canClaim?: boolean;
  claimBlockReason?: string | null;
}

export interface PatientInsurancePreferenceItem {
  id: string;
  userId?: string | null;
  insuranceProviderId: string;
  productType: InsuranceProductType | null;
  productId: string | null;
  networkId: string | null;
  isPrimary: boolean;
  isActiveDiscovery: boolean;
  includePublicSgk: boolean;
  policyLabel: string | null;
  insuranceProvider?: {
    id: string;
    name: string;
    slug: string;
    website?: string | null;
    phone?: string | null;
  } | null;
  networkName?: string | null;
}

const STORAGE_KEY = "alumas_patient_insurance_prefs_v2";
const STORAGE_USER_KEY = "alumas_patient_insurance_user_v2";
const EVENT_NAME = "alumas:insurance-prefs-updated";

function readStoredPreferences(): PatientInsurancePreferenceItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function readStoredUserId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(STORAGE_USER_KEY);
  } catch {
    return null;
  }
}

function writeStoredPreferences(prefs: PatientInsurancePreferenceItem[], userId?: string | null) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    if (userId !== undefined) {
      if (userId) {
        window.localStorage.setItem(STORAGE_USER_KEY, userId);
      } else {
        window.localStorage.removeItem(STORAGE_USER_KEY);
      }
    }
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: prefs }));
  } catch {
    // Ignore storage quota errors
  }
}

export function usePatientInsurance(options: { isLoggedIn?: boolean; syncServer?: boolean } = {}) {
  const [insurers, setInsurers] = useState<PublicInsurerCatalogItem[]>([]);
  const [preferences, setPreferences] = useState<PatientInsurancePreferenceItem[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(Boolean(options.isLoggedIn));
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allowServerCheck =
    options.isLoggedIn !== false &&
    options.syncServer !== false &&
    process.env.NEXT_PUBLIC_DISABLE_INSURANCE_DB_WRITES !== "true";

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const insurerRes = await fetch("/api/insurance");
      const insurerList: PublicInsurerCatalogItem[] = insurerRes.ok ? await insurerRes.json() : [];
      const validInsurers = Array.isArray(insurerList)
        ? insurerList.filter((i) => i.slug !== "alumas-demo-sigorta")
        : [];
      setInsurers(validInsurers);

      if (allowServerCheck) {
        const prefRes = await fetch("/api/user/insurance-preferences");
        if (prefRes.status === 401) {
          setIsAuthenticated(false);
          setCurrentUserId(null);
          // If localStorage belonged to a previously logged-in user, clear it on guest transition
          if (readStoredUserId()) {
            writeStoredPreferences([], null);
            setPreferences([]);
            return;
          }
        } else if (prefRes.ok) {
          const payload = await prefRes.json();
          const srvUserId: string | null = payload?.userId || null;
          setIsAuthenticated(true);
          setCurrentUserId(srvUserId);

          const serverList: any[] = Array.isArray(payload?.data) ? payload.data : [];
          // Server is authoritative for authenticated users (even when serverList is empty `[]`)
          const mapped = serverList.map((srv) => {
            const catalogInsurer =
              validInsurers.find((i) => i.id === srv.insuranceProviderId) || null;
            const insurerObj = srv.insuranceProvider || catalogInsurer || null;
            const resolvedNetId = srv.networkId ?? srv.network?.id ?? null;
            const resolvedProdType = srv.productType ?? srv.product?.productType ?? null;
            const netObj = catalogInsurer?.networks?.find(
              (n: CatalogNetworkOption) =>
                n.id === resolvedNetId || n.slug === resolvedNetId || n.code === resolvedNetId
            );
            return {
              id: srv.id,
              userId: srv.userId || srvUserId,
              insuranceProviderId: srv.insuranceProviderId,
              productType: resolvedProdType,
              productId: srv.productId ?? srv.product?.id ?? null,
              networkId: resolvedNetId,
              isPrimary: Boolean(srv.isPrimary),
              isActiveDiscovery:
                srv.isActiveDiscovery !== undefined
                  ? Boolean(srv.isActiveDiscovery)
                  : Boolean(srv.isPrimary),
              includePublicSgk: Boolean(srv.includePublicSgk),
              policyLabel: srv.policyLabel ?? null,
              insuranceProvider: insurerObj,
              networkName: srv.network?.name || netObj?.name || null,
            } satisfies PatientInsurancePreferenceItem;
          });
          setPreferences(mapped);
          writeStoredPreferences(mapped, srvUserId);
          return;
        }
      }

      // Guest local preferences hydration
      const localPrefs = readStoredPreferences();
      const hydratedLocal = localPrefs.map((lp) => {
        const catalogInsurer = validInsurers.find(
          (i) => i.id === lp.insuranceProviderId || i.slug === lp.insuranceProviderId
        );
        const insurerObj = catalogInsurer || lp.insuranceProvider || null;
        const netObj = catalogInsurer?.networks?.find(
          (n: CatalogNetworkOption) =>
            n.id === lp.networkId || n.slug === lp.networkId || n.code === lp.networkId
        );
        return {
          ...lp,
          insuranceProviderId: insurerObj?.id || lp.insuranceProviderId,
          insuranceProvider: insurerObj,
          networkName: netObj?.name || lp.networkName || null,
        };
      });
      setPreferences(hydratedLocal);
    } catch {
      if (!options.isLoggedIn && !isAuthenticated) {
        setPreferences(readStoredPreferences());
      }
    } finally {
      setLoading(false);
    }
  }, [allowServerCheck, isAuthenticated, options.isLoggedIn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handler = (event: Event) => {
      const custom = event as CustomEvent<PatientInsurancePreferenceItem[]>;
      if (Array.isArray(custom.detail)) {
        setPreferences(custom.detail);
      } else {
        setPreferences(readStoredPreferences());
      }
    };
    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const requireServerPersistence =
    allowServerCheck && (Boolean(options.isLoggedIn) || isAuthenticated);

  const savePreference = useCallback(
    async (
      rawInput: {
        id?: string | null;
        insuranceProviderId: string;
        productType?: InsuranceProductType | string | null;
        productId?: string | null;
        networkId?: string | null;
        isPrimary?: boolean;
        isActiveDiscovery?: boolean;
        includePublicSgk?: boolean;
        policyLabel?: string | null;
      }
    ): Promise<{ ok: boolean; error?: string }> => {
      setError(null);
      try {
        const validated = validatePatientInsurancePreferenceInput(rawInput as Record<string, unknown>);
        const insurer = insurers.find(
          (i) => i.id === validated.insuranceProviderId || i.slug === validated.insuranceProviderId
        );
        if (!insurer || insurer.slug === "alumas-demo-sigorta") {
          const msg = "Seçilen sigorta kurumu bulunamadı veya aktif değil.";
          setError(msg);
          return { ok: false, error: msg };
        }

        const current = preferences;
        const isFirst = current.length === 0;
        const makePrimary = validated.isPrimary || isFirst;

        const netObj = insurer.networks?.find(
          (n) =>
            n.id === validated.networkId ||
            n.slug === validated.networkId ||
            n.code === validated.networkId
        );

        let savedId = rawInput.id || `pref_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        let resolvedServerRow: any = null;

        if (requireServerPersistence) {
          const method = rawInput.id && !rawInput.id.startsWith("pref_") ? "PATCH" : "POST";
          let res: Response;
          try {
            res = await fetch("/api/user/insurance-preferences", {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                ...(method === "PATCH" ? { id: rawInput.id } : {}),
                ...validated,
                insuranceProviderId: insurer.id,
                isPrimary: makePrimary,
                isActiveDiscovery: makePrimary ? true : validated.isActiveDiscovery,
              }),
            });
          } catch {
            const msg = "Sunucu bağlantısı kurulamadı. Sigorta tercihiniz kaydedilemedi.";
            setError(msg);
            return { ok: false, error: msg };
          }

          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            const msg = errJson.error || "Sigorta tercihi sunucuya kaydedilemedi.";
            setError(msg);
            return { ok: false, error: msg };
          }

          const payload = await res.json().catch(() => null);
          if (!payload?.ok || !payload?.data?.id) {
            const msg = "Sunucu yanıtı doğrulanamadı. Sigorta tercihi kaydedilemedi.";
            setError(msg);
            return { ok: false, error: msg };
          }
          savedId = payload.data.id;
          resolvedServerRow = payload.data;
        }

        const nextItem: PatientInsurancePreferenceItem = {
          id: savedId,
          userId: resolvedServerRow?.userId || currentUserId,
          insuranceProviderId: insurer.id,
          productType: resolvedServerRow?.productType ?? validated.productType,
          productId: resolvedServerRow?.productId ?? validated.productId,
          networkId: resolvedServerRow?.networkId ?? validated.networkId,
          isPrimary: resolvedServerRow ? Boolean(resolvedServerRow.isPrimary) : makePrimary,
          isActiveDiscovery: resolvedServerRow
            ? Boolean(resolvedServerRow.isActiveDiscovery ?? resolvedServerRow.isPrimary)
            : makePrimary
            ? true
            : validated.isActiveDiscovery,
          includePublicSgk: resolvedServerRow
            ? Boolean(resolvedServerRow.includePublicSgk)
            : validated.includePublicSgk,
          policyLabel: resolvedServerRow ? resolvedServerRow.policyLabel ?? null : validated.policyLabel,
          insuranceProvider: {
            id: insurer.id,
            name: insurer.name,
            slug: insurer.slug,
            website: insurer.website,
            phone: insurer.phone,
          },
          networkName: resolvedServerRow?.network?.name || netObj?.name || null,
        };

        let nextList: PatientInsurancePreferenceItem[];
        const existingIndex = current.findIndex(
          (item) =>
            (rawInput.id && item.id === rawInput.id) ||
            item.id === savedId ||
            (item.insuranceProviderId === nextItem.insuranceProviderId &&
              (item.productType || null) === (nextItem.productType || null) &&
              (item.networkId || null) === (nextItem.networkId || null))
        );

        if (existingIndex >= 0) {
          nextList = current.map((item, idx) =>
            idx === existingIndex
              ? nextItem
              : nextItem.isPrimary
              ? { ...item, isPrimary: false, isActiveDiscovery: false }
              : item
          );
        } else {
          nextList = [
            ...(nextItem.isPrimary
              ? current.map((item) => ({ ...item, isPrimary: false, isActiveDiscovery: false }))
              : current),
            nextItem,
          ];
        }

        setPreferences(nextList);
        writeStoredPreferences(nextList, currentUserId);
        return { ok: true };
      } catch (err) {
        const msg =
          err instanceof InsuranceDomainError
            ? err.message
            : "Sigorta tercihi doğrulanamadı.";
        setError(msg);
        return { ok: false, error: msg };
      }
    },
    [currentUserId, insurers, preferences, requireServerPersistence]
  );

  const setActiveDiscoveryPreference = useCallback(
    async (preferenceId: string): Promise<{ ok: boolean; error?: string }> => {
      setError(null);
      const target = preferences.find((p) => p.id === preferenceId);
      if (!target) {
        const msg = "Seçilen sigorta tercihi bulunamadı.";
        setError(msg);
        return { ok: false, error: msg };
      }

      if (requireServerPersistence) {
        try {
          const res = await fetch("/api/user/insurance-preferences", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: preferenceId,
              insuranceProviderId: target.insuranceProviderId,
              productType: target.productType,
              productId: target.productId,
              networkId: target.networkId,
              isPrimary: true,
              isActiveDiscovery: true,
              includePublicSgk: target.includePublicSgk,
              policyLabel: target.policyLabel,
            }),
          });
          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            const msg = errJson.error || "Aktif sigorta tercihi güncellenemedi.";
            setError(msg);
            return { ok: false, error: msg };
          }
        } catch {
          const msg = "Sunucu bağlantısı kurulamadı. Aktif sigorta tercihi güncellenemedi.";
          setError(msg);
          return { ok: false, error: msg };
        }
      }

      const nextList = preferences.map((item) => ({
        ...item,
        isPrimary: item.id === preferenceId,
        isActiveDiscovery: item.id === preferenceId,
      }));
      setPreferences(nextList);
      writeStoredPreferences(nextList, currentUserId);
      return { ok: true };
    },
    [currentUserId, preferences, requireServerPersistence]
  );

  const removePreference = useCallback(
    async (preferenceId: string): Promise<{ ok: boolean; error?: string }> => {
      setError(null);
      if (requireServerPersistence) {
        try {
          const res = await fetch(
            `/api/user/insurance-preferences?id=${encodeURIComponent(preferenceId)}`,
            { method: "DELETE" }
          );
          if (!res.ok) {
            const errJson = await res.json().catch(() => ({}));
            const msg = errJson.error || "Sigorta tercihi silinemedi.";
            setError(msg);
            return { ok: false, error: msg };
          }
        } catch {
          const msg = "Sunucu bağlantısı kurulamadı. Sigorta tercihi silinemedi.";
          setError(msg);
          return { ok: false, error: msg };
        }
      }

      const remaining = preferences.filter((item) => item.id !== preferenceId);
      if (remaining.length > 0 && !remaining.some((item) => item.isPrimary)) {
        remaining[0] = { ...remaining[0], isPrimary: true, isActiveDiscovery: true };
      }
      setPreferences(remaining);
      writeStoredPreferences(remaining, currentUserId);
      return { ok: true };
    },
    [currentUserId, preferences, requireServerPersistence]
  );

  const activePreference =
    preferences.find((p) => p.isPrimary) ||
    preferences.find((p) => p.isActiveDiscovery) ||
    preferences[0] ||
    null;

  return {
    insurers,
    preferences,
    activePreference,
    isAuthenticated,
    loading,
    error,
    setError,
    savePreference,
    setActiveDiscoveryPreference,
    removePreference,
    refresh,
  };
}

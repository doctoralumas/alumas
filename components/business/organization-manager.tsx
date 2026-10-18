"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  IMAGING_MODALITIES,
  LAB_CATEGORIES,
  LAB_SAMPLE_TYPES,
  imagingModalityLabel,
  labCategoryLabel,
  labSampleLabel,
} from "@/lib/organization-capabilities";
import ResultDelivery from "@/components/business/result-delivery";
import HomeVisitQueue from "@/components/business/home-visit-queue";
import VerificationDocumentManager from "@/components/verification-document-manager";
import {
  MapPin,
  FirstAid,
  ListDashes,
  EnvelopeSimpleOpen,
  Clock,
  UsersThree,
  Megaphone,
  Ambulance,
  Pill,
  Heartbeat,
  Flask,
  Info,
  CaretDown,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react/dist/ssr";

type Props = { org: any, globalInsurances?: any[] };

const emptyExam = {
  modality: "MR",
  name: "",
  bodyRegion: "",
  preparation: "",
  durationMinutes: "",
  reportHours: "",
  price: "",
};
const emptyTest = {
  category: "BIYOKIMYA",
  sampleType: "KAN",
  name: "",
  fastingHours: "",
  turnaroundHours: "",
  preparation: "",
  price: "",
  homeCollection: false,
};

export default function OrganizationManager({ org, globalInsurances = [] }: Props) {
  const t = useTranslations("professional.orgManager");
  const locale = useLocale();
  const dateLocale = locale === "en" ? "en-US" : "tr-TR";
  const days = [
    t("days.0"),
    t("days.1"),
    t("days.2"),
    t("days.3"),
    t("days.4"),
    t("days.5"),
    t("days.6"),
  ];
  const panelCopy: Record<string, string> = {
    HOSPITAL: t("panelCopy.HOSPITAL"),
    CLINIC: t("panelCopy.CLINIC"),
    PHARMACY: t("panelCopy.PHARMACY"),
    IMAGING_CENTER: t("panelCopy.IMAGING_CENTER"),
    LABORATORY: t("panelCopy.LABORATORY"),
  };
  const clinical = org.type === "HOSPITAL" || org.type === "CLINIC";
  const hospital = org.type === "HOSPITAL";
  const pharmacy = org.type === "PHARMACY";
  const imaging = org.type === "IMAGING_CENTER";
  const laboratory = org.type === "LABORATORY";
  const [currentStatus, setCurrentStatus] = useState<string>(org.status || "PENDING");
  const [resubmitting, setResubmitting] = useState(false);
  const isApproved = currentStatus === "APPROVED" && !!org.isPublished;

  const [msg, setMsg] = useState("");

  const [onDuty, setOnDuty] = useState(!!org.isOnDuty);
  const [onDutyUntil, setOnDutyUntil] = useState(
    org.onDutyUntil ? new Date(org.onDutyUntil).toISOString().slice(0, 16) : ""
  );

  const [hours, setHours] = useState<any[]>(org.hours || []);
  const [hoursSaved, setHoursSaved] = useState(false);
  const [stock, setStock] = useState<any[]>(org.stocks || []);
  const [invites, setInvites] = useState<any[]>(org.doctorInvites || []);
  const [doctors, setDoctors] = useState<any[]>(org.doctors || []);

  const [services, setServices] = useState<any[]>(
    (org.services || []).filter((item: any) => item.isActive !== false)
  );
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    price: "",
    homeCareKind: "",
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  const [variantForm, setVariantForm] = useState({
    serviceId: "",
    label: "",
    priceDelta: "",
    durationMinutes: "",
  });

  const [departments, setDepartments] = useState<any[]>(
    (org.departments || []).filter((item: any) => item.isActive !== false)
  );
  const [departmentForm, setDepartmentForm] = useState({
    name: "",
    floor: "",
    phone: "",
    description: "",
  });
  const [editingDepartmentId, setEditingDepartmentId] = useState<string | null>(
    null
  );

  const [campaigns, setCampaigns] = useState<any[]>(org.campaigns || []);
  const [campaignForm, setCampaignForm] = useState({
    title: "",
    description: "",
    startsAt: "",
    endsAt: "",
    isActive: true,
  });
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(
    null
  );

  const [emergencyServices, setEmergencyServices] = useState<any[]>(
    (org.emergencyServices || []).filter((item: any) => item.isActive !== false)
  );
  const [emergencyForm, setEmergencyForm] = useState({
    name: "",
    kind: "EMERGENCY_DEPARTMENT",
    phone: "",
    is24Hours: false,
    description: "",
  });
  const [editingEmergencyId, setEditingEmergencyId] = useState<string | null>(
    null
  );

  const [exams, setExams] = useState<any[]>(org.imagingExams || []);
  const [examForm, setExamForm] = useState(emptyExam);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);

  const [tests, setTests] = useState<any[]>(org.laboratoryTests || []);
  const [testForm, setTestForm] = useState(emptyTest);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  const [insuranceContracts, setInsuranceContracts] = useState<any[]>(org.insuranceContracts || []);
  const [insuranceForm, setInsuranceForm] = useState({ providerId: "", note: "" });

  async function addInsurance(e: any) {
    e.preventDefault();
    if (!insuranceForm.providerId) return;
    const r = await fetch("/api/organizations/" + org.id + "/insurance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ insuranceProviderId: insuranceForm.providerId, note: insuranceForm.note }),
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || t("insuranceAddFailed"));
    setInsuranceContracts(x => {
      const filtered = x.filter(c => c.insuranceProviderId !== j.insuranceProviderId);
      return [j, ...filtered];
    });
    setInsuranceForm({ providerId: "", note: "" });
    setMsg(t("insuranceAdded"));
  }
  async function removeInsurance(providerId: string) {
    const r = await fetch("/api/organizations/" + org.id + "/insurance?providerId=" + providerId, { method: "DELETE" });
    if (r.ok) {
      setInsuranceContracts(x => x.filter(i => i.insuranceProviderId !== providerId));
      setMsg(t("insuranceRemoved"));
    }
  }


  async function saveDepartment(e: any) {
    e.preventDefault();
    const payload = { ...departmentForm, departmentId: editingDepartmentId };
    const r = await fetch(`/api/organizations/` + org.id + `/departments`, {
      method: editingDepartmentId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || t("departmentSaveFailed"));
    setDepartments((x) =>
      editingDepartmentId
        ? x.map((item) => (item.id === j.id ? j : item))
        : [...x, j]
    );
    setDepartmentForm({ name: "", floor: "", phone: "", description: "" });
    setEditingDepartmentId(null);
    setMsg(editingDepartmentId ? t("departmentUpdated") : t("departmentAdded"));
  }
  function editDepartment(item: any) {
    setEditingDepartmentId(item.id);
    setDepartmentForm({
      name: item.name,
      floor: item.floor || "",
      phone: item.phone || "",
      description: item.description || "",
    });
  }
  async function removeDepartment(id: string) {
    const r = await fetch(`/api/organizations/` + org.id + `/departments`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ departmentId: id, isActive: false }),
    });
    if (r.ok) {
      setDepartments((x) => x.filter((i) => i.id !== id));
      setDoctors((current) =>
        current.map((doctor) =>
          doctor.departmentId === id
            ? { ...doctor, departmentId: null }
            : doctor
        )
      );
      setMsg(t("departmentRemoved"));
      if (editingDepartmentId === id) {
        setEditingDepartmentId(null);
        setDepartmentForm({ name: "", floor: "", phone: "", description: "" });
      }
    }
  }

  async function saveCampaign(e: any) {
    e.preventDefault();
    const payload = { ...campaignForm, campaignId: editingCampaignId };
    const r = await fetch(`/api/organizations/` + org.id + `/campaigns`, {
      method: editingCampaignId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || t("campaignSaveFailed"));
    setCampaigns((x) =>
      editingCampaignId
        ? x.map((item) => (item.id === j.id ? j : item))
        : [j, ...x]
    );
    setCampaignForm({
      title: "",
      description: "",
      startsAt: "",
      endsAt: "",
      isActive: true,
    });
    setEditingCampaignId(null);
    setMsg(editingCampaignId ? t("campaignUpdated") : t("campaignAdded"));
  }
  function editCampaign(item: any) {
    setEditingCampaignId(item.id);
    setCampaignForm({
      title: item.title,
      description: item.description || "",
      startsAt: item.startsAt
        ? new Date(item.startsAt).toISOString().split("T")[0]
        : "",
      endsAt: item.endsAt
        ? new Date(item.endsAt).toISOString().split("T")[0]
        : "",
      isActive: !!item.isActive,
    });
  }
  async function toggleCampaign(id: string, active: boolean) {
    const r = await fetch(`/api/organizations/` + org.id + `/campaigns`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ campaignId: id, isActive: active }),
    });
    if (r.ok)
      setCampaigns((x) =>
        x.map((i) => (i.id === id ? { ...i, isActive: active } : i))
      );
  }
  async function removeCampaign(id: string) {
    const r = await fetch(
      `/api/organizations/` + org.id + `/campaigns?campaignId=` + id,
      { method: "DELETE" }
    );
    if (r.ok) {
      setCampaigns((x) => x.filter((i) => i.id !== id));
      setMsg(t("campaignRemoved"));
      if (editingCampaignId === id) {
        setEditingCampaignId(null);
        setCampaignForm({
          title: "",
          description: "",
          startsAt: "",
          endsAt: "",
          isActive: true,
        });
      }
    }
  }

  async function saveService(e: any) {
    e.preventDefault();
    const payload = { ...serviceForm, serviceId: editingServiceId };
    const r = await fetch(`/api/organizations/` + org.id + `/services`, {
      method: editingServiceId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || t("serviceSaveFailed"));
    setServices((x) =>
      editingServiceId
        ? x.map((item) => (item.id === j.id ? { ...item, ...j } : item))
        : [...x, j]
    );
    setServiceForm({ name: "", description: "", price: "", homeCareKind: "" });
    setEditingServiceId(null);
    setMsg(editingServiceId ? t("serviceUpdated") : t("serviceAdded"));
  }
  function editService(item: any) {
    setEditingServiceId(item.id);
    setServiceForm({
      name: item.name,
      description: item.description || "",
      price: item.price ?? "",
      homeCareKind: item.homeCareKind || "",
    });
  }
  async function removeService(id: string) {
    const r = await fetch(`/api/organizations/` + org.id + `/services`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ serviceId: id, isActive: false }),
    });
    if (r.ok) {
      setServices((x) => x.filter((i) => i.id !== id));
      setMsg(t("serviceRemoved"));
      if (editingServiceId === id) {
        setEditingServiceId(null);
        setServiceForm({
          name: "",
          description: "",
          price: "",
          homeCareKind: "",
        });
      }
    }
  }

  async function saveEmergency(e: any) {
    e.preventDefault();
    const payload = { ...emergencyForm, emergencyId: editingEmergencyId };
    const r = await fetch(
      `/api/organizations/` + org.id + `/emergency-services`,
      {
        method: editingEmergencyId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || t("emergencySaveFailed"));
    setEmergencyServices((x) =>
      editingEmergencyId
        ? x.map((item) => (item.id === j.id ? j : item))
        : [...x, j]
    );
    setEmergencyForm({
      name: "",
      kind: "EMERGENCY_DEPARTMENT",
      phone: "",
      is24Hours: false,
      description: "",
    });
    setEditingEmergencyId(null);
    setMsg(
      editingEmergencyId ? t("emergencyUpdated") : t("emergencyAdded")
    );
  }
  function editEmergency(item: any) {
    setEditingEmergencyId(item.id);
    setEmergencyForm({
      name: item.name,
      kind: item.kind,
      phone: item.phone || "",
      is24Hours: !!item.is24Hours,
      description: item.description || "",
    });
  }
  async function removeEmergency(id: string) {
    const r = await fetch(
      `/api/organizations/` + org.id + `/emergency-services`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emergencyId: id, isActive: false }),
      }
    );
    if (r.ok) {
      setEmergencyServices((x) => x.filter((i) => i.id !== id));
      setMsg(t("emergencyRemoved"));
      if (editingEmergencyId === id) {
        setEditingEmergencyId(null);
        setEmergencyForm({
          name: "",
          kind: "EMERGENCY_DEPARTMENT",
          phone: "",
          is24Hours: false,
          description: "",
        });
      }
    }
  }

  async function addVariant(e: any) {
    e.preventDefault();
    const payload = { ...variantForm };
    const r = await fetch(
      `/api/organizations/` + org.id + `/service-variants`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const j = await r.json();
    if (r.ok) {
      setServices((x) =>
        x.map((s) =>
          s.id === j.serviceId
            ? { ...s, variants: [...(s.variants || []), j] }
            : s
        )
      );
      setVariantForm({
        serviceId: "",
        label: "",
        priceDelta: "",
        durationMinutes: "",
      });
      setMsg(t("variantAdded"));
    } else setMsg(j.error);
  }
  async function removeVariant(serviceId: string, variantId: string) {
    const r = await fetch(
      `/api/organizations/` + org.id + `/service-variants`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variantId, isActive: false }),
      }
    );
    if (r.ok) {
      setServices((current) =>
        current.map((item) =>
          item.id === serviceId
            ? {
                ...item,
                variants: (item.variants || []).filter(
                  (v: any) => v.id !== variantId
                ),
              }
            : item
        )
      );
      setMsg(t("variantRemoved"));
    }
  }

  async function invite(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(`/api/organizations/` + org.id + `/invites`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: f.get("email"),
        specialty: f.get("specialty"),
      }),
    });
    const j = await r.json();
    if (r.ok) {
      setInvites((x) => [j, ...x]);
      form.reset();
      setMsg(t("inviteSent"));
    } else setMsg(j.error);
  }

  async function saveHours() {
    const payload = days.map((_, weekday) => {
      const row = hours.find((h: any) => h.weekday === weekday) || {};
      return {
        weekday,
        isClosed: !!row.isClosed,
        opensAt: row.opensAt || "09:00",
        closesAt: row.closesAt || "18:00",
      };
    });
    const r = await fetch(`/api/organizations/` + org.id + `/hours`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ hours: payload }),
    });
    if (r.ok) {
      setHoursSaved(true);
      setTimeout(() => setHoursSaved(false), 2000);
    } else {
      setMsg(t("hoursSaveFailed"));
    }
  }
  function updateHour(day: number, key: string, value: any) {
    setHours((prev: any[]) => {
      const rest = prev.filter((h) => h.weekday !== day);
      const old = prev.find((h) => h.weekday === day) || {
        weekday: day,
        opensAt: "09:00",
        closesAt: "18:00",
        isClosed: false,
      };
      return [...rest, { ...old, [key]: value }];
    });
  }
  async function locate() {
    setMsg(t("locatingMessage"));
    const r = await fetch("/api/maps/geocode", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query:
          org.address +
          ", " +
          (org.district || "") +
          ", " +
          org.city +
          ", Türkiye",
      }),
    });
    const j = await r.json();
    if (!r.ok) {
      setMsg(j.error || t("locationNotFound"));
      return;
    }
    const u = await fetch(`/api/organizations/` + org.id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(j),
    });
    setMsg(u.ok ? t("locationSaved") : t("locationSaveFailed"));
  }
  async function saveDuty() {
    const r = await fetch(`/api/organizations/` + org.id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        isOnDuty: onDuty,
        onDutyUntil:
          onDuty && onDutyUntil ? new Date(onDutyUntil).toISOString() : null,
      }),
    });
    setMsg(
      r.ok ? t("dutyStatusUpdated") : t("dutyStatusSaveFailed")
    );
  }

  async function assignDepartment(doctorId: string, departmentId: string) {
    const r = await fetch(
      `/api/organizations/` + org.id + `/doctor-department`,
      {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ doctorId, departmentId: departmentId || null }),
      }
    );
    if (r.ok) {
      setDoctors((x) =>
        x.map((d) =>
          d.id === doctorId ? { ...d, departmentId: departmentId || null } : d
        )
      );
      setMsg(t("doctorDepartmentUpdated"));
    } else setMsg(t("doctorDepartmentAssignFailed"));
  }

  async function addStock(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(`/api/organizations/` + org.id + `/stock`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        itemName: f.get("itemName"),
        stockStatus: f.get("stockStatus"),
        quantity: f.get("quantity"),
      }),
    });
    const j = await r.json();
    if (r.ok) {
      setStock((x) => [...x.filter((s) => s.itemName !== j.itemName), j]);
      form.reset();
      setMsg(t("stockUpdated"));
    } else setMsg(j.error);
  }
  async function updateStock(stockId: string, stockStatus: string) {
    const response = await fetch(`/api/organizations/` + org.id + `/stock`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stockId, stockStatus }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMsg(data.error || t("stockUpdateFailed"));
      return;
    }
    setStock((current) =>
      current.map((item) => (item.id === data.id ? data : item))
    );
    setMsg(t("stockStatusUpdated"));
  }
  async function removeStock(stockId: string) {
    const response = await fetch(
      `/api/organizations/` + org.id + `/stock?stockId=` + stockId,
      { method: "DELETE" }
    );
    if (!response.ok) {
      setMsg(t("stockRemoveFailed"));
      return;
    }
    setStock((current) => current.filter((item) => item.id !== stockId));
    setMsg(t("stockRemoved"));
  }

  function editExam(exam: any) {
    setEditingExamId(exam.id);
    setExamForm({
      modality: exam.modality,
      name: exam.name || "",
      bodyRegion: exam.bodyRegion || "",
      preparation: exam.preparation || "",
      durationMinutes: exam.durationMinutes ?? "",
      reportHours: exam.reportHours ?? "",
      price: exam.price ?? "",
    });
  }
  async function saveExam(e: any) {
    e.preventDefault();
    const payload = { ...examForm, examId: editingExamId };
    const r = await fetch(`/api/organizations/` + org.id + `/imaging-exams`, {
      method: editingExamId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) {
      setMsg(j.error || t("examSaveFailed"));
      return;
    }
    setExams((current) =>
      editingExamId
        ? current.map((item) => (item.id === j.id ? j : item))
        : [...current, j]
    );
    setExamForm(emptyExam);
    setEditingExamId(null);
    setMsg(editingExamId ? t("examUpdated") : t("examAdded"));
  }
  async function removeExam(id: string) {
    const r = await fetch(
      `/api/organizations/` + org.id + `/imaging-exams?examId=` + id,
      { method: "DELETE" }
    );
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(j.error || t("examRemoveFailed"));
      return;
    }
    setExams((current) => current.filter((item) => item.id !== id));
    if (editingExamId === id) {
      setEditingExamId(null);
      setExamForm(emptyExam);
    }
    setMsg(t("examRemoved"));
  }
  function editTest(test: any) {
    setEditingTestId(test.id);
    setTestForm({
      category: test.category,
      sampleType: test.sampleType,
      name: test.name || "",
      fastingHours: test.fastingHours ?? "",
      turnaroundHours: test.turnaroundHours ?? "",
      preparation: test.preparation || "",
      price: test.price ?? "",
      homeCollection: !!test.homeCollection,
    });
  }
  async function saveTest(e: any) {
    e.preventDefault();
    const payload = { ...testForm, testId: editingTestId };
    const r = await fetch(
      `/api/organizations/` + org.id + `/laboratory-tests`,
      {
        method: editingTestId ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const j = await r.json();
    if (!r.ok) {
      setMsg(j.error || t("testSaveFailed"));
      return;
    }
    setTests((current) =>
      editingTestId
        ? current.map((item) => (item.id === j.id ? j : item))
        : [...current, j]
    );
    setTestForm(emptyTest);
    setEditingTestId(null);
    setMsg(editingTestId ? t("testUpdated") : t("testAdded"));
  }
  async function removeTest(id: string) {
    const r = await fetch(
      `/api/organizations/` + org.id + `/laboratory-tests?testId=` + id,
      { method: "DELETE" }
    );
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(j.error || t("testRemoveFailed"));
      return;
    }
    setTests((current) => current.filter((item) => item.id !== id));
    if (editingTestId === id) {
      setEditingTestId(null);
      setTestForm(emptyTest);
    }
    setMsg(t("testRemoved"));
  }

  async function resubmitApplication() {
    setResubmitting(true);
    setMsg(t("resubmitting"));
    try {
      const r = await fetch(`/api/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resubmit: true }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        setMsg(j.error || t("resubmitError"));
        return;
      }
      setCurrentStatus("PENDING");
      setMsg(t("resubmitSuccess"));
    } catch {
      setMsg(t("resubmitError"));
    } finally {
      setResubmitting(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          background: "#f8fafc",
          padding: "16px 20px",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "24px",
        }}
      >
        <Info size={24} weight="duotone" color="#3b82f6" />
        <p className="muted" style={{ margin: 0, fontSize: "15px" }}>
          {panelCopy[org.type] || t("defaultPanelCopy")}
        </p>
      </div>

      {currentStatus === "PENDING" && (
        <div
          data-testid="org-status-banner-pending"
          style={{
            background: "#fffbeb",
            padding: "16px 20px",
            borderRadius: "16px",
            border: "1px solid #fde68a",
            color: "#92400e",
            marginBottom: "24px",
            fontSize: "14px",
            lineHeight: 1.5,
          }}
        >
          <strong>{t("pendingReviewTitle")}:</strong> {t("pendingReviewDesc")}
        </div>
      )}

      {currentStatus === "REJECTED" && (
        <div
          data-testid="org-status-banner-rejected"
          style={{
            background: "#fef2f2",
            padding: "18px 20px",
            borderRadius: "16px",
            border: "1px solid #fecaca",
            color: "#991b1b",
            marginBottom: "24px",
            fontSize: "14px",
            lineHeight: 1.55,
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <div>
            <strong style={{ display: "block", fontSize: "15px", marginBottom: "4px" }}>
              {t("rejectedReviewTitle")}
            </strong>
            <span>{t("rejectedReviewDesc")}</span>
          </div>
          {org.rejectionReason && (
            <div
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                background: "#ffffff",
                border: "1px solid #fecaca",
                color: "#7f1d1d",
                fontWeight: 600,
              }}
            >
              {t("rejectionReasonPrefix")}
              {org.rejectionReason}
            </div>
          )}
          <div>
            <button
              type="button"
              data-testid="org-resubmit-btn"
              disabled={resubmitting}
              onClick={resubmitApplication}
              style={{
                padding: "10px 18px",
                borderRadius: "10px",
                border: "none",
                background: "#dc2626",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "13.5px",
                cursor: resubmitting ? "not-allowed" : "pointer",
                opacity: resubmitting ? 0.7 : 1,
              }}
            >
              {resubmitting ? t("resubmitting") : t("resubmitButton")}
            </button>
          </div>
        </div>
      )}

      {currentStatus === "SUSPENDED" && (
        <div
          data-testid="org-status-banner-suspended"
          style={{
            background: "#fff7ed",
            padding: "16px 20px",
            borderRadius: "16px",
            border: "1px solid #fed7aa",
            color: "#9a3412",
            marginBottom: "24px",
            fontSize: "14px",
            lineHeight: 1.5,
          }}
        >
          <strong>{t("suspendedReviewTitle")}:</strong> {t("suspendedReviewDesc")}
        </div>
      )}

      {msg && (
        <div
          style={{
            background: "#f1f5f9",
            padding: "12px 20px",
            borderRadius: "12px",
            border: "1px solid #cbd5e1",
            fontWeight: 500,
            color: "#0f172a",
            marginBottom: "24px",
          }}
        >
          {msg}
        </div>
      )}

      {/* Genel Bilgiler */}
      <details className="premium-accordion" open>
        <summary className="premium-accordion-summary">
          <div className="premium-accordion-header">
            <div
              className="premium-accordion-icon"
              style={{ background: "#f3f4f6", color: "#4b5563" }}
            >
              <Info size={28} weight="duotone" />
            </div>
            <div>
              <h3 className="premium-accordion-title">{t("generalInfo")}</h3>
              <p className="premium-accordion-desc">
                {t("generalInfoDesc")}
              </p>
            </div>
          </div>
          <CaretDown size={20} className="premium-chevron" />
        </summary>
        <div className="premium-accordion-content">
          <form
            className="responsive-form-grid"
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const payload = {
                name: f.get("name"),
                description: f.get("description"),
                phone: f.get("phone"),
                website: f.get("website"),
                city: f.get("city"),
                district: f.get("district"),
                address: f.get("address"),
              };
              const r = await fetch("/api/organizations/" + org.id, {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify(payload),
              });
              if (r.ok) {
                setMsg(t("msgGeneralInfoUpdated"));
                setTimeout(() => window.location.reload(), 1000);
              } else {
                setMsg(t("msgGeneralInfoUpdateFailed"));
              }
            }}
          >
            <div className="responsive-form-field">
              <label>{t("orgNameLabel")}</label>
              <input name="name" defaultValue={org.name} required />
            </div>
            <div className="responsive-form-field">
              <label>{t("phoneLabel")}</label>
              <input name="phone" defaultValue={org.phone || ""} type="tel" />
            </div>
            <div className="responsive-form-field">
              <label>{t("websiteLabel")}</label>
              <input
                name="website"
                defaultValue={org.website || ""}
                type="url"
              />
            </div>
            <div className="responsive-form-field">
              <label>{t("cityLabel")}</label>
              <input name="city" defaultValue={org.city || ""} required />
            </div>
            <div className="responsive-form-field">
              <label>{t("districtLabel")}</label>
              <input name="district" defaultValue={org.district || ""} />
            </div>
            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label>{t("addressLabel")}</label>
              <input name="address" defaultValue={org.address || ""} required />
            </div>
            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label>{t("aboutLabel")}</label>
              <textarea
                name="description"
                defaultValue={org.description || ""}
                rows={4}
                placeholder={t("aboutPlaceholder")}
              />
            </div>
            <div
              style={{
                gridColumn: "1 / -1",
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "16px",
              }}
            >
              <button className="primary" type="submit">
                {t("updateGeneralInfoBtn")}
              </button>
            </div>
          </form>
        </div>
      </details>

      {/* Anlaşmalı Sigortalar */}
      {isApproved && (
        <details className="premium-accordion">
          <summary className="premium-accordion-summary">
            <div className="premium-accordion-header">
              <div className="premium-accordion-icon" style={{ background: "#e0f2fe", color: "#0ea5e9" }}>
                <Heartbeat size={28} weight="duotone" />
              </div>
              <div>
                <h3 className="premium-accordion-title">{t("insuranceTitle")}</h3>
                <p className="premium-accordion-desc">
                  {t("insuranceDesc")}
                </p>
              </div>
            </div>
            <CaretDown size={20} className="premium-chevron" />
          </summary>
          <div className="premium-accordion-content">
            <form className="responsive-form-grid" onSubmit={addInsurance}>
              <div className="responsive-form-field">
                <label>{t("selectInsuranceLabel")}</label>
                <select 
                  value={insuranceForm.providerId} 
                  onChange={(e) => setInsuranceForm({ ...insuranceForm, providerId: e.target.value })}
                  required
                >
                  <option value="">{t("selectInsurancePlaceholder")}</option>
                  {globalInsurances.map((ins: any) => (
                    <option key={ins.id} value={ins.id}>{ins.name}</option>
                  ))}
                </select>
              </div>
              <div className="responsive-form-field">
                <label>{t("insuranceNoteLabel")}</label>
                <input 
                  placeholder={t("insuranceNotePlaceholder")}
                  value={insuranceForm.note}
                  onChange={(e) => setInsuranceForm({ ...insuranceForm, note: e.target.value })}
                />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <button className="primary" style={{ height: "46px", width: "100%" }}>{t("addInsuranceBtn")}</button>
              </div>
            </form>

            {insuranceContracts.length > 0 && (
              <div className="premium-card-list" style={{ marginTop: "20px" }}>
                {insuranceContracts.map((contract: any) => (
                  <div key={contract.insuranceProviderId} className="premium-card-item">
                    <div>
                      <b style={{ fontSize: "16px", color: "#0f172a" }}>{contract.insuranceProvider?.name}</b>
                      {contract.note && <div style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>{contract.note}</div>}
                    </div>
                    <div className="premium-card-item-actions">
                      <button type="button" className="secondary danger" onClick={() => removeInsurance(contract.insuranceProviderId)}>
                        <Trash size={16} /> {t("cancelContractBtn")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </details>
      )}


      <VerificationDocumentManager
        owner={{
          kind: "organization",
          entityType: org.type,
          organizationId: org.id,
        }}
        documents={org.verificationDocuments || []}
      />

      {isApproved && imaging && (
        <ResultDelivery
          organizationId={org.id}
          kind="imaging"
          catalog={exams.map((exam) => ({
            id: exam.id,
            name: imagingModalityLabel(exam.modality, locale) + " - " + exam.name,
          }))}
        />
      )}
      {isApproved && laboratory && (
        <ResultDelivery
          organizationId={org.id}
          kind="laboratory"
          catalog={tests.map((test) => ({
            id: test.id,
            name: labCategoryLabel(test.category, locale) + " - " + test.name,
          }))}
        />
      )}

      <details className="premium-accordion" open>
        <summary className="premium-accordion-summary">
          <div className="premium-accordion-header">
            <div
              className="premium-accordion-icon"
              style={{ background: "#fef2f2", color: "#ef4444" }}
            >
              <MapPin size={28} weight="duotone" />
            </div>
            <div>
              <h3 className="premium-accordion-title">{t("locationTitle")}</h3>
              <p className="premium-accordion-desc">
                {t("locationDesc")}
              </p>
            </div>
          </div>
          <CaretDown size={24} weight="bold" className="premium-chevron" />
        </summary>
        <div className="premium-accordion-content">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "16px",
              background: "#f8fafc",
              padding: "20px",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "#0f172a",
                }}
              >
                {t("registeredAddress")}
              </h2>
              <p
                className="muted"
                style={{ margin: "4px 0 0", fontSize: "15px" }}
              >
                {org.address} · {org.city}
              </p>
            </div>
            <button className="primary" onClick={locate}>
              {t("locateFromAddressBtn")}
            </button>
          </div>
        </div>
      </details>

      {isApproved && clinical && (
        <details className="premium-accordion" open>
          <summary className="premium-accordion-summary">
            <div className="premium-accordion-header">
              <div
                className="premium-accordion-icon"
                style={{ background: "#eff6ff", color: "#3b82f6" }}
              >
                <FirstAid size={28} weight="duotone" />
              </div>
              <div>
                <h3 className="premium-accordion-title">
                  {org.type === "CLINIC"
                    ? t("consultationsAndProcedures")
                    : t("clinicalServicesTitle")}
                </h3>
                <p className="premium-accordion-desc">
                  {t("clinicalServicesDesc")}
                </p>
              </div>
            </div>
            <CaretDown size={24} weight="bold" className="premium-chevron" />
          </summary>
          <div className="premium-accordion-content">
            <form onSubmit={saveService} className="responsive-form-grid">
              <div className="responsive-form-field">
                <label>
                  {org.type === "CLINIC"
                    ? t("procedureNameLabel")
                    : t("serviceNameLabel")}
                </label>
                <input
                  value={serviceForm.name}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("priceLabel")}</label>
                <input
                  value={serviceForm.price}
                  onChange={(e) =>
                    setServiceForm({ ...serviceForm, price: e.target.value })
                  }
                  type="number"
                  min="0"
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("shortDesc")}</label>
                <input
                  value={serviceForm.description}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("servicePlaceLabel")}</label>
                <select
                  value={serviceForm.homeCareKind}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      homeCareKind: e.target.value,
                    })
                  }
                >
                  <option value="">{t("placeClinicOnly")}</option>
                  <option value="nurse">{t("placeHomeNurse")}</option>
                  <option value="dressing">{t("placeHomeDressing")}</option>
                  <option value="physio">{t("placeHomePhysio")}</option>
                </select>
              </div>
              <div
                style={{ display: "flex", gap: "12px", gridColumn: "1 / -1" }}
              >
                <button className="primary" style={{ height: "46px", flex: 1 }}>
                  {editingServiceId ? t("updateBtn") : t("addServiceBtn")}
                </button>
                {editingServiceId && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setEditingServiceId(null);
                      setServiceForm({
                        name: "",
                        description: "",
                        price: "",
                        homeCareKind: "",
                      });
                    }}
                  >
                    {t("cancelBtn")}
                  </button>
                )}
              </div>
            </form>

            <div className="premium-card-list">
              {services.map((s) => (
                <div key={s.id} className="premium-card-item">
                  <div>
                    <b
                      style={{
                        fontSize: "16px",
                        color: "#0f172a",
                        display: "block",
                      }}
                    >
                      {s.name}
                    </b>
                    <span style={{ color: "#64748b", fontSize: "14px" }}>
                      {[
                        s.price ? `${s.price} ₺` : null,
                        s.homeCareKind === "nurse"
                          ? t("placeHomeNurse")
                          : s.homeCareKind === "dressing"
                          ? t("placeHomeDressing")
                          : s.homeCareKind === "physio"
                          ? t("placeHomePhysio")
                          : t("placeClinicShort"),
                        s.description,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </span>
                  </div>
                  <div
                    className="premium-card-item-actions"
                    style={{ display: "flex", gap: "8px" }}
                  >
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => editService(s)}
                    >
                      <PencilSimple size={16} /> {t("editBtn")}
                    </button>
                    <button
                      className="secondary danger"
                      type="button"
                      onClick={() => removeService(s.id)}
                    >
                      <Trash size={16} /> {t("removeBtn")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {isApproved && clinical && (
        <details className="premium-accordion">
          <summary className="premium-accordion-summary">
            <div className="premium-accordion-header">
              <div
                className="premium-accordion-icon"
                style={{ background: "#fdf4ff", color: "#c026d3" }}
              >
                <ListDashes size={28} weight="duotone" />
              </div>
              <div>
                <h3 className="premium-accordion-title">{t("variantsTitle")}</h3>
                <p className="premium-accordion-desc">
                  {t("variantsDesc")}
                </p>
              </div>
            </div>
            <CaretDown size={24} weight="bold" className="premium-chevron" />
          </summary>
          <div className="premium-accordion-content">
            <form onSubmit={addVariant} className="responsive-form-grid">
              <div className="responsive-form-field">
                <label>{t("serviceLabel")}</label>
                <select
                  value={variantForm.serviceId}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      serviceId: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">{t("selectPlaceholder")}</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="responsive-form-field">
                <label>{t("variantLabelInput")}</label>
                <input
                  value={variantForm.label}
                  onChange={(e) =>
                    setVariantForm({ ...variantForm, label: e.target.value })
                  }
                  required
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("priceDeltaLabel")}</label>
                <input
                  value={variantForm.priceDelta}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      priceDelta: e.target.value,
                    })
                  }
                  type="number"
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("durationMinutesLabel")}</label>
                <input
                  value={variantForm.durationMinutes}
                  onChange={(e) =>
                    setVariantForm({
                      ...variantForm,
                      durationMinutes: e.target.value,
                    })
                  }
                  type="number"
                />
              </div>
              <button className="primary" style={{ height: "46px" }}>
                {t("addVariantBtn")}
              </button>
            </form>
            <div className="premium-card-list">
              {services.flatMap((s) =>
                (s.variants || [])
                  .filter((variant: any) => variant.isActive !== false)
                  .map((v: any) => (
                    <div key={v.id} className="premium-card-item">
                      <div>
                        <b style={{ color: "#0f172a", fontSize: "16px" }}>
                          {s.name}
                        </b>{" "}
                        <span style={{ color: "#64748b" }}>· {v.label}</span>
                        <div
                          style={{
                            fontSize: "14px",
                            color: "#64748b",
                            marginTop: "4px",
                          }}
                        >
                          {v.durationMinutes ? `${v.durationMinutes} ${t("minutesUnit")} ` : ""}
                          {v.priceDelta ? `· +${v.priceDelta} ₺` : ""}
                        </div>
                      </div>
                      <div className="premium-card-item-actions">
                        <button
                          type="button"
                          className="secondary danger"
                          onClick={() => removeVariant(s.id, v.id)}
                        >
                          <Trash size={16} /> {t("removeBtn")}
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </details>
      )}

      {isApproved && clinical && (
        <details className="premium-accordion">
          <summary className="premium-accordion-summary">
            <div className="premium-accordion-header">
              <div
                className="premium-accordion-icon"
                style={{ background: "#f0fdf4", color: "#16a34a" }}
              >
                <EnvelopeSimpleOpen size={28} weight="duotone" />
              </div>
              <div>
                <h3 className="premium-accordion-title">{t("doctorInvitesTitle")}</h3>
                <p className="premium-accordion-desc">
                  {t("doctorInvitesDesc")}
                </p>
              </div>
            </div>
            <CaretDown size={24} weight="bold" className="premium-chevron" />
          </summary>
          <div className="premium-accordion-content">
            <form onSubmit={invite} className="responsive-form-grid">
              <div
                className="responsive-form-field"
                style={{ gridColumn: "span 2" }}
              >
                <label>{t("emailLabel")}</label>
                <input
                  name="email"
                  type="email"
                  placeholder={t("doctorEmailPlaceholder")}
                  required
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("specialtyOptionalLabel")}</label>
                <input name="specialty" placeholder={t("specialtyPlaceholder")} />
              </div>
              <button className="primary" style={{ height: "46px" }}>
                {t("sendInviteBtn")}
              </button>
            </form>
            <div className="premium-card-list">
              {invites.map((i) => (
                <div key={i.id} className="premium-card-item">
                  <div>
                    <b
                      style={{
                        display: "block",
                        color: "#0f172a",
                        fontSize: "16px",
                      }}
                    >
                      {i.email}
                    </b>
                    <span style={{ color: "#64748b", fontSize: "14px" }}>
                      {i.specialty || t("defaultDoctorRole")}
                    </span>
                  </div>
                  <span
                    className="premium-badge"
                    style={{
                      background:
                        i.status === "PENDING" ? "#fff7ed" : "#f0fdf4",
                      color: i.status === "PENDING" ? "#ea580c" : "#16a34a",
                    }}
                  >
                    {i.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {isApproved && clinical && <HomeVisitQueue organizationId={org.id} />}

      {isApproved && (
        <>
          <details className="premium-accordion" open>
        <summary className="premium-accordion-summary">
          <div className="premium-accordion-header">
            <div
              className="premium-accordion-icon"
              style={{
                background: "#f8fafc",
                color: "#64748b",
                border: "1px solid #e2e8f0",
              }}
            >
              <Clock size={28} weight="duotone" />
            </div>
            <div>
              <h3 className="premium-accordion-title">{t("workingHours")}</h3>
              <p className="premium-accordion-desc">
                {t("workingHoursDesc")}
              </p>
            </div>
          </div>
          <CaretDown size={24} weight="bold" className="premium-chevron" />
        </summary>
        <div className="premium-accordion-content">
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: "16px",
            }}
          >
            <button
              className="primary"
              onClick={saveHours}
              style={{ backgroundColor: hoursSaved ? "#16a34a" : undefined }}
            >
              {hoursSaved ? t("hoursSavedBtn") : t("saveAllHoursBtn")}
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gap: "12px",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            }}
          >
            {days.map((d, weekday) => {
              const h = hours.find((x: any) => x.weekday === weekday) || {
                opensAt: "09:00",
                closesAt: "18:00",
                isClosed: false,
              };
              return (
                <div
                  key={d}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    padding: "20px",
                    background: h.isClosed ? "#f8fafc" : "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  <b
                    style={{
                      width: "100px",
                      color: h.isClosed ? "#94a3b8" : "#0f172a",
                      fontSize: "15px",
                    }}
                  >
                    {d}
                  </b>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      marginRight: "auto",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "24px",
                        background: h.isClosed ? "#ef4444" : "#e2e8f0",
                        borderRadius: "24px",
                        display: "flex",
                        alignItems: "center",
                        padding: "2px",
                        transition: "0.2s",
                      }}
                    >
                      <div
                        style={{
                          width: "20px",
                          height: "20px",
                          background: "#fff",
                          borderRadius: "50%",
                          transition: "0.2s",
                          transform: h.isClosed
                            ? "translateX(16px)"
                            : "translateX(0)",
                        }}
                      ></div>
                    </div>
                    <input
                      type="checkbox"
                      checked={!!h.isClosed}
                      onChange={(e) =>
                        updateHour(weekday, "isClosed", e.target.checked)
                      }
                      style={{ display: "none" }}
                    />
                    <span
                      style={{
                        color: h.isClosed ? "#ef4444" : "#64748b",
                        fontWeight: 600,
                      }}
                    >
                      {t("closedLabel")}
                    </span>
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      opacity: h.isClosed ? 0.4 : 1,
                      pointerEvents: h.isClosed ? "none" : "auto",
                      flex: 1,
                      minWidth: "150px",
                    }}
                  >
                    <input
                      type="time"
                      value={h.opensAt || "09:00"}
                      onChange={(e) =>
                        updateHour(weekday, "opensAt", e.target.value)
                      }
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        width: "100%",
                        fontWeight: 500,
                      }}
                    />
                    <span style={{ color: "#94a3b8", fontWeight: "bold" }}>
                      -
                    </span>
                    <input
                      type="time"
                      value={h.closesAt || "18:00"}
                      onChange={(e) =>
                        updateHour(weekday, "closesAt", e.target.value)
                      }
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        background: "#fff",
                        width: "100%",
                        fontWeight: 500,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </details>

      {hospital && (
        <details className="premium-accordion">
          <summary className="premium-accordion-summary">
            <div className="premium-accordion-header">
              <div
                className="premium-accordion-icon"
                style={{ background: "#eff6ff", color: "#3b82f6" }}
              >
                <UsersThree size={28} weight="duotone" />
              </div>
              <div>
                <h3 className="premium-accordion-title">
                  {t("departmentsTitle")}
                </h3>
                <p className="premium-accordion-desc">
                  {t("departmentsDesc")}
                </p>
              </div>
            </div>
            <CaretDown size={24} weight="bold" className="premium-chevron" />
          </summary>
          <div className="premium-accordion-content">
            <form onSubmit={saveDepartment} className="responsive-form-grid">
              <div className="responsive-form-field">
                <label>{t("departmentNameLabel")}</label>
                <input
                  value={departmentForm.name}
                  onChange={(e) =>
                    setDepartmentForm({
                      ...departmentForm,
                      name: e.target.value,
                    })
                  }
                  placeholder={t("specialtyPlaceholder")}
                  required
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("floorLabel")}</label>
                <input
                  value={departmentForm.floor}
                  onChange={(e) =>
                    setDepartmentForm({
                      ...departmentForm,
                      floor: e.target.value,
                    })
                  }
                  placeholder={t("floorPlaceholder")}
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("extensionPhoneLabel")}</label>
                <input
                  value={departmentForm.phone}
                  onChange={(e) =>
                    setDepartmentForm({
                      ...departmentForm,
                      phone: e.target.value,
                    })
                  }
                  placeholder="105"
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("descLabel")}</label>
                <input
                  value={departmentForm.description}
                  onChange={(e) =>
                    setDepartmentForm({
                      ...departmentForm,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div
                style={{ display: "flex", gap: "12px", gridColumn: "1 / -1" }}
              >
                <button className="primary" style={{ height: "46px", flex: 1 }}>
                  {editingDepartmentId ? t("updateBtn") : t("addDepartmentBtn")}
                </button>
                {editingDepartmentId && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setEditingDepartmentId(null);
                      setDepartmentForm({
                        name: "",
                        floor: "",
                        phone: "",
                        description: "",
                      });
                    }}
                  >
                    {t("cancelBtn")}
                  </button>
                )}
              </div>
            </form>

            <div className="premium-card-list">
              {departments.map((d) => (
                <div key={d.id} className="premium-card-item">
                  <div>
                    <b
                      style={{
                        fontSize: "16px",
                        color: "#0f172a",
                        display: "block",
                      }}
                    >
                      {d.name}
                    </b>
                    <span style={{ color: "#64748b", fontSize: "14px" }}>
                      {[
                        d.floor ? `${t("floorPrefix")} ${d.floor}` : null,
                        d.phone ? `${t("phonePrefix")} ${d.phone}` : null,
                        d.description,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </span>
                  </div>
                  <div
                    className="premium-card-item-actions"
                    style={{ display: "flex", gap: "8px" }}
                  >
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => editDepartment(d)}
                    >
                      <PencilSimple size={16} /> {t("editBtn")}
                    </button>
                    <button
                      className="secondary danger"
                      type="button"
                      onClick={() => removeDepartment(d.id)}
                    >
                      <Trash size={16} /> {t("removeBtn")}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {doctors.length > 0 && (
              <div
                style={{
                  marginTop: "32px",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "24px",
                }}
              >
                <h4
                  style={{
                    fontSize: "16px",
                    marginBottom: "16px",
                    color: "#0f172a",
                  }}
                >
                  {t("doctorAssignmentsTitle")}
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "16px",
                  }}
                >
                  {doctors.map((d) => (
                    <div
                      key={d.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px",
                        background: "#f8fafc",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div>
                        <b
                          style={{
                            display: "block",
                            color: "#0f172a",
                            fontSize: "15px",
                          }}
                        >
                          {d.name}
                        </b>
                        <span style={{ color: "#64748b", fontSize: "13px" }}>
                          {d.specialty}
                        </span>
                      </div>
                      <select
                        value={d.departmentId || ""}
                        onChange={(e) => assignDepartment(d.id, e.target.value)}
                        style={{
                          padding: "10px 14px",
                          borderRadius: "10px",
                          border: "1px solid #cbd5e1",
                          background: "#fff",
                          fontWeight: 500,
                        }}
                      >
                        <option value="">{t("unassignedDepartment")}</option>
                        {departments.map((dep) => (
                          <option value={dep.id} key={dep.id}>
                            {dep.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </details>
      )}

      <details className="premium-accordion">
        <summary className="premium-accordion-summary">
          <div className="premium-accordion-header">
            <div
              className="premium-accordion-icon"
              style={{ background: "#fef9c3", color: "#ca8a04" }}
            >
              <Megaphone size={28} weight="duotone" />
            </div>
            <div>
              <h3 className="premium-accordion-title">{t("campaignsTitle")}</h3>
              <p className="premium-accordion-desc">
                {t("campaignsDesc")}
              </p>
            </div>
          </div>
          <CaretDown size={24} weight="bold" className="premium-chevron" />
        </summary>
        <div className="premium-accordion-content">
          <form onSubmit={saveCampaign} className="responsive-form-grid">
            <div className="responsive-form-field">
              <label>{t("campaignTitle")}</label>
              <input
                value={campaignForm.title}
                onChange={(e) =>
                  setCampaignForm({ ...campaignForm, title: e.target.value })
                }
                required
              />
            </div>
            <div className="responsive-form-field">
              <label>{t("startDate")}</label>
              <input
                value={campaignForm.startsAt}
                onChange={(e) =>
                  setCampaignForm({ ...campaignForm, startsAt: e.target.value })
                }
                type="date"
              />
            </div>
            <div className="responsive-form-field">
              <label>{t("endDateLabel")}</label>
              <input
                value={campaignForm.endsAt}
                onChange={(e) =>
                  setCampaignForm({ ...campaignForm, endsAt: e.target.value })
                }
                type="date"
              />
            </div>
            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label>{t("campaignDescLabel")}</label>
              <textarea
                value={campaignForm.description}
                onChange={(e) =>
                  setCampaignForm({
                    ...campaignForm,
                    description: e.target.value,
                  })
                }
                rows={3}
              ></textarea>
            </div>
            <div style={{ display: "flex", gap: "12px", gridColumn: "1 / -1" }}>
              <button className="primary" style={{ height: "46px", flex: 1 }}>
                {editingCampaignId ? t("updateBtn") : t("publishCampaignBtn")}
              </button>
              {editingCampaignId && (
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setEditingCampaignId(null);
                    setCampaignForm({
                      title: "",
                      description: "",
                      startsAt: "",
                      endsAt: "",
                      isActive: true,
                    });
                  }}
                >
                  {t("cancelBtn")}
                </button>
              )}
            </div>
          </form>

          <div className="premium-card-list">
            {campaigns.map((c) => (
              <div key={c.id} className="premium-card-item">
                <div style={{ flex: 1 }}>
                  <b
                    style={{
                      display: "block",
                      fontSize: "16px",
                      color: "#0f172a",
                    }}
                  >
                    {c.title}
                  </b>
                  <span
                    style={{
                      color: "#64748b",
                      fontSize: "14px",
                      display: "block",
                      marginTop: "4px",
                    }}
                  >
                    {c.description || t("noDescription")}
                  </span>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      marginTop: "6px",
                      display: "flex",
                      gap: "12px",
                    }}
                  >
                    {c.startsAt && (
                      <span>
                        {t("startDatePrefix")}
                        {new Date(c.startsAt).toLocaleDateString(dateLocale)}
                      </span>
                    )}
                    {c.endsAt && (
                      <span>
                        {t("endDatePrefix")} {new Date(c.endsAt).toLocaleDateString(dateLocale)}
                      </span>
                    )}
                  </div>
                </div>

                <div
                  className="premium-card-item-actions"
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: c.isActive ? "#16a34a" : "#64748b",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={c.isActive}
                      onChange={(e) => toggleCampaign(c.id, e.target.checked)}
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "#16a34a",
                      }}
                    />
                    {c.isActive ? t("activeLabel") : t("inactiveLabel")}
                  </label>
                  <button
                    className="secondary"
                    type="button"
                    onClick={() => editCampaign(c)}
                  >
                    <PencilSimple size={16} /> {t("editBtn")}
                  </button>
                  <button
                    className="secondary danger"
                    type="button"
                    onClick={() => removeCampaign(c.id)}
                  >
                    <Trash size={16} /> {t("removeBtn")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </details>

      {hospital && (
        <details className="premium-accordion">
          <summary className="premium-accordion-summary">
            <div className="premium-accordion-header">
              <div
                className="premium-accordion-icon"
                style={{ background: "#fee2e2", color: "#dc2626" }}
              >
                <Ambulance size={28} weight="duotone" />
              </div>
              <div>
                <h3 className="premium-accordion-title">{t("emergencyServicesTitle")}</h3>
                <p className="premium-accordion-desc">
                  {t("emergencyUnitsDesc")}
                </p>
              </div>
            </div>
            <CaretDown size={24} weight="bold" className="premium-chevron" />
          </summary>
          <div className="premium-accordion-content">
            <form onSubmit={saveEmergency} className="responsive-form-grid">
              <div className="responsive-form-field">
                <label>{t("unitNameLabel")}</label>
                <input
                  value={emergencyForm.name}
                  onChange={(e) =>
                    setEmergencyForm({ ...emergencyForm, name: e.target.value })
                  }
                  placeholder={t("unitNamePlaceholder")}
                  required
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("serviceTypeLabel")}</label>
                <select
                  value={emergencyForm.kind}
                  onChange={(e) =>
                    setEmergencyForm({ ...emergencyForm, kind: e.target.value })
                  }
                >
                  <option value="EMERGENCY_DEPARTMENT">{t("emergencyDeptOption")}</option>
                  <option value="EMERGENCY_CONSULT">{t("emergencyConsult")}</option>
                  <option value="AMBULANCE_COORDINATION">
                    {t("ambulanceCoordinationOption")}
                  </option>
                </select>
              </div>
              <div className="responsive-form-field">
                <label>{t("contactLabel")}</label>
                <input
                  value={emergencyForm.phone}
                  onChange={(e) =>
                    setEmergencyForm({
                      ...emergencyForm,
                      phone: e.target.value,
                    })
                  }
                  placeholder={t("phoneLabel")}
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("additionalInfoLabel")}</label>
                <input
                  value={emergencyForm.description}
                  onChange={(e) =>
                    setEmergencyForm({
                      ...emergencyForm,
                      description: e.target.value,
                    })
                  }
                  placeholder={t("descLabel")}
                />
              </div>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 700,
                  margin: "10px 0",
                }}
              >
                <input
                  type="checkbox"
                  checked={emergencyForm.is24Hours}
                  onChange={(e) =>
                    setEmergencyForm({
                      ...emergencyForm,
                      is24Hours: e.target.checked,
                    })
                  }
                  style={{
                    width: "20px",
                    height: "20px",
                    accentColor: "#dc2626",
                  }}
                />{" "}
                {t("open24HoursLabel")}
              </label>
              <div
                style={{ display: "flex", gap: "12px", gridColumn: "1 / -1" }}
              >
                <button className="primary" style={{ height: "46px", flex: 1 }}>
                  {editingEmergencyId ? t("updateBtn") : t("addBtn")}
                </button>
                {editingEmergencyId && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setEditingEmergencyId(null);
                      setEmergencyForm({
                        name: "",
                        kind: "EMERGENCY_DEPARTMENT",
                        phone: "",
                        is24Hours: false,
                        description: "",
                      });
                    }}
                  >
                    {t("cancelBtn")}
                  </button>
                )}
              </div>
            </form>

            <div className="premium-card-list">
              {emergencyServices.map((item: any) => (
                <div key={item.id} className="premium-card-item">
                  <div>
                    <b
                      style={{
                        fontSize: "16px",
                        color: "#0f172a",
                        display: "block",
                      }}
                    >
                      {item.name}
                    </b>
                    <span style={{ color: "#64748b", fontSize: "14px" }}>
                      {[
                        item.kind === "EMERGENCY_DEPARTMENT"
                          ? t("emergencyDeptOption")
                          : item.kind === "EMERGENCY_CONSULT"
                          ? t("emergencyConsult")
                          : t("ambulanceCoordinationOption"),
                        item.phone ? `${t("phonePrefix")} ${item.phone}` : null,
                        item.is24Hours ? t("open24HoursLabel") : null,
                      ]
                        .filter(Boolean)
                        .join(" • ")}
                    </span>
                  </div>
                  <div
                    className="premium-card-item-actions"
                    style={{ display: "flex", gap: "8px" }}
                  >
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => editEmergency(item)}
                    >
                      <PencilSimple size={16} /> {t("editBtn")}
                    </button>
                    <button
                      className="secondary danger"
                      type="button"
                      onClick={() => removeEmergency(item.id)}
                    >
                      <Trash size={16} /> {t("removeBtn")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {pharmacy && (
        <>
          <details className="premium-accordion" open>
            <summary className="premium-accordion-summary">
              <div className="premium-accordion-header">
                <div
                  className="premium-accordion-icon"
                  style={{ background: "#fef2f2", color: "#ef4444" }}
                >
                  <FirstAid size={28} weight="duotone" />
                </div>
                <div>
                  <h3 className="premium-accordion-title">{t("onDutyTitle")}</h3>
                  <p className="premium-accordion-desc">
                    {t("onDutyDesc")}
                  </p>
                </div>
              </div>
              <CaretDown size={24} weight="bold" className="premium-chevron" />
            </summary>
            <div className="premium-accordion-content">
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                  background: "#f8fafc",
                  padding: "24px",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  flexWrap: "wrap",
                }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    fontWeight: 700,
                    fontSize: "16px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={onDuty}
                    onChange={(e) => setOnDuty(e.target.checked)}
                    style={{
                      width: "24px",
                      height: "24px",
                      accentColor: "#ef4444",
                    }}
                  />{" "}
                  {t("onDutyCheckbox")}
                </label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    opacity: onDuty ? 1 : 0.5,
                    transition: "0.2s",
                    flex: 1,
                    minWidth: "250px",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "#64748b" }}>
                    {t("onDutyUntilLabel")}
                  </span>
                  <input
                    type="datetime-local"
                    disabled={!onDuty}
                    value={onDutyUntil}
                    onChange={(e) => setOnDutyUntil(e.target.value)}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: "1px solid #cbd5e1",
                      fontSize: "15px",
                      fontWeight: 500,
                      flex: 1,
                    }}
                  />
                </div>
                <button
                  className="primary"
                  onClick={saveDuty}
                  style={{ height: "46px" }}
                >
                  {t("saveStatusBtn")}
                </button>
              </div>
            </div>
          </details>

          <details className="premium-accordion">
            <summary className="premium-accordion-summary">
              <div className="premium-accordion-header">
                <div
                  className="premium-accordion-icon"
                  style={{ background: "#eff6ff", color: "#3b82f6" }}
                >
                  <Pill size={28} weight="duotone" />
                </div>
                <div>
                  <h3 className="premium-accordion-title">{t("stockManagementTitle")}</h3>
                  <p className="premium-accordion-desc">
                    {t("stockDesc")}
                  </p>
                </div>
              </div>
              <CaretDown size={24} weight="bold" className="premium-chevron" />
            </summary>
            <div className="premium-accordion-content">
              <form onSubmit={addStock} className="responsive-form-grid">
                <div
                  className="responsive-form-field"
                  style={{ gridColumn: "span 2" }}
                >
                  <label>{t("itemNameLabel")}</label>
                  <input name="itemName" required />
                </div>
                <div className="responsive-form-field">
                  <label>{t("stockStatusLabel")}</label>
                  <select name="stockStatus">
                    <option value="in_stock">{t("stockInStock")}</option>
                    <option value="limited">{t("stockLimited")}</option>
                    <option value="out_of_stock">{t("stockOutOfStock")}</option>
                  </select>
                </div>
                <div className="responsive-form-field">
                  <label>{t("internalQuantity")}</label>
                  <input name="quantity" type="number" min="0" />
                </div>
                <button className="primary" style={{ height: "46px" }}>
                  {t("addBtn")}
                </button>
              </form>

              <div className="premium-card-list">
                {stock.map((s) => (
                  <div key={s.id} className="premium-card-item">
                    <b style={{ flex: 1, fontSize: "16px", color: "#0f172a" }}>
                      {s.itemName}
                    </b>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <select
                        value={s.stockStatus}
                        onChange={(event) =>
                          updateStock(s.id, event.target.value)
                        }
                        style={{
                          padding: "10px 16px",
                          borderRadius: "10px",
                          border: "1px solid #cbd5e1",
                          fontWeight: 600,
                          color:
                            s.stockStatus === "in_stock"
                              ? "#16a34a"
                              : s.stockStatus === "out_of_stock"
                              ? "#ef4444"
                              : "#ea580c",
                          background:
                            s.stockStatus === "in_stock"
                              ? "#f0fdf4"
                              : s.stockStatus === "out_of_stock"
                              ? "#fef2f2"
                              : "#fff7ed",
                        }}
                      >
                        <option value="in_stock">{t("stockInStock")}</option>
                        <option value="limited">{t("stockLimited")}</option>
                        <option value="out_of_stock">{t("stockOutOfStock")}</option>
                      </select>
                      <button
                        type="button"
                        className="secondary danger"
                        onClick={() => removeStock(s.id)}
                      >
                        <Trash size={16} /> {t("removeBtn")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </details>
        </>
      )}

      {imaging && (
        <details className="premium-accordion">
          <summary className="premium-accordion-summary">
            <div className="premium-accordion-header">
              <div
                className="premium-accordion-icon"
                style={{ background: "#f3e8ff", color: "#9333ea" }}
              >
                <Heartbeat size={28} weight="duotone" />
              </div>
              <div>
                <h3 className="premium-accordion-title">{t("imagingCatalogTitle")}</h3>
                <p className="premium-accordion-desc">
                  {t("imagingCatalogDesc")}
                </p>
              </div>
            </div>
            <CaretDown size={24} weight="bold" className="premium-chevron" />
          </summary>
          <div className="premium-accordion-content">
            <form onSubmit={saveExam} className="responsive-form-grid">
              <div className="responsive-form-field">
                <label>{t("categoryLabel")}</label>
                <select
                  value={examForm.modality}
                  onChange={(e) =>
                    setExamForm({ ...examForm, modality: e.target.value })
                  }
                >
                  {IMAGING_MODALITIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {imagingModalityLabel(item.id, locale)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="responsive-form-field">
                <label>{t("examNameLabel")}</label>
                <input
                  value={examForm.name}
                  onChange={(e) =>
                    setExamForm({ ...examForm, name: e.target.value })
                  }
                  placeholder={t("examNamePlaceholder")}
                  required
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("bodyRegionLabel")}</label>
                <input
                  value={examForm.bodyRegion}
                  onChange={(e) =>
                    setExamForm({ ...examForm, bodyRegion: e.target.value })
                  }
                  placeholder={t("bodyRegionPlaceholder")}
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("preparationLabel")}</label>
                <input
                  value={examForm.preparation}
                  onChange={(e) =>
                    setExamForm({ ...examForm, preparation: e.target.value })
                  }
                  placeholder={t("preparationPlaceholder")}
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("durationMinutesLabel")}</label>
                <input
                  value={examForm.durationMinutes}
                  onChange={(e) =>
                    setExamForm({
                      ...examForm,
                      durationMinutes: e.target.value,
                    })
                  }
                  type="number"
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("reportHoursLabel")}</label>
                <input
                  value={examForm.reportHours}
                  onChange={(e) =>
                    setExamForm({ ...examForm, reportHours: e.target.value })
                  }
                  type="number"
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("priceLabel")}</label>
                <input
                  value={examForm.price}
                  onChange={(e) =>
                    setExamForm({ ...examForm, price: e.target.value })
                  }
                  type="number"
                />
              </div>
              <div
                style={{ display: "flex", gap: "12px", gridColumn: "1 / -1" }}
              >
                <button className="primary" style={{ height: "46px", flex: 1 }}>
                  {editingExamId ? t("updateBtn") : t("addToCatalogBtn")}
                </button>
                {editingExamId && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setEditingExamId(null);
                      setExamForm(emptyExam);
                    }}
                  >
                    {t("cancelBtn")}
                  </button>
                )}
              </div>
            </form>

            <div className="premium-card-list">
              {exams.map((exam) => (
                <div key={exam.id} className="premium-card-item">
                  <div>
                    <b style={{ fontSize: "16px", color: "#0f172a" }}>
                      {imagingModalityLabel(exam.modality, locale)} · {exam.name}
                    </b>
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "14px",
                        marginTop: "6px",
                      }}
                    >
                      {[
                        exam.bodyRegion,
                        exam.preparation,
                        exam.durationMinutes
                          ? `${exam.durationMinutes} ${t("minutesUnit")}`
                          : "",
                        exam.reportHours ? `${t("reportHoursPrefix")} ${exam.reportHours} ${t("hoursUnit")}` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ") || t("noDetails")}
                    </div>
                  </div>
                  <div
                    className="premium-card-item-actions"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <strong style={{ fontSize: "18px", color: "#16a34a" }}>
                      {exam.price
                        ? `${exam.price.toLocaleString(dateLocale)} ₺`
                        : t("askForPrice")}
                    </strong>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => editExam(exam)}
                    >
                      <PencilSimple size={16} /> {t("editBtn")}
                    </button>
                    <button
                      type="button"
                      className="secondary danger"
                      onClick={() => removeExam(exam.id)}
                    >
                      <Trash size={16} /> {t("removeBtn")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {laboratory && (
        <details className="premium-accordion">
          <summary className="premium-accordion-summary">
            <div className="premium-accordion-header">
              <div
                className="premium-accordion-icon"
                style={{ background: "#ecfdf5", color: "#10b981" }}
              >
                <Flask size={28} weight="duotone" />
              </div>
              <div>
                <h3 className="premium-accordion-title">{t("labCatalogTitle")}</h3>
                <p className="premium-accordion-desc">
                  {t("labCatalogDesc")}
                </p>
              </div>
            </div>
            <CaretDown size={24} weight="bold" className="premium-chevron" />
          </summary>
          <div className="premium-accordion-content">
            <form onSubmit={saveTest} className="responsive-form-grid">
              <div className="responsive-form-field">
                <label>{t("groupLabel")}</label>
                <select
                  value={testForm.category}
                  onChange={(e) =>
                    setTestForm({ ...testForm, category: e.target.value })
                  }
                >
                  {LAB_CATEGORIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {labCategoryLabel(item.id, locale)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="responsive-form-field">
                <label>{t("sampleTypeLabel")}</label>
                <select
                  value={testForm.sampleType}
                  onChange={(e) =>
                    setTestForm({ ...testForm, sampleType: e.target.value })
                  }
                >
                  {LAB_SAMPLE_TYPES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {labSampleLabel(item.id, locale)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="responsive-form-field">
                <label>{t("testNameLabel")}</label>
                <input
                  value={testForm.name}
                  onChange={(e) =>
                    setTestForm({ ...testForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("fastingHoursLabel")}</label>
                <input
                  value={testForm.fastingHours}
                  onChange={(e) =>
                    setTestForm({ ...testForm, fastingHours: e.target.value })
                  }
                  type="number"
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("turnaroundHoursLabel")}</label>
                <input
                  value={testForm.turnaroundHours}
                  onChange={(e) =>
                    setTestForm({
                      ...testForm,
                      turnaroundHours: e.target.value,
                    })
                  }
                  type="number"
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("preparationLabel")}</label>
                <input
                  value={testForm.preparation}
                  onChange={(e) =>
                    setTestForm({ ...testForm, preparation: e.target.value })
                  }
                />
              </div>
              <div className="responsive-form-field">
                <label>{t("priceLabel")}</label>
                <input
                  value={testForm.price}
                  onChange={(e) =>
                    setTestForm({ ...testForm, price: e.target.value })
                  }
                  type="number"
                />
              </div>
              <label
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontWeight: 700,
                  margin: "10px 0",
                }}
              >
                <input
                  type="checkbox"
                  checked={!!testForm.homeCollection}
                  onChange={(e) =>
                    setTestForm({
                      ...testForm,
                      homeCollection: e.target.checked,
                    })
                  }
                  style={{ width: "22px", height: "22px" }}
                />{" "}
                {t("homeCollectionCheckbox")}
              </label>
              <div
                style={{ gridColumn: "1 / -1", display: "flex", gap: "12px" }}
              >
                <button className="primary" style={{ height: "46px", flex: 1 }}>
                  {editingTestId ? t("updateBtn") : t("addToCatalogBtn")}
                </button>
                {editingTestId && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => {
                      setEditingTestId(null);
                      setTestForm(emptyTest);
                    }}
                  >
                    {t("cancelBtn")}
                  </button>
                )}
              </div>
            </form>

            <div className="premium-card-list">
              {tests.map((test) => (
                <div key={test.id} className="premium-card-item">
                  <div>
                    <b style={{ fontSize: "16px", color: "#0f172a" }}>
                      {labCategoryLabel(test.category, locale)} · {test.name}
                    </b>
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "14px",
                        marginTop: "6px",
                      }}
                    >
                      {[
                        labSampleLabel(test.sampleType, locale),
                        test.fastingHours
                          ? `${test.fastingHours} ${t("fastingHoursSuffix")}`
                          : t("noFastingRequired"),
                        test.turnaroundHours
                          ? `${t("turnaroundPrefix")} ${test.turnaroundHours} ${t("hoursUnit")}`
                          : "",
                        test.preparation,
                        test.homeCollection ? t("homeCollectionBadge") : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div
                    className="premium-card-item-actions"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                    }}
                  >
                    <strong style={{ fontSize: "18px", color: "#16a34a" }}>
                      {test.price
                        ? `${test.price.toLocaleString(dateLocale)} ₺`
                        : t("askForPrice")}
                    </strong>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => editTest(test)}
                    >
                      <PencilSimple size={16} /> {t("editBtn")}
                    </button>
                    <button
                      type="button"
                      className="secondary danger"
                      onClick={() => removeTest(test.id)}
                    >
                      <Trash size={16} /> {t("removeBtn")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}
        </>
      )}
    </div>
  );
}

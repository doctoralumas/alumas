"use client";

import { useState } from "react";
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

type Props = { org: any };
const days = [
  "Pazar",
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
];
const panelCopy: Record<string, string> = {
  HOSPITAL:
    "Departmanları, uzman kadroyu, acil birimleri ve klinik hizmetleri buradan yönetirsiniz. Yayınlanan profil bu kayıtları gösterir.",
  CLINIC:
    "Uzman kadroyu, muayene ve işlemleri buradan yönetirsiniz. Yayınlanan profil bu kayıtları gösterir.",
  PHARMACY:
    "Nöbet durumunu ve stok görünürlüğünü buradan yönetirsiniz. Hastalar adet yerine stok durumunu görür.",
  IMAGING_CENTER:
    "MR, BT, röntgen ve diğer tetkikleri buradan yönetirsiniz. Raporu, ilişkili hastanın görüntüleme geçmişine işlersiniz.",
  LABORATORY:
    "Kan, idrar ve diğer numune tahlillerini buradan yönetirsiniz. Sonucu, ilişkili hastanın tahlil geçmişine işlersiniz.",
};

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

export default function OrganizationManager({ org }: Props) {
  const clinical = org.type === "HOSPITAL" || org.type === "CLINIC";
  const hospital = org.type === "HOSPITAL";
  const pharmacy = org.type === "PHARMACY";
  const imaging = org.type === "IMAGING_CENTER";
  const laboratory = org.type === "LABORATORY";

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

  async function saveDepartment(e: any) {
    e.preventDefault();
    const payload = { ...departmentForm, departmentId: editingDepartmentId };
    const r = await fetch(`/api/organizations/` + org.id + `/departments`, {
      method: editingDepartmentId ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const j = await r.json();
    if (!r.ok) return setMsg(j.error || "Departman kaydedilemedi");
    setDepartments((x) =>
      editingDepartmentId
        ? x.map((item) => (item.id === j.id ? j : item))
        : [...x, j]
    );
    setDepartmentForm({ name: "", floor: "", phone: "", description: "" });
    setEditingDepartmentId(null);
    setMsg(editingDepartmentId ? "Departman güncellendi" : "Departman eklendi");
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
      setMsg("Departman kaldırıldı");
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
    if (!r.ok) return setMsg(j.error || "Kampanya kaydedilemedi");
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
    setMsg(editingCampaignId ? "Kampanya güncellendi" : "Kampanya eklendi");
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
      setMsg("Kampanya silindi");
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
    if (!r.ok) return setMsg(j.error || "Hizmet kaydedilemedi");
    setServices((x) =>
      editingServiceId
        ? x.map((item) => (item.id === j.id ? { ...item, ...j } : item))
        : [...x, j]
    );
    setServiceForm({ name: "", description: "", price: "", homeCareKind: "" });
    setEditingServiceId(null);
    setMsg(editingServiceId ? "Hizmet güncellendi" : "Hizmet eklendi");
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
      setMsg("Hizmet kaldırıldı");
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
    if (!r.ok) return setMsg(j.error || "Acil hizmet kaydedilemedi");
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
      editingEmergencyId ? "Acil hizmet güncellendi" : "Acil hizmet eklendi"
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
      setMsg("Acil hizmet kaldırıldı");
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
      setMsg("Varyant eklendi");
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
      setMsg("Varyant kaldırıldı");
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
      setMsg("Doktor daveti gönderildi");
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
      setMsg("Saatler kaydedilemedi");
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
    setMsg("Konum aranıyor...");
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
      setMsg(j.error || "Konum bulunamadı");
      return;
    }
    const u = await fetch(`/api/organizations/` + org.id, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(j),
    });
    setMsg(u.ok ? "Harita konumu kaydedildi" : "Konum kaydedilemedi");
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
      r.ok ? "Nöbetçi durumu güncellendi" : "Nöbetçi durumu kaydedilemedi"
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
      setMsg("Doktor departmanı güncellendi");
    } else setMsg("Departman atanamadı");
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
      setMsg("Stok güncellendi");
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
      setMsg(data.error || "Stok güncellenemedi");
      return;
    }
    setStock((current) =>
      current.map((item) => (item.id === data.id ? data : item))
    );
    setMsg("Stok durumu güncellendi");
  }
  async function removeStock(stockId: string) {
    const response = await fetch(
      `/api/organizations/` + org.id + `/stock?stockId=` + stockId,
      { method: "DELETE" }
    );
    if (!response.ok) {
      setMsg("Stok kaydı kaldırılamadı");
      return;
    }
    setStock((current) => current.filter((item) => item.id !== stockId));
    setMsg("Stok kaydı kaldırıldı");
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
      setMsg(j.error || "Tetkik kaydedilemedi");
      return;
    }
    setExams((current) =>
      editingExamId
        ? current.map((item) => (item.id === j.id ? j : item))
        : [...current, j]
    );
    setExamForm(emptyExam);
    setEditingExamId(null);
    setMsg(editingExamId ? "Tetkik güncellendi" : "Tetkik kataloğa eklendi");
  }
  async function removeExam(id: string) {
    const r = await fetch(
      `/api/organizations/` + org.id + `/imaging-exams?examId=` + id,
      { method: "DELETE" }
    );
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(j.error || "Tetkik kaldırılamadı");
      return;
    }
    setExams((current) => current.filter((item) => item.id !== id));
    if (editingExamId === id) {
      setEditingExamId(null);
      setExamForm(emptyExam);
    }
    setMsg("Tetkik yayından kaldırıldı");
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
      setMsg(j.error || "Tahlil kaydedilemedi");
      return;
    }
    setTests((current) =>
      editingTestId
        ? current.map((item) => (item.id === j.id ? j : item))
        : [...current, j]
    );
    setTestForm(emptyTest);
    setEditingTestId(null);
    setMsg(editingTestId ? "Tahlil güncellendi" : "Tahlil kataloğa eklendi");
  }
  async function removeTest(id: string) {
    const r = await fetch(
      `/api/organizations/` + org.id + `/laboratory-tests?testId=` + id,
      { method: "DELETE" }
    );
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(j.error || "Tahlil kaldırılamadı");
      return;
    }
    setTests((current) => current.filter((item) => item.id !== id));
    if (editingTestId === id) {
      setEditingTestId(null);
      setTestForm(emptyTest);
    }
    setMsg("Tahlil yayından kaldırıldı");
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
          {panelCopy[org.type] || "Kurum bilgilerini buradan yönetirsiniz."}
        </p>
      </div>

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
              <h3 className="premium-accordion-title">Genel Bilgiler</h3>
              <p className="premium-accordion-desc">
                Kurum profilinizi, iletişim ve açıklama (Hakkında) bilgilerinizi
                düzenleyin.
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
                setMsg("Genel bilgiler güncellendi");
                setTimeout(() => window.location.reload(), 1000);
              } else {
                setMsg("Bilgiler güncellenemedi");
              }
            }}
          >
            <div className="responsive-form-field">
              <label>Kurum Adı</label>
              <input name="name" defaultValue={org.name} required />
            </div>
            <div className="responsive-form-field">
              <label>Telefon</label>
              <input name="phone" defaultValue={org.phone || ""} type="tel" />
            </div>
            <div className="responsive-form-field">
              <label>Web Sitesi</label>
              <input
                name="website"
                defaultValue={org.website || ""}
                type="url"
              />
            </div>
            <div className="responsive-form-field">
              <label>İl</label>
              <input name="city" defaultValue={org.city || ""} required />
            </div>
            <div className="responsive-form-field">
              <label>İlçe</label>
              <input name="district" defaultValue={org.district || ""} />
            </div>
            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label>Açık Adres</label>
              <input name="address" defaultValue={org.address || ""} required />
            </div>
            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label>Hakkında (Açıklama)</label>
              <textarea
                name="description"
                defaultValue={org.description || ""}
                rows={4}
                placeholder="Kurumunuzu tanıtın. Hizmetleriniz, vizyonunuz veya öne çıkan özelliklerinizden bahsedebilirsiniz..."
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
                Genel Bilgileri Güncelle
              </button>
            </div>
          </form>
        </div>
      </details>

      <VerificationDocumentManager
        owner={{
          kind: "organization",
          entityType: org.type,
          organizationId: org.id,
        }}
        documents={org.verificationDocuments || []}
      />

      {imaging && (
        <ResultDelivery
          organizationId={org.id}
          kind="imaging"
          catalog={exams.map((exam) => ({
            id: exam.id,
            name: imagingModalityLabel(exam.modality) + " - " + exam.name,
          }))}
        />
      )}
      {laboratory && (
        <ResultDelivery
          organizationId={org.id}
          kind="laboratory"
          catalog={tests.map((test) => ({
            id: test.id,
            name: labCategoryLabel(test.category) + " - " + test.name,
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
              <h3 className="premium-accordion-title">Konum ve Harita</h3>
              <p className="premium-accordion-desc">
                Hastalarınızın kurumunuzu bulabilmesi için konumunuzu
                doğrulayın.
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
                Kayıtlı Adres
              </h2>
              <p
                className="muted"
                style={{ margin: "4px 0 0", fontSize: "15px" }}
              >
                {org.address} · {org.city}
              </p>
            </div>
            <button className="primary" onClick={locate}>
              Adresten harita konumu bul
            </button>
          </div>
        </div>
      </details>

      {clinical && (
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
                    ? "Muayene ve İşlemler"
                    : "Klinik Hizmetler"}
                </h3>
                <p className="premium-accordion-desc">
                  Sunulan sağlık hizmetlerini, fiyat ve evde bakım opsiyonlarını
                  yönetin.
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
                    ? "Muayene veya işlem adı"
                    : "Hizmet adı"}
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
                <label>Fiyat (₺)</label>
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
                <label>Kısa açıklama</label>
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
                <label>Konum</label>
                <select
                  value={serviceForm.homeCareKind}
                  onChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      homeCareKind: e.target.value,
                    })
                  }
                >
                  <option value="">Yalnızca kurumda</option>
                  <option value="nurse">Evde hemşirelik</option>
                  <option value="dressing">Evde pansuman</option>
                  <option value="physio">Evde fizyoterapi</option>
                </select>
              </div>
              <div
                style={{ display: "flex", gap: "12px", gridColumn: "1 / -1" }}
              >
                <button className="primary" style={{ height: "46px", flex: 1 }}>
                  {editingServiceId ? "Güncelle" : "Hizmet Ekle"}
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
                    Vazgeç
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
                          ? "Evde hemşirelik"
                          : s.homeCareKind === "dressing"
                          ? "Evde pansuman"
                          : s.homeCareKind === "physio"
                          ? "Evde fizyoterapi"
                          : "Kurumda",
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
                      <PencilSimple size={16} /> Düzenle
                    </button>
                    <button
                      className="secondary danger"
                      type="button"
                      onClick={() => removeService(s.id)}
                    >
                      <Trash size={16} /> Kaldır
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}

      {clinical && (
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
                <h3 className="premium-accordion-title">Hizmet Varyantları</h3>
                <p className="premium-accordion-desc">
                  Hizmetlere süre bazlı veya premium alt seçenekler ekleyin.
                </p>
              </div>
            </div>
            <CaretDown size={24} weight="bold" className="premium-chevron" />
          </summary>
          <div className="premium-accordion-content">
            <form onSubmit={addVariant} className="responsive-form-grid">
              <div className="responsive-form-field">
                <label>Hizmet</label>
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
                  <option value="">Seçiniz...</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="responsive-form-field">
                <label>Varyant Etiketi (Örn: Premium)</label>
                <input
                  value={variantForm.label}
                  onChange={(e) =>
                    setVariantForm({ ...variantForm, label: e.target.value })
                  }
                  required
                />
              </div>
              <div className="responsive-form-field">
                <label>Ek fiyat (₺)</label>
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
                <label>Süre (dk)</label>
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
                Varyant Ekle
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
                          {v.durationMinutes ? `${v.durationMinutes} dk ` : ""}
                          {v.priceDelta ? `· +${v.priceDelta} ₺` : ""}
                        </div>
                      </div>
                      <div className="premium-card-item-actions">
                        <button
                          type="button"
                          className="secondary danger"
                          onClick={() => removeVariant(s.id, v.id)}
                        >
                          <Trash size={16} /> Kaldır
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </details>
      )}

      {clinical && (
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
                <h3 className="premium-accordion-title">Doktor Davetleri</h3>
                <p className="premium-accordion-desc">
                  Kurumunuza uzman doktorları davet edin ve durumlarını izleyin.
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
                <label>E-posta Adresi</label>
                <input
                  name="email"
                  type="email"
                  placeholder="doktor@ornek.com"
                  required
                />
              </div>
              <div className="responsive-form-field">
                <label>Branş (Opsiyonel)</label>
                <input name="specialty" placeholder="Örn: Kardiyoloji" />
              </div>
              <button className="primary" style={{ height: "46px" }}>
                Davet Gönder
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
                      {i.specialty || "Doktor"}
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

      {clinical && <HomeVisitQueue organizationId={org.id} />}

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
              <h3 className="premium-accordion-title">Çalışma Saatleri</h3>
              <p className="premium-accordion-desc">
                Haftalık açılış ve kapanış saatlerinizi düzenleyin.
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
              {hoursSaved ? "✅ Kaydedildi" : "Tüm Saatleri Kaydet"}
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
                      Kapalı
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
                  Branşlar ve Departmanlar
                </h3>
                <p className="premium-accordion-desc">
                  Hastane departmanlarını ve uzman doktor atamalarını yönetin.
                </p>
              </div>
            </div>
            <CaretDown size={24} weight="bold" className="premium-chevron" />
          </summary>
          <div className="premium-accordion-content">
            <form onSubmit={saveDepartment} className="responsive-form-grid">
              <div className="responsive-form-field">
                <label>Departman Adı</label>
                <input
                  value={departmentForm.name}
                  onChange={(e) =>
                    setDepartmentForm({
                      ...departmentForm,
                      name: e.target.value,
                    })
                  }
                  placeholder="Örn: Kardiyoloji"
                  required
                />
              </div>
              <div className="responsive-form-field">
                <label>Kat / Bölüm</label>
                <input
                  value={departmentForm.floor}
                  onChange={(e) =>
                    setDepartmentForm({
                      ...departmentForm,
                      floor: e.target.value,
                    })
                  }
                  placeholder="1. Kat"
                />
              </div>
              <div className="responsive-form-field">
                <label>Dahili Telefon</label>
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
                <label>Açıklama</label>
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
                  {editingDepartmentId ? "Güncelle" : "Departman Ekle"}
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
                    Vazgeç
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
                        d.floor ? `Kat: ${d.floor}` : null,
                        d.phone ? `Tel: ${d.phone}` : null,
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
                      <PencilSimple size={16} /> Düzenle
                    </button>
                    <button
                      className="secondary danger"
                      type="button"
                      onClick={() => removeDepartment(d.id)}
                    >
                      <Trash size={16} /> Kaldır
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
                  Doktor Atamaları
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
                        <option value="">Departmansız</option>
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
              <h3 className="premium-accordion-title">Kampanyalar</h3>
              <p className="premium-accordion-desc">
                Özel fırsatları profilinizde ve genel listede yayınlayın.
              </p>
            </div>
          </div>
          <CaretDown size={24} weight="bold" className="premium-chevron" />
        </summary>
        <div className="premium-accordion-content">
          <form onSubmit={saveCampaign} className="responsive-form-grid">
            <div className="responsive-form-field">
              <label>Kampanya başlığı</label>
              <input
                value={campaignForm.title}
                onChange={(e) =>
                  setCampaignForm({ ...campaignForm, title: e.target.value })
                }
                required
              />
            </div>
            <div className="responsive-form-field">
              <label>Başlangıç</label>
              <input
                value={campaignForm.startsAt}
                onChange={(e) =>
                  setCampaignForm({ ...campaignForm, startsAt: e.target.value })
                }
                type="date"
              />
            </div>
            <div className="responsive-form-field">
              <label>Bitiş</label>
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
              <label>Açıklama (Hastanın göreceği metin)</label>
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
                {editingCampaignId ? "Güncelle" : "Kampanyayı Yayınla"}
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
                  Vazgeç
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
                    {c.description || "Açıklama yok"}
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
                        Başlangıç:{" "}
                        {new Date(c.startsAt).toLocaleDateString("tr-TR")}
                      </span>
                    )}
                    {c.endsAt && (
                      <span>
                        Bitiş: {new Date(c.endsAt).toLocaleDateString("tr-TR")}
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
                    {c.isActive ? "Aktif" : "Pasif"}
                  </label>
                  <button
                    className="secondary"
                    type="button"
                    onClick={() => editCampaign(c)}
                  >
                    <PencilSimple size={16} /> Düzenle
                  </button>
                  <button
                    className="secondary danger"
                    type="button"
                    onClick={() => removeCampaign(c.id)}
                  >
                    <Trash size={16} /> Kaldır
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
                <h3 className="premium-accordion-title">Acil Hizmetler</h3>
                <p className="premium-accordion-desc">
                  Acil servis, danışma hattı veya 7/24 hizmet birimleri.
                </p>
              </div>
            </div>
            <CaretDown size={24} weight="bold" className="premium-chevron" />
          </summary>
          <div className="premium-accordion-content">
            <form onSubmit={saveEmergency} className="responsive-form-grid">
              <div className="responsive-form-field">
                <label>Birim Adı</label>
                <input
                  value={emergencyForm.name}
                  onChange={(e) =>
                    setEmergencyForm({ ...emergencyForm, name: e.target.value })
                  }
                  placeholder="Örn: Acil Servis"
                  required
                />
              </div>
              <div className="responsive-form-field">
                <label>Hizmet Tipi</label>
                <select
                  value={emergencyForm.kind}
                  onChange={(e) =>
                    setEmergencyForm({ ...emergencyForm, kind: e.target.value })
                  }
                >
                  <option value="EMERGENCY_DEPARTMENT">Acil servis</option>
                  <option value="EMERGENCY_CONSULT">Acil danışmanlık</option>
                  <option value="AMBULANCE_COORDINATION">
                    Ambulans koordinasyonu
                  </option>
                </select>
              </div>
              <div className="responsive-form-field">
                <label>İletişim</label>
                <input
                  value={emergencyForm.phone}
                  onChange={(e) =>
                    setEmergencyForm({
                      ...emergencyForm,
                      phone: e.target.value,
                    })
                  }
                  placeholder="Telefon"
                />
              </div>
              <div className="responsive-form-field">
                <label>Ek Bilgi</label>
                <input
                  value={emergencyForm.description}
                  onChange={(e) =>
                    setEmergencyForm({
                      ...emergencyForm,
                      description: e.target.value,
                    })
                  }
                  placeholder="Açıklama"
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
                7/24 Hizmet
              </label>
              <div
                style={{ display: "flex", gap: "12px", gridColumn: "1 / -1" }}
              >
                <button className="primary" style={{ height: "46px", flex: 1 }}>
                  {editingEmergencyId ? "Güncelle" : "Ekle"}
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
                    Vazgeç
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
                          ? "Acil servis"
                          : item.kind === "EMERGENCY_CONSULT"
                          ? "Acil danışmanlık"
                          : "Ambulans koordinasyonu",
                        item.phone ? `Tel: ${item.phone}` : null,
                        item.is24Hours ? "7/24 Hizmet" : null,
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
                      <PencilSimple size={16} /> Düzenle
                    </button>
                    <button
                      className="secondary danger"
                      type="button"
                      onClick={() => removeEmergency(item.id)}
                    >
                      <Trash size={16} /> Kaldır
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
                  <h3 className="premium-accordion-title">Nöbetçi Durumu</h3>
                  <p className="premium-accordion-desc">
                    Nöbetçi eczane listelerinde yer almak için güncelleyin.
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
                  Nöbetçi
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
                    Bitiş zamanı:
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
                  Durumu Kaydet
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
                  <h3 className="premium-accordion-title">Stok Yönetimi</h3>
                  <p className="premium-accordion-desc">
                    İlaç/ürün stok görünürlüğünü hastalara yansıtın.
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
                  <label>Ürün / İlaç Adı</label>
                  <input name="itemName" required />
                </div>
                <div className="responsive-form-field">
                  <label>Stok Durumu</label>
                  <select name="stockStatus">
                    <option value="in_stock">Stokta var</option>
                    <option value="limited">Sınırlı</option>
                    <option value="out_of_stock">Yok</option>
                  </select>
                </div>
                <div className="responsive-form-field">
                  <label>İç Miktar (Görünmez)</label>
                  <input name="quantity" type="number" min="0" />
                </div>
                <button className="primary" style={{ height: "46px" }}>
                  Ekle
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
                        <option value="in_stock">Stokta var</option>
                        <option value="limited">Sınırlı</option>
                        <option value="out_of_stock">Yok</option>
                      </select>
                      <button
                        type="button"
                        className="secondary danger"
                        onClick={() => removeStock(s.id)}
                      >
                        <Trash size={16} /> Kaldır
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
                <h3 className="premium-accordion-title">Tetkik Kataloğu</h3>
                <p className="premium-accordion-desc">
                  Görüntüleme hizmetleri, hazırlık şartları ve ücretleri.
                </p>
              </div>
            </div>
            <CaretDown size={24} weight="bold" className="premium-chevron" />
          </summary>
          <div className="premium-accordion-content">
            <form onSubmit={saveExam} className="responsive-form-grid">
              <div className="responsive-form-field">
                <label>Kategori</label>
                <select
                  value={examForm.modality}
                  onChange={(e) =>
                    setExamForm({ ...examForm, modality: e.target.value })
                  }
                >
                  {IMAGING_MODALITIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="responsive-form-field">
                <label>Tetkik Adı</label>
                <input
                  value={examForm.name}
                  onChange={(e) =>
                    setExamForm({ ...examForm, name: e.target.value })
                  }
                  placeholder="Örn: Beyin MR"
                  required
                />
              </div>
              <div className="responsive-form-field">
                <label>Bölge</label>
                <input
                  value={examForm.bodyRegion}
                  onChange={(e) =>
                    setExamForm({ ...examForm, bodyRegion: e.target.value })
                  }
                  placeholder="Örn: Baş"
                />
              </div>
              <div className="responsive-form-field">
                <label>Hazırlık</label>
                <input
                  value={examForm.preparation}
                  onChange={(e) =>
                    setExamForm({ ...examForm, preparation: e.target.value })
                  }
                  placeholder="4 saat açlık"
                />
              </div>
              <div className="responsive-form-field">
                <label>Süre (dk)</label>
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
                <label>Rapor (Saat)</label>
                <input
                  value={examForm.reportHours}
                  onChange={(e) =>
                    setExamForm({ ...examForm, reportHours: e.target.value })
                  }
                  type="number"
                />
              </div>
              <div className="responsive-form-field">
                <label>Fiyat (₺)</label>
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
                  {editingExamId ? "Güncelle" : "Kataloğa Ekle"}
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
                    Vazgeç
                  </button>
                )}
              </div>
            </form>

            <div className="premium-card-list">
              {exams.map((exam) => (
                <div key={exam.id} className="premium-card-item">
                  <div>
                    <b style={{ fontSize: "16px", color: "#0f172a" }}>
                      {imagingModalityLabel(exam.modality)} · {exam.name}
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
                          ? `${exam.durationMinutes} dk`
                          : "",
                        exam.reportHours ? `rapor ${exam.reportHours} sa` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ") || "Ayrıntı yok"}
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
                        ? `${exam.price.toLocaleString("tr-TR")} ₺`
                        : "Fiyat sorunuz"}
                    </strong>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => editExam(exam)}
                    >
                      <PencilSimple size={16} /> Düzenle
                    </button>
                    <button
                      type="button"
                      className="secondary danger"
                      onClick={() => removeExam(exam.id)}
                    >
                      <Trash size={16} /> Kaldır
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
                <h3 className="premium-accordion-title">Tahlil Kataloğu</h3>
                <p className="premium-accordion-desc">
                  Grup, numune tipi, evde numune alma opsiyonları.
                </p>
              </div>
            </div>
            <CaretDown size={24} weight="bold" className="premium-chevron" />
          </summary>
          <div className="premium-accordion-content">
            <form onSubmit={saveTest} className="responsive-form-grid">
              <div className="responsive-form-field">
                <label>Grup</label>
                <select
                  value={testForm.category}
                  onChange={(e) =>
                    setTestForm({ ...testForm, category: e.target.value })
                  }
                >
                  {LAB_CATEGORIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="responsive-form-field">
                <label>Numune Tipi</label>
                <select
                  value={testForm.sampleType}
                  onChange={(e) =>
                    setTestForm({ ...testForm, sampleType: e.target.value })
                  }
                >
                  {LAB_SAMPLE_TYPES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="responsive-form-field">
                <label>Tahlil Adı</label>
                <input
                  value={testForm.name}
                  onChange={(e) =>
                    setTestForm({ ...testForm, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="responsive-form-field">
                <label>Açlık (Saat)</label>
                <input
                  value={testForm.fastingHours}
                  onChange={(e) =>
                    setTestForm({ ...testForm, fastingHours: e.target.value })
                  }
                  type="number"
                />
              </div>
              <div className="responsive-form-field">
                <label>Sonuç (Saat)</label>
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
                <label>Hazırlık</label>
                <input
                  value={testForm.preparation}
                  onChange={(e) =>
                    setTestForm({ ...testForm, preparation: e.target.value })
                  }
                />
              </div>
              <div className="responsive-form-field">
                <label>Fiyat (₺)</label>
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
                Evde numune alınır
              </label>
              <div
                style={{ gridColumn: "1 / -1", display: "flex", gap: "12px" }}
              >
                <button className="primary" style={{ height: "46px", flex: 1 }}>
                  {editingTestId ? "Güncelle" : "Kataloğa Ekle"}
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
                    Vazgeç
                  </button>
                )}
              </div>
            </form>

            <div className="premium-card-list">
              {tests.map((test) => (
                <div key={test.id} className="premium-card-item">
                  <div>
                    <b style={{ fontSize: "16px", color: "#0f172a" }}>
                      {labCategoryLabel(test.category)} · {test.name}
                    </b>
                    <div
                      style={{
                        color: "#64748b",
                        fontSize: "14px",
                        marginTop: "6px",
                      }}
                    >
                      {[
                        labSampleLabel(test.sampleType),
                        test.fastingHours
                          ? `${test.fastingHours} saat açlık`
                          : "Açlık gerekmez",
                        test.turnaroundHours
                          ? `sonuç ${test.turnaroundHours} sa`
                          : "",
                        test.preparation,
                        test.homeCollection ? "Evde numune" : "",
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
                        ? `${test.price.toLocaleString("tr-TR")} ₺`
                        : "Fiyat sorunuz"}
                    </strong>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => editTest(test)}
                    >
                      <PencilSimple size={16} /> Düzenle
                    </button>
                    <button
                      type="button"
                      className="secondary danger"
                      onClick={() => removeTest(test.id)}
                    >
                      <Trash size={16} /> Kaldır
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </details>
      )}
    </div>
  );
}

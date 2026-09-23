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
const stockLabels: Record<string, string> = {
  in_stock: "Stokta var",
  limited: "Sınırlı",
  out_of_stock: "Yok",
};
const emergencyLabels: Record<string, string> = {
  EMERGENCY_DEPARTMENT: "Acil servis",
  EMERGENCY_CONSULT: "Acil danışmanlık",
  AMBULANCE_COORDINATION: "Ambulans koordinasyonu",
  EMERGENCY: "Acil",
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

  const [services, setServices] = useState<any[]>(
    (org.services || []).filter((item: any) => item.isActive !== false)
  );
  const [hours, setHours] = useState<any[]>(org.hours || []);
  const [invites, setInvites] = useState<any[]>(org.doctorInvites || []);
  const [msg, setMsg] = useState("");
  const [stock, setStock] = useState<any[]>(org.stocks || []);
  const [onDuty, setOnDuty] = useState(!!org.isOnDuty);
  const [onDutyUntil, setOnDutyUntil] = useState(
    org.onDutyUntil ? new Date(org.onDutyUntil).toISOString().slice(0, 16) : ""
  );
  const [departments, setDepartments] = useState<any[]>(
    (org.departments || []).filter((item: any) => item.isActive !== false)
  );
  const [campaigns, setCampaigns] = useState<any[]>(org.campaigns || []);
  const [doctors, setDoctors] = useState<any[]>(org.doctors || []);
  const [emergencyServices, setEmergencyServices] = useState<any[]>(
    (org.emergencyServices || []).filter((item: any) => item.isActive !== false)
  );
  const [exams, setExams] = useState<any[]>(org.imagingExams || []);
  const [examForm, setExamForm] = useState(emptyExam);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [tests, setTests] = useState<any[]>(org.laboratoryTests || []);
  const [testForm, setTestForm] = useState(emptyTest);
  const [editingTestId, setEditingTestId] = useState<string | null>(null);

  async function addDepartment(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(`/api/organizations/` + org.id + `/departments`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: f.get("name"),
        floor: f.get("floor"),
        phone: f.get("phone"),
        description: f.get("description"),
      }),
    });
    const j = await r.json();
    if (r.ok) {
      setDepartments((x) => [...x, j]);
      form.reset();
      setMsg("Departman eklendi");
    } else setMsg(j.error);
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
  async function addCampaign(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(`/api/organizations/` + org.id + `/campaigns`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: f.get("title"),
        description: f.get("description"),
        startsAt: f.get("startsAt") || null,
        endsAt: f.get("endsAt") || null,
      }),
    });
    const j = await r.json();
    if (r.ok) {
      setCampaigns((x) => [j, ...x]);
      form.reset();
      setMsg("Kampanya eklendi");
    } else setMsg(j.error);
  }
  async function addVariant(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(
      `/api/organizations/` + org.id + `/service-variants`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          serviceId: f.get("serviceId"),
          label: f.get("label"),
          priceDelta: f.get("priceDelta"),
          durationMinutes: f.get("durationMinutes"),
        }),
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
      form.reset();
      setMsg("Varyant eklendi");
    } else setMsg(j.error);
  }
  async function addEmergencyService(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(
      `/api/organizations/` + org.id + `/emergency-services`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: f.get("name"),
          kind: f.get("kind"),
          phone: f.get("phone"),
          is24Hours: f.get("is24Hours") === "on",
          description: f.get("description"),
        }),
      }
    );
    const j = await r.json();
    if (r.ok) {
      setEmergencyServices((x) => [...x, j]);
      form.reset();
      setMsg("Acil hizmet eklendi");
    } else setMsg(j.error);
  }
  async function addService(e: any) {
    e.preventDefault();
    const form = e.currentTarget;
    const f = new FormData(form);
    const r = await fetch(`/api/organizations/` + org.id + `/services`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: f.get("name"),
        description: f.get("description"),
        price: f.get("price"),
        homeCareKind: f.get("homeCareKind"),
      }),
    });
    const j = await r.json();
    if (r.ok) {
      setServices((x) => [...x, j]);
      form.reset();
      setMsg(
        clinical && org.type === "CLINIC" ? "İşlem eklendi" : "Hizmet eklendi"
      );
    } else setMsg(j.error);
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
    setMsg(r.ok ? "Çalışma saatleri kaydedildi" : "Saatler kaydedilemedi");
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
  async function updateService(
    event: React.FormEvent<HTMLFormElement>,
    serviceId: string
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/organizations/` + org.id + `/services`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        serviceId,
        name: form.get("name"),
        description: form.get("description"),
        price: form.get("price"),
        homeCareKind: form.get("homeCareKind"),
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      setMsg(data.error || "Hizmet güncellenemedi");
      return;
    }
    setServices((current) =>
      current.map((item) => (item.id === data.id ? { ...item, ...data } : item))
    );
    setMsg("Hizmet güncellendi");
  }
  async function hideService(serviceId: string) {
    const response = await fetch(`/api/organizations/` + org.id + `/services`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ serviceId, isActive: false }),
    });
    if (!response.ok) {
      setMsg("Hizmet kaldırılamadı");
      return;
    }
    setServices((current) => current.filter((item) => item.id !== serviceId));
    setMsg("Hizmet yayından kaldırıldı");
  }
  async function hideVariant(serviceId: string, variantId: string) {
    const response = await fetch(
      `/api/organizations/` + org.id + `/service-variants`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ variantId, isActive: false }),
      }
    );
    if (!response.ok) {
      setMsg("Varyant kaldırılamadı");
      return;
    }
    setServices((current) =>
      current.map((item) =>
        item.id === serviceId
          ? {
              ...item,
              variants: (item.variants || []).filter(
                (variant: any) => variant.id !== variantId
              ),
            }
          : item
      )
    );
    setMsg("Varyant kaldırıldı");
  }
  async function updateDepartment(
    event: React.FormEvent<HTMLFormElement>,
    departmentId: string
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(
      `/api/organizations/` + org.id + `/departments`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          departmentId,
          name: form.get("name"),
          floor: form.get("floor"),
          phone: form.get("phone"),
          description: form.get("description"),
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      setMsg(data.error || "Departman güncellenemedi");
      return;
    }
    setDepartments((current) =>
      current.map((item) => (item.id === data.id ? data : item))
    );
    setMsg("Departman güncellendi");
  }
  async function hideDepartment(departmentId: string) {
    const response = await fetch(
      `/api/organizations/` + org.id + `/departments`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ departmentId, isActive: false }),
      }
    );
    if (!response.ok) {
      setMsg("Departman kaldırılamadı");
      return;
    }
    setDepartments((current) =>
      current.filter((item) => item.id !== departmentId)
    );
    setDoctors((current) =>
      current.map((doctor) =>
        doctor.departmentId === departmentId
          ? { ...doctor, departmentId: null }
          : doctor
      )
    );
    setMsg("Departman yayından kaldırıldı");
  }
  async function updateEmergency(
    event: React.FormEvent<HTMLFormElement>,
    emergencyId: string
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(
      `/api/organizations/` + org.id + `/emergency-services`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          emergencyId,
          name: form.get("name"),
          kind: form.get("kind"),
          phone: form.get("phone"),
          is24Hours: form.get("is24Hours") === "on",
          description: form.get("description"),
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      setMsg(data.error || "Acil hizmet güncellenemedi");
      return;
    }
    setEmergencyServices((current) =>
      current.map((item) => (item.id === data.id ? data : item))
    );
    setMsg("Acil hizmet güncellendi");
  }
  async function hideEmergency(emergencyId: string) {
    const response = await fetch(
      `/api/organizations/` + org.id + `/emergency-services`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emergencyId, isActive: false }),
      }
    );
    if (!response.ok) {
      setMsg("Acil hizmet kaldırılamadı");
      return;
    }
    setEmergencyServices((current) =>
      current.filter((item) => item.id !== emergencyId)
    );
    setMsg("Acil hizmet yayından kaldırıldı");
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
            <form onSubmit={addService} className="responsive-form-grid">
              <div className="responsive-form-field">
                <label>
                  {org.type === "CLINIC"
                    ? "Muayene veya işlem adı"
                    : "Hizmet adı"}
                </label>
                <input name="name" required />
              </div>
              <div className="responsive-form-field">
                <label>Fiyat (₺)</label>
                <input name="price" type="number" min="0" />
              </div>
              <div className="responsive-form-field">
                <label>Kısa açıklama</label>
                <input name="description" />
              </div>
              <div className="responsive-form-field">
                <label>Konum</label>
                <select name="homeCareKind" defaultValue="">
                  <option value="">Yalnızca kurumda</option>
                  <option value="nurse">Evde hemşirelik</option>
                  <option value="dressing">Evde pansuman</option>
                  <option value="physio">Evde fizyoterapi</option>
                </select>
              </div>
              <button className="primary" style={{ height: "46px" }}>
                Hizmet Ekle
              </button>
            </form>

            <div className="premium-card-list">
              {services.map((s) => (
                <form
                  key={s.id}
                  onSubmit={(event) => updateService(event, s.id)}
                  className="premium-card-item"
                >
                  <div
                    className="responsive-form-field"
                    style={{ flex: 2, minWidth: "200px" }}
                  >
                    <input
                      name="name"
                      defaultValue={s.name}
                      required
                      style={{ fontWeight: 600 }}
                    />
                  </div>
                  <div
                    className="responsive-form-field"
                    style={{ flex: 1, minWidth: "120px" }}
                  >
                    <input
                      name="price"
                      type="number"
                      min="0"
                      defaultValue={s.price ?? ""}
                      placeholder="Fiyat (₺)"
                    />
                  </div>
                  <div
                    className="responsive-form-field"
                    style={{ flex: 2, minWidth: "200px" }}
                  >
                    <input
                      name="description"
                      defaultValue={s.description || ""}
                      placeholder="Kısa açıklama"
                    />
                  </div>
                  <div
                    className="responsive-form-field"
                    style={{ flex: 1, minWidth: "150px" }}
                  >
                    <select
                      name="homeCareKind"
                      defaultValue={s.homeCareKind || ""}
                    >
                      <option value="">Yalnızca kurumda</option>
                      <option value="nurse">Evde hemşirelik</option>
                      <option value="dressing">Evde pansuman</option>
                      <option value="physio">Evde fizyoterapi</option>
                    </select>
                  </div>
                  <div
                    className="premium-card-item-actions"
                    style={{ display: "flex", gap: "8px" }}
                  >
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => hideService(s.id)}
                    >
                      Kaldır
                    </button>
                    <button className="primary" type="submit">
                      Kaydet
                    </button>
                  </div>
                </form>
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
                <select name="serviceId" required>
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
                <input name="label" required />
              </div>
              <div className="responsive-form-field">
                <label>Ek fiyat (₺)</label>
                <input name="priceDelta" type="number" />
              </div>
              <div className="responsive-form-field">
                <label>Süre (dk)</label>
                <input name="durationMinutes" type="number" />
              </div>
              <button className="primary" style={{ height: "46px" }}>
                Ekle
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
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => hideVariant(s.id, v.id)}
                      >
                        Kaldır
                      </button>
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
            <button className="primary" onClick={saveHours}>
              Tüm Saatleri Kaydet
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
                    <input
                      type="checkbox"
                      checked={!!h.isClosed}
                      onChange={(e) =>
                        updateHour(weekday, "isClosed", e.target.checked)
                      }
                      style={{
                        width: "20px",
                        height: "20px",
                        accentColor: "#ef4444",
                      }}
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
            <form onSubmit={addDepartment} className="responsive-form-grid">
              <div className="responsive-form-field">
                <label>Departman Adı</label>
                <input name="name" placeholder="Örn: Kardiyoloji" required />
              </div>
              <div className="responsive-form-field">
                <label>Kat / Bölüm</label>
                <input name="floor" placeholder="1. Kat" />
              </div>
              <div className="responsive-form-field">
                <label>Dahili Telefon</label>
                <input name="phone" placeholder="105" />
              </div>
              <div className="responsive-form-field">
                <label>Açıklama</label>
                <input name="description" />
              </div>
              <button className="primary" style={{ height: "46px" }}>
                Departman Ekle
              </button>
            </form>

            <div className="premium-card-list">
              {departments.map((d) => (
                <form
                  key={d.id}
                  onSubmit={(event) => updateDepartment(event, d.id)}
                  className="premium-card-item"
                >
                  <div className="responsive-form-field" style={{ flex: 2 }}>
                    <input
                      name="name"
                      defaultValue={d.name}
                      required
                      style={{ fontWeight: 600 }}
                    />
                  </div>
                  <div className="responsive-form-field" style={{ flex: 1 }}>
                    <input
                      name="floor"
                      defaultValue={d.floor || ""}
                      placeholder="Kat"
                    />
                  </div>
                  <div className="responsive-form-field" style={{ flex: 1 }}>
                    <input
                      name="phone"
                      defaultValue={d.phone || ""}
                      placeholder="Telefon"
                    />
                  </div>
                  <div className="responsive-form-field" style={{ flex: 2 }}>
                    <input
                      name="description"
                      defaultValue={d.description || ""}
                      placeholder="Açıklama"
                    />
                  </div>
                  <div
                    className="premium-card-item-actions"
                    style={{ display: "flex", gap: "8px" }}
                  >
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => hideDepartment(d.id)}
                    >
                      Kaldır
                    </button>
                    <button className="primary" type="submit">
                      Kaydet
                    </button>
                  </div>
                </form>
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
          <form onSubmit={addCampaign} className="responsive-form-grid">
            <div className="responsive-form-field">
              <label>Kampanya başlığı</label>
              <input name="title" required />
            </div>
            <div className="responsive-form-field">
              <label>Başlangıç</label>
              <input name="startsAt" type="date" />
            </div>
            <div className="responsive-form-field">
              <label>Bitiş</label>
              <input name="endsAt" type="date" />
            </div>
            <div
              className="responsive-form-field"
              style={{ gridColumn: "1 / -1" }}
            >
              <label>Açıklama (Hastanın göreceği metin)</label>
              <textarea name="description" rows={3}></textarea>
            </div>
            <button
              className="primary"
              style={{ height: "46px", gridColumn: "1 / -1" }}
            >
              Kampanyayı Yayınla
            </button>
          </form>

          <div className="premium-card-list">
            {campaigns.map((c) => (
              <div key={c.id} className="premium-card-item">
                <div>
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
                </div>
                <span
                  className="premium-badge"
                  style={{
                    background: c.isActive ? "#f0fdf4" : "#f1f5f9",
                    color: c.isActive ? "#16a34a" : "#64748b",
                  }}
                >
                  {c.isActive ? "Aktif" : "Pasif"}
                </span>
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
            <form
              onSubmit={addEmergencyService}
              className="responsive-form-grid"
            >
              <div className="responsive-form-field">
                <label>Birim Adı</label>
                <input name="name" placeholder="Örn: Acil Servis" required />
              </div>
              <div className="responsive-form-field">
                <label>Hizmet Tipi</label>
                <select name="kind">
                  <option value="EMERGENCY_DEPARTMENT">Acil servis</option>
                  <option value="EMERGENCY_CONSULT">Acil danışmanlık</option>
                  <option value="AMBULANCE_COORDINATION">
                    Ambulans koordinasyonu
                  </option>
                </select>
              </div>
              <div className="responsive-form-field">
                <label>İletişim</label>
                <input name="phone" placeholder="Telefon" />
              </div>
              <div className="responsive-form-field">
                <label>Ek Bilgi</label>
                <input name="description" placeholder="Açıklama" />
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
                  name="is24Hours"
                  type="checkbox"
                  style={{
                    width: "20px",
                    height: "20px",
                    accentColor: "#dc2626",
                  }}
                />{" "}
                7/24 Hizmet
              </label>
              <button className="primary" style={{ height: "46px" }}>
                Ekle
              </button>
            </form>

            <div className="premium-card-list">
              {emergencyServices.map((item: any) => (
                <form
                  key={item.id}
                  onSubmit={(event) => updateEmergency(event, item.id)}
                  className="premium-card-item"
                >
                  <div className="responsive-form-field" style={{ flex: 2 }}>
                    <input
                      name="name"
                      defaultValue={item.name}
                      required
                      style={{ fontWeight: 600 }}
                    />
                  </div>
                  <div className="responsive-form-field" style={{ flex: 2 }}>
                    <select name="kind" defaultValue={item.kind}>
                      <option value="EMERGENCY_DEPARTMENT">Acil servis</option>
                      <option value="EMERGENCY_CONSULT">
                        Acil danışmanlık
                      </option>
                      <option value="AMBULANCE_COORDINATION">
                        Ambulans koordinasyonu
                      </option>
                    </select>
                  </div>
                  <div className="responsive-form-field" style={{ flex: 1 }}>
                    <input
                      name="phone"
                      defaultValue={item.phone || ""}
                      placeholder="Telefon"
                    />
                  </div>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: 700,
                    }}
                  >
                    <input
                      name="is24Hours"
                      type="checkbox"
                      defaultChecked={!!item.is24Hours}
                      style={{ width: "20px", height: "20px" }}
                    />{" "}
                    7/24
                  </label>
                  <div
                    className="premium-card-item-actions"
                    style={{ display: "flex", gap: "8px" }}
                  >
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => hideEmergency(item.id)}
                    >
                      Kaldır
                    </button>
                    <button className="primary" type="submit">
                      Kaydet
                    </button>
                  </div>
                </form>
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
                    <b style={{ flex: 1, fontSize: "16px" }}>{s.itemName}</b>
                    <select
                      value={s.stockStatus}
                      onChange={(event) =>
                        updateStock(s.id, event.target.value)
                      }
                      style={{
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid #cbd5e1",
                        fontWeight: 600,
                        color:
                          s.stockStatus === "in_stock"
                            ? "#16a34a"
                            : s.stockStatus === "out_of_stock"
                            ? "#ef4444"
                            : "#ea580c",
                      }}
                    >
                      <option value="in_stock">Stokta var</option>
                      <option value="limited">Sınırlı</option>
                      <option value="out_of_stock">Yok</option>
                    </select>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => removeStock(s.id)}
                    >
                      Kaldır
                    </button>
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
                      gap: "16px",
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
                      Düzenle
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => removeExam(exam.id)}
                    >
                      Kaldır
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
                      gap: "16px",
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
                      Düzenle
                    </button>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => removeTest(test.id)}
                    >
                      Kaldır
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

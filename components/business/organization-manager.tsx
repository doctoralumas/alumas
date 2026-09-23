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
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div
        style={{
          background: "#f8fafc",
          padding: "16px 20px",
          borderRadius: "16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "8px",
        }}
      >
        <Info size={24} weight="duotone" color="#3b82f6" />
        <p className="muted" style={{ margin: 0, fontSize: "14px" }}>
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

      <div
        className="business-manage-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
          gap: "24px",
          alignItems: "start",
        }}
      >
        <section
          className="panel form-span"
          style={{ gridColumn: "1 / -1", padding: "24px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#fef2f2",
                  color: "#ef4444",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MapPin size={24} weight="duotone" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  Konum
                </h2>
                <p className="muted" style={{ margin: 0, fontSize: "14px" }}>
                  {org.address} · {org.city}
                </p>
              </div>
            </div>
            <button className="secondary" onClick={locate}>
              Adresten harita konumu bul
            </button>
          </div>
          <small
            className="muted"
            style={{
              display: "block",
              marginTop: "12px",
              borderTop: "1px dashed #e2e8f0",
              paddingTop: "12px",
            }}
          >
            Hastalarınızın kurumunuzu haritada daha kolay bulabilmesi için
            konumunuzu doğrulayın.
          </small>
        </section>

        {clinical && (
          <section className="panel" style={{ padding: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FirstAid size={24} weight="duotone" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  {org.type === "CLINIC"
                    ? "Muayene ve işlemler"
                    : "Klinik hizmetler"}
                </h2>
              </div>
            </div>
            <form
              className="compact-form"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "20px",
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
              onSubmit={addService}
            >
              <div style={{ display: "flex", gap: "12px" }}>
                <input
                  name="name"
                  placeholder={
                    org.type === "CLINIC"
                      ? "Muayene veya işlem adı"
                      : "Hizmet adı"
                  }
                  required
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <input
                  name="price"
                  type="number"
                  min="0"
                  placeholder="Fiyat (₺)"
                  style={{
                    width: "120px",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <input
                  name="description"
                  placeholder="Kısa açıklama"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <select
                  name="homeCareKind"
                  defaultValue=""
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <option value="">Yalnızca kurumda</option>
                  <option value="nurse">Evde hemşirelik</option>
                  <option value="dressing">Evde pansuman</option>
                  <option value="physio">Evde fizyoterapi</option>
                </select>
              </div>
              <button
                className="primary"
                style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
              >
                Hizmet Ekle
              </button>
            </form>
            <div
              className="slot-list"
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {services.map((s) => (
                <div
                  className="slot-row"
                  key={s.id}
                  style={{
                    padding: "16px",
                    background: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <form
                    onSubmit={(event) => updateService(event, s.id)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "10px",
                      width: "100%",
                    }}
                  >
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        name="name"
                        defaultValue={s.name}
                        required
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                        }}
                      />
                      <input
                        name="price"
                        type="number"
                        min="0"
                        defaultValue={s.price ?? ""}
                        placeholder="Fiyat (₺)"
                        style={{
                          width: "100px",
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                        }}
                      />
                    </div>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <input
                        name="description"
                        defaultValue={s.description || ""}
                        placeholder="Kısa açıklama"
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                        }}
                      />
                      <select
                        name="homeCareKind"
                        defaultValue={s.homeCareKind || ""}
                        style={{
                          flex: 1,
                          padding: "8px",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        <option value="">Yalnızca kurumda</option>
                        <option value="nurse">Evde hemşirelik</option>
                        <option value="dressing">Evde pansuman</option>
                        <option value="physio">Evde fizyoterapi</option>
                      </select>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        gap: "8px",
                        justifyContent: "flex-end",
                        marginTop: "4px",
                      }}
                    >
                      <button
                        className="secondary"
                        type="button"
                        onClick={() => hideService(s.id)}
                        style={{ padding: "6px 12px" }}
                      >
                        Kaldır
                      </button>
                      <button
                        className="primary"
                        type="submit"
                        style={{ padding: "6px 16px", fontSize: "13px" }}
                      >
                        Kaydet
                      </button>
                    </div>
                  </form>
                </div>
              ))}
            </div>
          </section>
        )}

        {clinical && (
          <section className="panel" style={{ padding: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#fdf4ff",
                  color: "#c026d3",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ListDashes size={24} weight="duotone" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  Hizmet varyantları
                </h2>
              </div>
            </div>
            <form
              className="compact-form"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "20px",
                background: "#f8fafc",
                padding: "16px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
              onSubmit={addVariant}
            >
              <select
                name="serviceId"
                required
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              >
                <option value="">Hizmet seç</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <div style={{ display: "flex", gap: "12px" }}>
                <input
                  name="label"
                  placeholder="Örn: Premium / 60 dk"
                  required
                  style={{
                    flex: 2,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <input
                  name="priceDelta"
                  type="number"
                  placeholder="Ek fiyat (₺)"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <input
                  name="durationMinutes"
                  type="number"
                  placeholder="Süre (dk)"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </div>
              <button
                className="primary"
                style={{ width: "100%", padding: "10px", borderRadius: "8px" }}
              >
                Varyant ekle
              </button>
            </form>
            <div
              className="slot-list"
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              {services.flatMap((s) =>
                (s.variants || [])
                  .filter((variant: any) => variant.isActive !== false)
                  .map((v: any) => (
                    <div
                      className="slot-row"
                      key={v.id}
                      style={{
                        padding: "12px 16px",
                        background: "#ffffff",
                        borderRadius: "12px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid #e2e8f0",
                      }}
                    >
                      <div>
                        <b style={{ color: "#0f172a" }}>{s.name}</b>{" "}
                        <span style={{ color: "#64748b" }}>· {v.label}</span>
                        <div
                          style={{
                            fontSize: "13px",
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
                        style={{ padding: "6px 12px" }}
                      >
                        Kaldır
                      </button>
                    </div>
                  ))
              )}
            </div>
          </section>
        )}

        {clinical && <HomeVisitQueue organizationId={org.id} />}

        {clinical && (
          <section className="panel" style={{ padding: "24px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#f0fdf4",
                  color: "#16a34a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <EnvelopeSimpleOpen size={24} weight="duotone" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  Doktor davetleri
                </h2>
              </div>
            </div>
            <form
              className="compact-form"
              style={{ display: "flex", gap: "12px", marginBottom: "20px" }}
              onSubmit={invite}
            >
              <input
                name="email"
                type="email"
                placeholder="doktor@ornek.com"
                required
                style={{
                  flex: 2,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              />
              <input
                name="specialty"
                placeholder="Branş"
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              />
              <button
                className="primary"
                style={{ padding: "10px 16px", borderRadius: "8px" }}
              >
                Davet gönder
              </button>
            </form>
            <div
              className="slot-list"
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              {invites.map((i) => (
                <div
                  className="slot-row"
                  key={i.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <div>
                    <b style={{ display: "block", color: "#0f172a" }}>
                      {i.email}
                    </b>
                    <span style={{ color: "#64748b", fontSize: "13px" }}>
                      {i.specialty || "Doktor"}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: "20px",
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
          </section>
        )}

        <section
          className="panel form-span"
          style={{ gridColumn: "1 / -1", padding: "24px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "24px",
              borderBottom: "1px solid #e2e8f0",
              paddingBottom: "16px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#f8fafc",
                  color: "#64748b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Clock size={24} weight="duotone" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  Çalışma saatleri
                </h2>
                <p className="muted" style={{ margin: 0, fontSize: "14px" }}>
                  Kuruma göre haftalık açılış ve kapanış.
                </p>
              </div>
            </div>
            <button className="primary" onClick={saveHours}>
              Saatleri Kaydet
            </button>
          </div>
          <div
            className="hours-grid"
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
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
                    padding: "16px",
                    background: h.isClosed ? "#f8fafc" : "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                  }}
                >
                  <b
                    style={{
                      width: "100px",
                      color: h.isClosed ? "#94a3b8" : "#0f172a",
                    }}
                  >
                    {d}
                  </b>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100px",
                      cursor: "pointer",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!h.isClosed}
                      onChange={(e) =>
                        updateHour(weekday, "isClosed", e.target.checked)
                      }
                      style={{ width: "18px", height: "18px" }}
                    />
                    <span
                      style={{
                        color: h.isClosed ? "#ef4444" : "#64748b",
                        fontWeight: 500,
                      }}
                    >
                      Kapalı
                    </span>
                  </label>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      flex: 1,
                      opacity: h.isClosed ? 0.4 : 1,
                      pointerEvents: h.isClosed ? "none" : "auto",
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
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                      }}
                    />
                    <span style={{ color: "#94a3b8" }}>-</span>
                    <input
                      type="time"
                      value={h.closesAt || "18:00"}
                      onChange={(e) =>
                        updateHour(weekday, "closesAt", e.target.value)
                      }
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {hospital && (
          <section
            className="panel form-span"
            style={{ gridColumn: "1 / -1", padding: "24px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#eff6ff",
                  color: "#3b82f6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UsersThree size={24} weight="duotone" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  Branşlar ve departmanlar
                </h2>
                <p className="muted" style={{ margin: 0, fontSize: "14px" }}>
                  Uzmanları hastane departmanlarına bağlayın.
                </p>
              </div>
            </div>
            <form
              className="compact-form"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
                marginBottom: "24px",
                background: "#f8fafc",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
              onSubmit={addDepartment}
            >
              <input
                name="name"
                placeholder="Örn: Kardiyoloji"
                required
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              />
              <input
                name="floor"
                placeholder="Kat / bölüm"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              />
              <input
                name="phone"
                placeholder="Dahili telefon"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              />
              <input
                name="description"
                placeholder="Kısa açıklama"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              />
              <button
                className="primary"
                style={{
                  gridColumn: "1 / -1",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                Departman Ekle
              </button>
            </form>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "16px",
              }}
            >
              {departments.map((d) => (
                <form
                  key={d.id}
                  onSubmit={(event) => updateDepartment(event, d.id)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px",
                  }}
                >
                  <input
                    name="name"
                    defaultValue={d.name}
                    required
                    style={{
                      fontWeight: 600,
                      fontSize: "15px",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      name="floor"
                      defaultValue={d.floor || ""}
                      placeholder="Kat"
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                      }}
                    />
                    <input
                      name="phone"
                      defaultValue={d.phone || ""}
                      placeholder="Telefon"
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                      }}
                    />
                  </div>
                  <input
                    name="description"
                    defaultValue={d.description || ""}
                    placeholder="Açıklama"
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                  <div
                    style={{ display: "flex", gap: "8px", marginTop: "8px" }}
                  >
                    <button
                      className="secondary"
                      type="button"
                      onClick={() => hideDepartment(d.id)}
                      style={{ flex: 1 }}
                    >
                      Kaldır
                    </button>
                    <button
                      className="primary"
                      type="submit"
                      style={{ flex: 1 }}
                    >
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
                  borderTop: "1px dashed #e2e8f0",
                  paddingTop: "24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "16px",
                    marginBottom: "16px",
                    color: "#0f172a",
                  }}
                >
                  Doktor Atamaları
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                    gap: "12px",
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
                        borderRadius: "12px",
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
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "1px solid #cbd5e1",
                          fontSize: "13px",
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
          </section>
        )}

        <section
          className="panel form-span"
          style={{ gridColumn: "1 / -1", padding: "24px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "#fef9c3",
                color: "#ca8a04",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Megaphone size={24} weight="duotone" />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                Kampanyalar
              </h2>
              <p className="muted" style={{ margin: 0, fontSize: "14px" }}>
                Onaylı kurum profilinde ve Alumas Kampanyalar sayfasında
                gösterilir.
              </p>
            </div>
          </div>

          <form
            className="panel-fields"
            onSubmit={addCampaign}
            style={{
              background: "#f8fafc",
              padding: "20px",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
            }}
          >
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              <span style={{ fontWeight: 600, fontSize: "13px" }}>
                Kampanya başlığı
              </span>
              <input
                name="title"
                placeholder="Başlık"
                required
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              />
            </label>
            <div style={{ display: "flex", gap: "16px", gridColumn: "1 / -1" }}>
              <label className="field" style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: "13px" }}>
                  Başlangıç
                </span>
                <input
                  name="startsAt"
                  type="date"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    width: "100%",
                  }}
                />
              </label>
              <label className="field" style={{ flex: 1 }}>
                <span style={{ fontWeight: 600, fontSize: "13px" }}>Bitiş</span>
                <input
                  name="endsAt"
                  type="date"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    width: "100%",
                  }}
                />
              </label>
            </div>
            <label className="field" style={{ gridColumn: "1 / -1" }}>
              <span style={{ fontWeight: 600, fontSize: "13px" }}>
                Kısa açıklama
              </span>
              <textarea
                name="description"
                placeholder="Hastanın göreceği metin"
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  minHeight: "80px",
                  fontFamily: "inherit",
                }}
              />
            </label>
            <button
              className="primary"
              style={{
                gridColumn: "1 / -1",
                padding: "12px",
                borderRadius: "8px",
              }}
            >
              Yayınla
            </button>
          </form>

          <div
            className="slot-list"
            style={{ marginTop: "24px", display: "grid", gap: "12px" }}
          >
            {campaigns.map((c) => (
              <div
                className="slot-row"
                key={c.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  background: "#ffffff",
                }}
              >
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
                      marginTop: "4px",
                      display: "block",
                    }}
                  >
                    {c.description || "Açıklama yok"}
                  </span>
                </div>
                <span
                  style={{
                    padding: "6px 16px",
                    borderRadius: "20px",
                    fontSize: "13px",
                    fontWeight: 600,
                    background: c.isActive ? "#f0fdf4" : "#f1f5f9",
                    color: c.isActive ? "#16a34a" : "#64748b",
                  }}
                >
                  {c.isActive ? "Aktif" : "Pasif"}
                </span>
              </div>
            ))}
          </div>
        </section>

        {hospital && (
          <section
            className="panel form-span"
            style={{ gridColumn: "1 / -1", padding: "24px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#fee2e2",
                  color: "#dc2626",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ambulance size={24} weight="duotone" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  Acil hizmetler
                </h2>
                <p className="muted" style={{ margin: 0, fontSize: "14px" }}>
                  Acil servis, danışma hattı veya 7/24 birimler.
                </p>
              </div>
            </div>

            <form
              className="compact-form"
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
                marginBottom: "24px",
                flexWrap: "wrap",
                background: "#f8fafc",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
              }}
              onSubmit={addEmergencyService}
            >
              <input
                name="name"
                placeholder="Acil Servis"
                required
                style={{
                  flex: 1,
                  minWidth: "150px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              />
              <select
                name="kind"
                style={{
                  flex: 1,
                  minWidth: "150px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              >
                <option value="EMERGENCY_DEPARTMENT">Acil servis</option>
                <option value="EMERGENCY_CONSULT">Acil danışmanlık</option>
                <option value="AMBULANCE_COORDINATION">
                  Ambulans koordinasyonu
                </option>
              </select>
              <input
                name="phone"
                placeholder="Telefon"
                style={{
                  flex: 1,
                  minWidth: "150px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              />
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 600,
                }}
              >
                <input
                  name="is24Hours"
                  type="checkbox"
                  style={{ width: "18px", height: "18px" }}
                />{" "}
                7/24
              </label>
              <input
                name="description"
                placeholder="Açıklama"
                style={{
                  flex: 2,
                  minWidth: "200px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                }}
              />
              <button
                className="primary"
                style={{ padding: "10px 24px", borderRadius: "8px" }}
              >
                Ekle
              </button>
            </form>

            <div className="slot-list" style={{ display: "grid", gap: "12px" }}>
              {emergencyServices.map((item: any) => (
                <form
                  className="slot-row"
                  key={item.id}
                  onSubmit={(event) => updateEmergency(event, item.id)}
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "12px",
                    alignItems: "center",
                    padding: "16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    background: "#ffffff",
                  }}
                >
                  <input
                    name="name"
                    defaultValue={item.name}
                    required
                    style={{
                      flex: 1,
                      minWidth: "150px",
                      fontWeight: 600,
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                  <select
                    name="kind"
                    defaultValue={item.kind}
                    style={{
                      flex: 1,
                      minWidth: "150px",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  >
                    <option value="EMERGENCY_DEPARTMENT">Acil servis</option>
                    <option value="EMERGENCY_CONSULT">Acil danışmanlık</option>
                    <option value="AMBULANCE_COORDINATION">
                      Ambulans koordinasyonu
                    </option>
                  </select>
                  <input
                    name="phone"
                    defaultValue={item.phone || ""}
                    placeholder="Telefon"
                    style={{
                      flex: 1,
                      minWidth: "120px",
                      padding: "8px",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                    }}
                  />
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      fontWeight: 600,
                    }}
                  >
                    <input
                      name="is24Hours"
                      type="checkbox"
                      defaultChecked={!!item.is24Hours}
                      style={{ width: "18px", height: "18px" }}
                    />{" "}
                    7/24
                  </label>
                  <div
                    style={{ display: "flex", gap: "8px", marginLeft: "auto" }}
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
          </section>
        )}

        {pharmacy && (
          <>
            <section
              className="panel form-span"
              style={{ gridColumn: "1 / -1", padding: "24px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "12px",
                      background: "#fef2f2",
                      color: "#ef4444",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <FirstAid size={24} weight="duotone" />
                  </div>
                  <div>
                    <h2
                      style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}
                    >
                      Nöbetçi eczane
                    </h2>
                    <p
                      className="muted"
                      style={{ margin: 0, fontSize: "14px" }}
                    >
                      Bu bilgi nöbetçi eczane filtresinde görünür.
                    </p>
                  </div>
                </div>
                <button className="primary" onClick={saveDuty}>
                  Durumu Kaydet
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                  background: "#f8fafc",
                  padding: "24px",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
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
                      padding: "10px 16px",
                      borderRadius: "8px",
                      border: "1px solid #cbd5e1",
                      fontSize: "15px",
                      fontWeight: 500,
                    }}
                  />
                </div>
              </div>
            </section>

            <section
              className="panel form-span"
              style={{ gridColumn: "1 / -1", padding: "24px" }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "12px",
                    background: "#eff6ff",
                    color: "#3b82f6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Pill size={24} weight="duotone" />
                </div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                    Eczane stok yönetimi
                  </h2>
                  <p className="muted" style={{ margin: 0, fontSize: "14px" }}>
                    Kullanıcılara adet yerine yalnızca stok durumu gösterilir.
                  </p>
                </div>
              </div>

              <form
                className="compact-form"
                style={{
                  display: "flex",
                  gap: "12px",
                  alignItems: "center",
                  marginBottom: "24px",
                  background: "#f8fafc",
                  padding: "20px",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                }}
                onSubmit={addStock}
              >
                <input
                  name="itemName"
                  placeholder="Ürün / ilaç adı"
                  required
                  style={{
                    flex: 2,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <select
                  name="stockStatus"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  <option value="in_stock">Stokta var</option>
                  <option value="limited">Sınırlı</option>
                  <option value="out_of_stock">Yok</option>
                </select>
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  placeholder="Adet (kurum içi)"
                  style={{
                    flex: 1,
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
                <button
                  className="primary"
                  style={{ padding: "10px 24px", borderRadius: "8px" }}
                >
                  Güncelle
                </button>
              </form>

              <div
                className="slot-list"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  gap: "12px",
                }}
              >
                {stock.map((s) => (
                  <div
                    className="slot-row"
                    key={s.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "16px",
                      border: "1px solid #e2e8f0",
                      borderRadius: "12px",
                      background: "#ffffff",
                    }}
                  >
                    <b style={{ flex: 1, fontSize: "15px" }}>{s.itemName}</b>
                    <select
                      value={s.stockStatus}
                      onChange={(event) =>
                        updateStock(s.id, event.target.value)
                      }
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
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
            </section>
          </>
        )}

        {imaging && (
          <section
            className="panel form-span"
            style={{ gridColumn: "1 / -1", padding: "24px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#f3e8ff",
                  color: "#9333ea",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Heartbeat size={24} weight="duotone" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  Tetkik kataloğu
                </h2>
                <p className="muted" style={{ margin: 0, fontSize: "14px" }}>
                  Hasta sayfasında tür, bölge, hazırlık, çekim süresi, rapor
                  süresi ve fiyat görünür.
                </p>
              </div>
            </div>

            <form
              className="panel-fields"
              onSubmit={saveExam}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                background: "#f8fafc",
                padding: "24px",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
              }}
            >
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>Tür</span>
                <select
                  value={examForm.modality}
                  onChange={(e) =>
                    setExamForm({ ...examForm, modality: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  {IMAGING_MODALITIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>
                  Tetkik adı
                </span>
                <input
                  value={examForm.name}
                  onChange={(e) =>
                    setExamForm({ ...examForm, name: e.target.value })
                  }
                  placeholder="Örn. Beyin MR"
                  required
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </label>
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>Bölge</span>
                <input
                  value={examForm.bodyRegion}
                  onChange={(e) =>
                    setExamForm({ ...examForm, bodyRegion: e.target.value })
                  }
                  placeholder="Örn. Baş"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </label>
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>
                  Hazırlık
                </span>
                <input
                  value={examForm.preparation}
                  onChange={(e) =>
                    setExamForm({ ...examForm, preparation: e.target.value })
                  }
                  placeholder="Örn. 4 saat açlık"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </label>
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>
                  Çekim süresi (dk)
                </span>
                <input
                  value={examForm.durationMinutes}
                  onChange={(e) =>
                    setExamForm({
                      ...examForm,
                      durationMinutes: e.target.value,
                    })
                  }
                  type="number"
                  min="0"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </label>
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>
                  Rapor süresi (saat)
                </span>
                <input
                  value={examForm.reportHours}
                  onChange={(e) =>
                    setExamForm({ ...examForm, reportHours: e.target.value })
                  }
                  type="number"
                  min="0"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </label>
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>
                  Fiyat (₺)
                </span>
                <input
                  value={examForm.price}
                  onChange={(e) =>
                    setExamForm({ ...examForm, price: e.target.value })
                  }
                  type="number"
                  min="0"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </label>
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  gap: "12px",
                  marginTop: "8px",
                }}
              >
                <button
                  className="primary"
                  style={{ padding: "12px 24px", borderRadius: "8px" }}
                >
                  {editingExamId ? "Tetkiği güncelle" : "Kataloğa ekle"}
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

            <div
              className="slot-list"
              style={{ marginTop: "24px", display: "grid", gap: "12px" }}
            >
              {exams.map((exam) => (
                <div
                  className="slot-row"
                  key={exam.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    background: "#ffffff",
                  }}
                >
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
              {!exams.length && (
                <div
                  className="empty"
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    color: "#94a3b8",
                    fontSize: "15px",
                  }}
                >
                  Henüz tetkik yok.
                </div>
              )}
            </div>
          </section>
        )}

        {laboratory && (
          <section
            className="panel form-span"
            style={{ gridColumn: "1 / -1", padding: "24px" }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: "#ecfdf5",
                  color: "#10b981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Flask size={24} weight="duotone" />
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700 }}>
                  Tahlil kataloğu
                </h2>
                <p className="muted" style={{ margin: 0, fontSize: "14px" }}>
                  Hasta sayfasında grup, numune, açlık, sonuç süresi ve fiyat
                  görünür.
                </p>
              </div>
            </div>

            <form
              className="panel-fields"
              onSubmit={saveTest}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
                background: "#f8fafc",
                padding: "24px",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
              }}
            >
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>Grup</span>
                <select
                  value={testForm.category}
                  onChange={(e) =>
                    setTestForm({ ...testForm, category: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  {LAB_CATEGORIES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>
                  Numune
                </span>
                <select
                  value={testForm.sampleType}
                  onChange={(e) =>
                    setTestForm({ ...testForm, sampleType: e.target.value })
                  }
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                >
                  {LAB_SAMPLE_TYPES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>
                  Tahlil adı
                </span>
                <input
                  value={testForm.name}
                  onChange={(e) =>
                    setTestForm({ ...testForm, name: e.target.value })
                  }
                  placeholder="Örn. Hemogram"
                  required
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </label>
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>
                  Açlık (saat)
                </span>
                <input
                  value={testForm.fastingHours}
                  onChange={(e) =>
                    setTestForm({ ...testForm, fastingHours: e.target.value })
                  }
                  type="number"
                  min="0"
                  placeholder="Boşsa gerekmez"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </label>
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>
                  Sonuç süresi (saat)
                </span>
                <input
                  value={testForm.turnaroundHours}
                  onChange={(e) =>
                    setTestForm({
                      ...testForm,
                      turnaroundHours: e.target.value,
                    })
                  }
                  type="number"
                  min="0"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </label>
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>
                  Hazırlık
                </span>
                <input
                  value={testForm.preparation}
                  onChange={(e) =>
                    setTestForm({ ...testForm, preparation: e.target.value })
                  }
                  placeholder="Örn. sabah numunesi"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </label>
              <label className="field">
                <span style={{ fontWeight: 600, fontSize: "13px" }}>
                  Fiyat (₺)
                </span>
                <input
                  value={testForm.price}
                  onChange={(e) =>
                    setTestForm({ ...testForm, price: e.target.value })
                  }
                  type="number"
                  min="0"
                  style={{
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                  }}
                />
              </label>
              <label
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontWeight: 700,
                  marginTop: "8px",
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
                  style={{
                    width: "20px",
                    height: "20px",
                    accentColor: "#0f172a",
                  }}
                />{" "}
                Evde numune alınır
              </label>
              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  gap: "12px",
                  marginTop: "12px",
                }}
              >
                <button
                  className="primary"
                  style={{ padding: "12px 24px", borderRadius: "8px" }}
                >
                  {editingTestId ? "Tahlili güncelle" : "Kataloğa ekle"}
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

            <div
              className="slot-list"
              style={{ marginTop: "24px", display: "grid", gap: "12px" }}
            >
              {tests.map((test) => (
                <div
                  className="slot-row"
                  key={test.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "16px",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    background: "#ffffff",
                  }}
                >
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
              {!tests.length && (
                <div
                  className="empty"
                  style={{
                    padding: "32px",
                    textAlign: "center",
                    background: "#f8fafc",
                    borderRadius: "12px",
                    color: "#94a3b8",
                    fontSize: "15px",
                  }}
                >
                  Henüz tahlil yok.
                </div>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

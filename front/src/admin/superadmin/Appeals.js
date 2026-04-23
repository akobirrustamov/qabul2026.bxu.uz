import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import ApiCall, { baseUrl } from "../../config";
import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import Select from "react-select";

/* ── tiny helpers ── */
const fmtDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleString("uz-UZ", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const DocBadge = ({ status }) => {
  const map = {
    0: "bg-red-100 text-red-600",
    1: "bg-yellow-100 text-yellow-700",
    2: "bg-green-100 text-green-700",
  };
  const labels = { 0: "Topshirilmagan", 1: "To'liq emas", 2: "To'liq" };
  const cls = map[status] ?? map[0];
  return (
    <span
      className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}
    >
      {labels[status] ?? "Noma'lum"}
    </span>
  );
};

const statusLabel = (s) =>
  ({
    1: "Tel kiritgan",
    2: "Ma'lumot kiritgan",
    3: "Test yechgan",
    4: "Shartnoma olgan",
  })[s] ?? "—";

/* ── icons ── */
const IconEdit = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);
const IconPdf = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);
const IconTrash = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);
const IconExcel = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 15v2a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-2m-8 1V4m0 12-4-4m4 4 4-4" />
  </svg>
);
const IconChevronDown = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconChevronUp = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
const IconPrev = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="15 18 9 12 15 6" />
  </svg>
);
const IconNext = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/* ── shared react-select styles ── */
const selectStyles = {
  control: (b) => ({
    ...b,
    minHeight: 38,
    fontSize: ".83rem",
    borderColor: "#e2e8f0",
    borderRadius: 8,
    boxShadow: "none",
    "&:hover": { borderColor: "#93c5fd" },
  }),
  option: (b, { isFocused }) => ({
    ...b,
    fontSize: ".83rem",
    backgroundColor: isFocused ? "#eff6ff" : "white",
    color: "#1e3a8a",
  }),
};

/* ── reusable form primitives ── */
const Field = ({ label, children }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
      {label}
    </label>
    {children}
  </div>
);

const inputCls =
  "w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition";

const Input = (props) => <input {...props} className={inputCls} />;

const SelectNative = ({ children, ...props }) => (
  <select {...props} className={inputCls}>
    {children}
  </select>
);

/* ════════════════════════════════════════════════════════════ */
function Appeals() {
  const [appeals, setAppeals] = useState([]);
  const [appealType, setAppealType] = useState([]);
  const [educationType, setEducationType] = useState([]);
  const [educationForm, setEducationForm] = useState([]);
  const [educationField, setEducationField] = useState([]);
  const [agents, setAgents] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [admin, setAdmin] = useState();
  const [extraData, setExtraData] = useState([]);

  const token = localStorage.getItem("access_token");

  /* modals */
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [ballModalOpen, setBallModalOpen] = useState(false);
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [studyModalOpen, setStudyModalOpen] = useState(false);
  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  /* ball */
  const [selectedAppealId, setSelectedAppealId] = useState(null);
  const [enteredBall, setEnteredBall] = useState("");

  /* agent */
  const [agentSelectValue, setAgentSelectValue] = useState(null);
  const [targetAbuturientId, setTargetAbuturientId] = useState(null);
  const [agentAssignLoading, setAgentAssignLoading] = useState(false);

  /* study */
  const [selectedStudyId, setSelectedStudyId] = useState(null);
  const [selectedStudyValue, setSelectedStudyValue] = useState(null);
  const [selectedStudyDate, setSelectedStudyDate] = useState("");
  const [oldStudyValue, setOldStudyValue] = useState(null);
  const [oldStudyTime, setOldStudyTime] = useState(null);

  /* discount */
  const [discountData, setDiscountData] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);

  /* payment */
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [paymentData, setPaymentData] = useState({ amount: "", file: null });

  /* doc status */
  const [documentStatus, setDocumentStatus] = useState(null);
  const [description, setDescription] = useState("");

  const documentLists = [
    { value: 0, label: "Hujjat topshirilmagan" },
    { value: 1, label: "Hujjat to'liq emas" },
    { value: 2, label: "Hujjat to'liq" },
  ];

  /* edit */
  const [editData, setEditData] = useState({
    id: null,
    passportPin: "",
    passportNumber: "",
    firstName: "",
    lastName: "",
    fatherName: "",
    motherName: "",
    appealTypeId: "",
    educationTypeId: "",
    educationFormId: "",
    educationFieldId: "",
  });

  /* filters */
  const [filters, setFilters] = useState({
    firstName: "",
    lastName: "",
    fatherName: "",
    motherName: "",
    passportNumber: "",
    passportPin: "",
    phone: "",
    appealTypeId: "",
    educationTypeId: "",
    educationFormId: "",
    educationFieldId: "",
    agentId: "",
    createdAt: "",
    isStudy: "",
  });

  /* pagination */
  const [pagination, setPagination] = useState({
    pageNumber: 0,
    totalPages: 1,
    size: 50,
  });

  /* ════ fetch helpers ════ */
  const fetchAppeals = async () => {
    try {
      const q = new URLSearchParams({
        ...filters,
        page: pagination.pageNumber,
        size: pagination.size,
      }).toString();
      const res = await ApiCall(
        `/api/v1/admin/appeals?${q}`,
        "GET",
        null,
        null,
        true,
      );
      setAppeals(res.data.content);
      setPagination((p) => ({ ...p, totalPages: res.data.totalPages }));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAppealType = async () => {
    try {
      const r = await ApiCall(`/api/v1/appeal-type`, "GET", null, null, true);
      setAppealType(r.data || []);
    } catch (e) {
      console.error(e);
    }
  };
  const fetchEducationType = async () => {
    try {
      const r = await ApiCall(
        `/api/v1/education-type`,
        "GET",
        null,
        null,
        true,
      );
      setEducationType(r.data);
    } catch (e) {
      console.error(e);
    }
  };
  const fetchEducationForm = async (id) => {
    try {
      const r = await ApiCall(
        `/api/v1/education-form/${id}`,
        "GET",
        null,
        null,
        true,
      );
      setEducationForm(r.data);
    } catch (e) {
      console.error(e);
    }
  };
  const fetchEducationField = async (id) => {
    try {
      const r = await ApiCall(
        `/api/v1/education-field/${id}`,
        "GET",
        null,
        null,
        true,
      );
      setEducationField(r.data);
    } catch (e) {
      console.error(e);
    }
  };
  const fetchAgents = async () => {
    try {
      const r = await ApiCall("/api/v1/agent", "GET", null, null, true);
      setAgents(r.data);
    } catch (e) {
      console.error(e);
    }
  };
  const fetchAdmin = async () => {
    try {
      const r = await ApiCall(
        `/api/v1/auth/me/${token}`,
        "GET",
        null,
        null,
        true,
      );
      setAdmin(r.data.id || []);
    } catch (e) {
      console.error(e);
    }
  };
  const fetchExtraData = async () => {
    try {
      const r = await ApiCall(
        `/api/v1/abuturient-document`,
        "GET",
        null,
        null,
        true,
      );
      setExtraData(r.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchAppeals();
    fetchAppealType();
    fetchEducationType();
    fetchAgents();
    fetchAdmin();
    fetchExtraData();
  }, []);

  /* ════ filter handlers ════ */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((p) => ({ ...p, [name]: value }));
    if (name === "educationTypeId") fetchEducationForm(value);
    if (name === "educationFormId") fetchEducationField(value);
  };

  const handleResetFilters = () => {
    setFilters({
      firstName: "",
      lastName: "",
      fatherName: "",
      motherName: "",
      passportNumber: "",
      passportPin: "",
      phone: "",
      appealTypeId: "",
      educationTypeId: "",
      educationFormId: "",
      educationFieldId: "",
      agentId: "",
      createdAt: "",
      isStudy: "",
    });
    fetchAppeals();
  };

  /* ════ excel ════ */
  const fetchAppealsExcel = async () => {
    try {
      const q = new URLSearchParams({ ...filters }).toString();
      const res = await fetch(`${baseUrl}/api/v1/admin/appeals/excel?${q}`, {
        method: "GET",
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Appeals.xlsx";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  /* ════ delete ════ */
  const handleDeleteAppeal = async (id) => {
    if (!window.confirm("Rostan ham bu arizani o'chirmoqchimisiz?")) return;
    try {
      await ApiCall(`/api/v1/abuturient/${id}`, "DELETE", null, null, true);
      fetchAppeals();
    } catch {
      alert("Arizani o'chirishda xatolik yuz berdi");
    }
  };

  /* ════ pdf ════ */
  const handleDownloadPDF = async (phone) => {
    try {
      const res = await fetch(
        `${baseUrl}/api/v1/abuturient/contract/${phone}`,
        { method: "GET" },
      );
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Contract_${phone}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  /* ════ file ════ */
  const handleDownloadFile = async (id) => {
    if (!id) {
      alert("Fayl mavjud emas");
      return;
    }
    try {
      const res = await fetch(`${baseUrl}/api/v1/file/getFile/${id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `file_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("Faylni yuklashda xatolik");
    }
  };

  /* ════ edit ════ */
  const handleEditClick = (appeal) => {
    const educationTypeId =
      appeal.educationField?.educationForm?.educationType?.id || "";
    const educationFormId = appeal.educationField?.educationForm?.id || "";
    const educationFieldId = appeal.educationField?.id || "";
    if (educationTypeId) fetchEducationForm(educationTypeId);
    if (educationFormId) fetchEducationField(educationFormId);
    setEditData({
      id: appeal.id,
      passportPin: appeal.passportPin || "",
      passportNumber: appeal.passportNumber || "",
      firstName: appeal.firstName || "",
      lastName: appeal.lastName || "",
      fatherName: appeal.fatherName || "",
      motherName: appeal.motherName || "",
      appealTypeId: appeal.appealType?.id || "",
      educationTypeId,
      educationFormId,
      educationFieldId,
    });
    setDocumentStatus(
      documentLists.find((o) => o.value === appeal.documentStatus) || null,
    );
    const ex = extraData.find(
      (e) =>
        e.abuturient.firstName === appeal.firstName &&
        e.abuturient.lastName === appeal.lastName,
    );
    setDescription(ex?.description || "");
    setEditModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "passportPin") {
      const v = value.replace(/\D/g, "");
      if (v.length <= 14) setEditData((p) => ({ ...p, [name]: v }));
      return;
    }
    if (name === "passportNumber") {
      const up = value.toUpperCase();
      const letters = up.slice(0, 2).replace(/[^A-Z]/g, "");
      const numbers = up.slice(2).replace(/\D/g, "");
      setEditData((p) => ({
        ...p,
        [name]: `${letters}${numbers.slice(0, 7)}`,
      }));
      return;
    }
    setEditData((p) => ({ ...p, [name]: value }));
    if (name === "educationTypeId") fetchEducationForm(value);
    if (name === "educationFormId") fetchEducationField(value);
  };

  const validateInputs = () =>
    editData.passportPin.length === 14 ||
    /^[A-Z]{2}\d{7}$/.test(editData.passportNumber) ||
    editData.firstName.trim() ||
    editData.lastName.trim() ||
    editData.fatherName.trim() ||
    editData.appealTypeId ||
    editData.educationTypeId ||
    editData.educationFormId ||
    editData.educationFieldId;

  const handleSubmitExtraData = async () => {
    if (!documentStatus || !description.trim()) return;
    await ApiCall(
      `/api/v1/abuturient-document`,
      "POST",
      {
        userId: admin,
        abuturientId: editData.id,
        documentStatus: documentStatus.value,
        title: "Hujjat holati",
        description,
      },
      null,
      true,
    );
    setDocumentStatus(null);
    setDescription("");
  };

  const handleEditSubmit = async () => {
    if (!validateInputs()) return;
    try {
      await ApiCall(
        `/api/v1/admin/appeals/${editData.id}/${token}`,
        "PUT",
        editData,
        null,
        true,
      );
      await handleSubmitExtraData();
      setEditModalOpen(false);
      fetchAppeals();
    } catch (e) {
      console.error(e);
    }
  };

  /* ════ ball ════ */
  const handleSubmitBall = async () => {
    const ball = parseFloat(enteredBall);
    if (isNaN(ball) || ball <= 0 || ball >= 189) {
      alert("Ball 0 dan katta va 189 dan kichik bo'lishi kerak");
      return;
    }
    try {
      await ApiCall(
        `/api/v1/admin/appeals/ball/${selectedAppealId}/${ball}/${token}`,
        "PUT",
        null,
        null,
        true,
      );
      setBallModalOpen(false);
      setEnteredBall("");
      fetchAppeals();
    } catch {
      alert("Ball yuborilmadi");
    }
  };

  /* ════ agent ════ */
  const agentSelectOptions = React.useMemo(
    () =>
      agents.map((item) => ({
        value: String(item?.agent?.id ?? item?.id),
        label: item?.agent?.name ?? item?.name,
      })),
    [agents],
  );
  const agentFilterOptions = [
    { value: "", label: "Hammasi" },
    ...agentSelectOptions,
  ];

  const openAgentPicker = (appeal) => {
    setTargetAbuturientId(appeal.id);
    const cid = appeal?.agent?.id ? String(appeal.agent.id) : null;
    setAgentSelectValue(
      cid ? (agentSelectOptions.find((o) => o.value === cid) ?? null) : null,
    );
    setAgentModalOpen(true);
  };

  const assignAgentToAbuturient = async () => {
    if (!targetAbuturientId || !agentSelectValue?.value) {
      alert("Agentni tanlang.");
      return;
    }
    try {
      setAgentAssignLoading(true);
      await ApiCall(
        `/api/v1/abuturient/agent/${targetAbuturientId}/${agentSelectValue.value}`,
        "PUT",
        null,
        null,
        true,
      );
      setAgentModalOpen(false);
      setAgentSelectValue(null);
      setTargetAbuturientId(null);
      fetchAppeals();
    } catch {
      alert("Agent biriktirilmadi.");
    } finally {
      setAgentAssignLoading(false);
    }
  };

  /* ════ study ════ */
  const handleConfirmStudyChange = async () => {
    if (!selectedStudyDate) {
      alert("Sana va vaqtni tanlang!");
      return;
    }
    try {
      await ApiCall(
        `/api/v1/admin/${selectedStudyId}/${selectedStudyValue}`,
        "PUT",
        { isStudyUpdatedAt: selectedStudyDate },
        null,
        true,
      );
      setStudyModalOpen(false);
      setSelectedStudyDate("");
      fetchAppeals();
    } catch {
      alert("Holatni o'zgartirib bo'lmadi!");
    }
  };

  /* ════ discount ════ */
  const fetchDiscountInfo = async (passportPin) => {
    if (!passportPin) {
      alert("Talabaning JSHR topilmadi!");
      return;
    }
    try {
      setDiscountLoading(true);
      const res = await fetch(
        `https://edu.bxu.uz/api/v1/discount-student/${passportPin}`,
      );
      if (!res.ok) throw new Error();
      setDiscountData(await res.json());
      setDiscountModalOpen(true);
    } catch {
      alert("Chegirma ma'lumotlari bazada mavjud emas!");
    } finally {
      setDiscountLoading(false);
    }
  };

  /* ════ payment ════ */
  const handlePaymentSubmit = async () => {
    try {
      let fileId = null;
      if (paymentData.file) {
        const fd = new FormData();
        fd.append("photo", paymentData.file);
        fd.append("prefix", "payment");
        const up = await ApiCall(
          "/api/v1/file/upload",
          "POST",
          fd,
          null,
          true,
          true,
        );
        fileId = up?.data?.id || up?.data;
      }
      const res = await ApiCall(
        "/api/v1/payment-agents",
        "POST",
        {
          userId: selectedAgent?.agentId,
          abuturientId: selectedAgent?.studentId,
          fileId,
          amount: Number(paymentData.amount),
        },
        null,
        true,
      );
      if (!res) alert("❌ Bu talabaga to'lov avval qilingan!");
      else alert("✅ To'lov muvaffaqiyatli qo'shildi!");
      setIsPaymentModalOpen(false);
      setPaymentData({ amount: "", file: null });
    } catch {
      alert("❌ To'lovni saqlashda xatolik!");
    }
  };

  /* ════ pagination ════ */
  const handlePageChange = async (page) => {
    if (page < 0 || page >= pagination.totalPages) return;
    setPagination((p) => ({ ...p, pageNumber: page }));
    await fetchAppeals();
  };

  const renderPagination = () => {
    const { pageNumber: cur, totalPages: total } = pagination;
    const items = [];
    const addBtn = (i) =>
      items.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`min-w-[36px] h-9 rounded-lg text-sm font-bold border transition
          ${
            cur === i
              ? "bg-blue-600 text-white border-blue-600"
              : "bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600"
          }`}
        >
          {i + 1}
        </button>,
      );
    addBtn(0);
    if (cur > 2)
      items.push(
        <span key="e1" className="text-slate-400 font-bold px-1">
          …
        </span>,
      );
    for (let i = Math.max(1, cur - 1); i <= Math.min(total - 2, cur + 1); i++)
      addBtn(i);
    if (cur < total - 3)
      items.push(
        <span key="e2" className="text-slate-400 font-bold px-1">
          …
        </span>,
      );
    if (total > 1) addBtn(total - 1);
    return items;
  };

  /* ══════════════════════════ RENDER ══════════════════════════ */
  return (
    <div className="bg-slate-100 min-h-screen">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 z-40">
        <Sidebar />
      </div>

      {/* Content */}
      <div className="ml-64 p-6">
        {/* ── heading ── */}
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Kelib tushgan <span className="text-blue-600">arizalar</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Barcha arizalarni ko'ring, filtrlang va boshqaring
          </p>
        </div>

        {/* ── filter card ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-5">
          {showFilter && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-100">
              {[
                { label: "FIO", name: "firstName" },
                { label: "Passport raqami", name: "passportNumber" },
                { label: "JSHR", name: "passportPin" },
                { label: "Telefon", name: "phone" },
              ].map(({ label, name }) => (
                <Field key={name} label={label}>
                  <Input
                    type="text"
                    name={name}
                    value={filters[name]}
                    onChange={handleFilterChange}
                  />
                </Field>
              ))}

              <Field label="Ariza turi">
                <SelectNative
                  name="appealTypeId"
                  value={filters.appealTypeId}
                  onChange={handleFilterChange}
                >
                  <option value="">Hammasi</option>
                  {appealType.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </SelectNative>
              </Field>

              <Field label="Ta'lim turi">
                <SelectNative
                  name="educationTypeId"
                  value={filters.educationTypeId}
                  onChange={handleFilterChange}
                >
                  <option value="">Hammasi</option>
                  {educationType.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </SelectNative>
              </Field>

              <Field label="Ta'lim shakli">
                <SelectNative
                  name="educationFormId"
                  value={filters.educationFormId}
                  onChange={handleFilterChange}
                >
                  <option value="">Hammasi</option>
                  {educationForm.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </SelectNative>
              </Field>

              <Field label="Yo'nalish">
                <SelectNative
                  name="educationFieldId"
                  value={filters.educationFieldId}
                  onChange={handleFilterChange}
                >
                  <option value="">Hammasi</option>
                  {educationField.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </SelectNative>
              </Field>

              <Field label="Agent">
                <Select
                  options={agentFilterOptions}
                  value={
                    agentFilterOptions.find(
                      (o) => o.value === String(filters.agentId),
                    ) || null
                  }
                  onChange={(opt) =>
                    setFilters((p) => ({ ...p, agentId: opt?.value || "" }))
                  }
                  isClearable
                  isSearchable
                  placeholder="Tanlang..."
                  styles={selectStyles}
                />
              </Field>

              <Field label="Sana">
                <Input
                  type="date"
                  name="createdAt"
                  value={filters.createdAt}
                  onChange={handleFilterChange}
                />
              </Field>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={fetchAppeals}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition active:scale-95"
            >
              Filtrlash
            </button>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition active:scale-95"
            >
              Tozalash
            </button>
            <button
              onClick={fetchAppealsExcel}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition active:scale-95"
            >
              <IconExcel /> Excel
            </button>
            <button
              onClick={() => setShowFilter((f) => !f)}
              className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition ml-auto active:scale-95"
            >
              {showFilter ? (
                <>
                  <IconChevronUp /> Yopish
                </>
              ) : (
                <>
                  <IconChevronDown /> Filter
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── table ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b-2 border-slate-100 bg-slate-50">
                {[
                  "#",
                  "FIO",
                  "Operator",
                  "Birikkan vaqt",
                  "Passport / Hujjat",
                  "Telefon",
                  "Ta'lim turi",
                  "Ta'lim shakli",
                  "Yo'nalish",
                  "Agent",
                  "Sana",
                  "Status",
                  "Ball",
                  "O'qish",
                  "To'lov",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-3 text-left text-[10px] font-extrabold uppercase tracking-widest text-slate-400 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {appeals.map((appeal, idx) => (
                <tr
                  key={appeal.id ?? idx}
                  className="hover:bg-blue-50/40 transition"
                >
                  <td className="px-3 py-2.5 text-slate-400 font-semibold text-xs">
                    {idx + 1}
                  </td>

                  <td className="px-3 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                    {appeal.lastName} {appeal.firstName} {appeal.fatherName}
                  </td>

                  <td className="px-3 py-2.5">
                    <span
                      className="text-blue-600 font-semibold cursor-pointer hover:underline"
                      onClick={() =>
                        handleDownloadFile(appeal?.operatorChek?.id)
                      }
                    >
                      {appeal?.operator?.name || (
                        <span className="text-slate-300 font-normal">Yo'q</span>
                      )}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                    {fmtDate(appeal?.operatorCreatedAt)}
                  </td>

                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-slate-700 text-xs">
                      {appeal.passportPin} {appeal.passportNumber}
                    </div>
                    <div className="mt-1">
                      <DocBadge status={appeal.documentStatus} />
                    </div>
                  </td>

                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-700">
                    {appeal.phone?.trim()}
                  </td>

                  <td className="px-3 py-2.5 text-slate-600 text-xs">
                    {appeal.educationField?.educationForm?.educationType?.name}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs">
                    {appeal.educationField?.educationForm?.name}
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 text-xs">
                    {appeal.educationField?.name}
                  </td>

                  <td className="px-3 py-2.5">
                    <span
                      onClick={() => openAgentPicker(appeal)}
                      className="text-blue-600 font-semibold cursor-pointer underline decoration-dotted hover:decoration-solid text-xs"
                    >
                      {appeal.agent?.name || "BXU"}
                    </span>
                  </td>

                  <td className="px-3 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(appeal.createdAt).toLocaleString()}
                  </td>

                  <td className="px-3 py-2.5">
                    <span className="inline-block bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                      {statusLabel(appeal.status)}
                    </span>
                  </td>

                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => {
                        setSelectedAppealId(appeal.id);
                        setBallModalOpen(true);
                      }}
                      className="bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-700 border border-blue-200 rounded-lg px-3 py-1 text-xs font-bold transition"
                    >
                      {appeal.ball || "0.0"}
                    </button>
                  </td>

                  <td className="px-3 py-2.5">
                    <select
                      value={appeal.isStudy ?? 1}
                      onChange={(e) => {
                        setSelectedStudyId(appeal.id);
                        setSelectedStudyValue(Number(e.target.value));
                        setOldStudyValue(appeal.isStudy);
                        setOldStudyTime(appeal.isStudyUpdatedAt);
                        setStudyModalOpen(true);
                      }}
                      className="border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                    >
                      <option value={1}>O'qiydi</option>
                      <option value={0}>O'qimaydi</option>
                    </select>
                    {appeal.isStudyUpdatedAt && (
                      <div className="text-[10px] text-slate-400 mt-1">
                        {new Date(appeal.isStudyUpdatedAt).toLocaleString()}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2.5">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => fetchDiscountInfo(appeal.passportPin)}
                        className="text-[11px] font-bold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition whitespace-nowrap"
                      >
                        Chegirma
                      </button>
                      {appeal.isPayed ? (
                        <span className="text-[11px] font-bold text-emerald-600">
                          {appeal.amount}
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedAgent({
                              agentId: appeal.agent?.id || null,
                              studentId: appeal.studentId || appeal.id,
                            });
                            setIsPaymentModalOpen(true);
                          }}
                          className="text-[11px] font-bold px-2 py-1 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition whitespace-nowrap"
                        >
                          💵 To'lov
                        </button>
                      )}
                    </div>
                  </td>

                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditClick(appeal)}
                        title="Tahrirlash"
                        className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={() => handleDownloadPDF(appeal.phone)}
                        title="PDF"
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white transition"
                      >
                        <IconPdf />
                      </button>
                      <button
                        onClick={() => handleDeleteAppeal(appeal.id)}
                        title="O'chirish"
                        className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {appeals.length === 0 && (
                <tr>
                  <td
                    colSpan={16}
                    className="text-center py-16 text-slate-300 text-sm font-semibold"
                  >
                    Hech qanday ariza topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── pagination ── */}
        <div className="flex justify-center items-center gap-1.5 mt-6 flex-wrap">
          <button
            onClick={() => handlePageChange(pagination.pageNumber - 1)}
            disabled={pagination.pageNumber === 0}
            className="min-w-[36px] h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconPrev />
          </button>
          {renderPagination()}
          <button
            onClick={() => handlePageChange(pagination.pageNumber + 1)}
            disabled={pagination.pageNumber >= pagination.totalPages - 1}
            className="min-w-[36px] h-9 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <IconNext />
          </button>
        </div>

        {/* ══════════ MODALS ══════════ */}

        {/* Payment */}
        <Modal
          open={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          center
        >
          <div className="p-7 w-[400px] max-w-full">
            <h2 className="text-lg font-extrabold text-slate-800 mb-5">
              💵 To'lov qo'shish
            </h2>
            <div className="flex flex-col gap-4">
              <Field label="Summa (so'm)">
                <Input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) =>
                    setPaymentData((p) => ({ ...p, amount: e.target.value }))
                  }
                  placeholder="1 500 000"
                />
              </Field>
              <Field label="Chek (rasm / PDF)">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                    setPaymentData((p) => ({ ...p, file: e.target.files[0] }))
                  }
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-700 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                />
              </Field>
              <button
                onClick={handlePaymentSubmit}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition active:scale-95"
              >
                Saqlash
              </button>
            </div>
          </div>
        </Modal>

        {/* Agent */}
        <Modal
          open={agentModalOpen}
          onClose={() => setAgentModalOpen(false)}
          center
        >
          <div className="p-7 w-[380px] max-w-full">
            <h2 className="text-lg font-extrabold text-slate-800 mb-5">
              👤 Agent tanlash
            </h2>
            <div className="flex flex-col gap-4">
              <Field label="Agent">
                <Select
                  options={agentSelectOptions}
                  value={agentSelectValue}
                  onChange={setAgentSelectValue}
                  isSearchable
                  placeholder="Qidiring..."
                  styles={selectStyles}
                />
              </Field>
              <div className="flex gap-2">
                <button
                  onClick={assignAgentToAbuturient}
                  disabled={agentAssignLoading || !agentSelectValue?.value}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition active:scale-95"
                >
                  {agentAssignLoading ? "Yuborilmoqda…" : "Qabul qilish"}
                </button>
                <button
                  onClick={() => setAgentModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition"
                >
                  Bekor
                </button>
              </div>
            </div>
          </div>
        </Modal>

        {/* Discount */}
        <Modal
          open={discountModalOpen}
          onClose={() => setDiscountModalOpen(false)}
          center
        >
          <div className="p-7 w-[420px] max-w-full">
            <h2 className="text-lg font-extrabold text-slate-800 mb-4">
              🎓 Chegirma ma'lumotlari
            </h2>
            {discountLoading ? (
              <p className="text-slate-400 text-center py-10">Yuklanmoqda…</p>
            ) : discountData ? (
              <div>
                <div className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden mb-4">
                  {[
                    ["FIO", discountData.name],
                    ["JSHR", discountData.passport_pin],
                    ["Asos", discountData.asos || "—"],
                    [
                      "Status",
                      discountData.status === 1
                        ? "✅ Tasdiqlangan"
                        : "❌ Tasdiqlanmagan",
                    ],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      className="flex justify-between items-center px-4 py-2.5 bg-slate-50 text-sm"
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {k}
                      </span>
                      <span className="font-semibold text-slate-700 text-right">
                        {v}
                      </span>
                    </div>
                  ))}
                </div>

                {discountData.discountByYear?.length > 0 && (
                  <div className="flex flex-col gap-2 mb-4">
                    {discountData.discountByYear.map((item) => (
                      <div
                        key={item.id}
                        className="bg-blue-50 border border-blue-100 rounded-xl p-3"
                      >
                        <div className="font-bold text-blue-700 text-sm">
                          {item.name}
                        </div>
                        <div className="text-sm text-slate-700 mt-0.5">
                          Chegirma:{" "}
                          <strong>
                            {item.discount?.toLocaleString()} so'm
                          </strong>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          {new Date(item.createAt).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setDiscountModalOpen(false)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition"
                >
                  Yopish
                </button>
              </div>
            ) : (
              <p className="text-slate-400 text-center py-10">
                Ma'lumot topilmadi.
              </p>
            )}
          </div>
        </Modal>

        {/* Edit */}
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          center
          animationDuration={300}
        >
          <div className="p-7 w-[700px] max-w-full">
            <h2 className="text-lg font-extrabold text-slate-800 mb-5">
              ✏️ Tahrirlash
            </h2>
            <div className="grid grid-cols-2 gap-6">
              {/* left */}
              <div className="flex flex-col gap-3">
                {[
                  ["Familiya", "lastName"],
                  ["Ism", "firstName"],
                  ["Otasining ismi", "fatherName"],
                  ["Onasining ismi", "motherName"],
                ].map(([label, name]) => (
                  <Field key={name} label={label}>
                    <Input
                      type="text"
                      name={name}
                      value={editData[name] || ""}
                      onChange={handleInputChange}
                    />
                  </Field>
                ))}
                <Field label="Ariza turi">
                  <SelectNative
                    name="appealTypeId"
                    value={editData.appealTypeId || ""}
                    onChange={handleInputChange}
                  >
                    <option value="">Tanlang</option>
                    {appealType.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </SelectNative>
                </Field>
                <Field label="Ta'lim turi">
                  <SelectNative
                    name="educationTypeId"
                    value={editData.educationTypeId || ""}
                    onChange={(e) => {
                      handleInputChange(e);
                      fetchEducationForm(e.target.value);
                    }}
                  >
                    <option value="">Tanlang</option>
                    {educationType.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </SelectNative>
                </Field>
                <Field label="Ta'lim shakli">
                  <SelectNative
                    name="educationFormId"
                    value={editData.educationFormId || ""}
                    onChange={(e) => {
                      handleInputChange(e);
                      fetchEducationField(e.target.value);
                    }}
                  >
                    <option value="">Tanlang</option>
                    {educationForm.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </SelectNative>
                </Field>
                <Field label="Yo'nalish">
                  <SelectNative
                    name="educationFieldId"
                    value={editData.educationFieldId || ""}
                    onChange={handleInputChange}
                  >
                    <option value="">Tanlang</option>
                    {educationField.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </SelectNative>
                </Field>
              </div>

              {/* right */}
              <div className="flex flex-col gap-3">
                <Field label="JSHR (14 raqam)">
                  <Input
                    type="text"
                    name="passportPin"
                    value={editData.passportPin || ""}
                    onChange={handleInputChange}
                    placeholder="00000000000000"
                  />
                </Field>
                <Field label="Passport raqami">
                  <Input
                    type="text"
                    name="passportNumber"
                    value={editData.passportNumber || ""}
                    onChange={handleInputChange}
                    placeholder="AB1234567"
                  />
                </Field>
                <Field label="Hujjat holati">
                  <Select
                    options={documentLists}
                    value={documentStatus}
                    onChange={setDocumentStatus}
                    placeholder="Tanlang"
                    isSearchable
                    styles={selectStyles}
                  />
                </Field>
                <Field label="Batafsil izoh">
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition resize-none"
                  />
                </Field>
              </div>
            </div>

            <button
              onClick={handleEditSubmit}
              disabled={!validateInputs()}
              className="w-full mt-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition active:scale-95"
            >
              Saqlash
            </button>
          </div>
        </Modal>

        {/* Ball */}
        <Modal
          open={ballModalOpen}
          onClose={() => setBallModalOpen(false)}
          center
        >
          <div className="p-7 w-[360px] max-w-full">
            <h2 className="text-lg font-extrabold text-slate-800 mb-5">
              🎯 Ball kiritish
            </h2>
            <div className="flex flex-col gap-4">
              <Field label="Ball (0 – 189)">
                <Input
                  type="number"
                  value={enteredBall}
                  onChange={(e) => setEnteredBall(e.target.value)}
                  placeholder="Masalan: 145.5"
                />
              </Field>
              <button
                onClick={handleSubmitBall}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition active:scale-95"
              >
                Saqlash
              </button>
            </div>
          </div>
        </Modal>

        {/* Study */}
        <Modal
          open={studyModalOpen}
          onClose={() => setStudyModalOpen(false)}
          center
        >
          <div className="p-7 w-[380px] max-w-full">
            <h2 className="text-lg font-extrabold text-slate-800 mb-5">
              📅 O'qish holatini o'zgartirish
            </h2>
            <div className="flex flex-col gap-4">
              {(oldStudyValue !== null || oldStudyTime) && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm">
                  <div className="font-semibold text-slate-700">
                    <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
                      Joriy holat:
                    </span>
                    {oldStudyValue === 1 ? "O'qiydi" : "O'qimaydi"}
                  </div>
                  {oldStudyTime && (
                    <div className="text-xs text-slate-400 mt-1">
                      Oxirgi yangilanish:{" "}
                      {new Date(oldStudyTime).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
              <Field label="Yangi sana va vaqt">
                <Input
                  type="datetime-local"
                  value={selectedStudyDate}
                  onChange={(e) => setSelectedStudyDate(e.target.value)}
                />
              </Field>
              <button
                onClick={handleConfirmStudyChange}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition active:scale-95"
              >
                Tasdiqlash
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default Appeals;

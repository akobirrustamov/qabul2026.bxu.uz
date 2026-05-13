import React, { useEffect, useState, useCallback, useRef } from "react";
import ApiCall, { baseUrl } from "../../config/index";
import Select from "react-select";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dt) {
  if (!dt) return "-";
  return new Date(dt).toLocaleString("ru-RU");
}

function Field({ label, children }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-medium text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, disabled, type = "text" }) {
  return (
    <input
      type={type}
      value={value || ""}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-800 placeholder-gray-300 focus:border-blue-400 focus:outline-none disabled:bg-gray-50 disabled:text-gray-400"
    />
  );
}

// ─── LeadModal ────────────────────────────────────────────────────────────────

export default function LeadModal({
  show,
  onClose,
  lead,
  userId,
  onSaved,
  locked = false,
  commentsFromSocket,
}) {
  // ─── CRM state ───────────────────────────────────────────────────────────
  const [allCategories, setAllCategories] = useState([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [selectedCatId, setSelectedCatId] = useState("");
  const [allSubCategories, setAllSubCategories] = useState([]);
  const [loadingSubCats, setLoadingSubCats] = useState(false);
  const [selectedSubCatId, setSelectedSubCatId] = useState("");
  const [playingId, setPlayingId] = useState(null);
  const [audioMap, setAudioMap] = useState({});
  const [loadingAudioId, setLoadingAudioId] = useState(null);
  // ─── Abuturient edit state ────────────────────────────────────────────────
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    fatherName: "",
    phone: "",
    passportNumber: "",
    passportPin: "",
  });
  const [initialValues, setInitialValues] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // ─── Yo'nalish state ──────────────────────────────────────────────────────
  const [appealType, setAppealType] = useState([]);
  const [educationType, setEducationType] = useState([]);
  const [educationForm, setEducationForm] = useState([]);
  const [educationField, setEducationField] = useState([]);
  const [selectedAppealType, setSelectedAppealType] = useState(null);
  const [selectedEduType, setSelectedEduType] = useState(null);
  const [selectedEduForm, setSelectedEduForm] = useState(null);
  const [selectedEduField, setSelectedEduField] = useState(null);

  useEffect(() => {
    if (commentsFromSocket && commentsFromSocket.length > 0) {
      setComments(commentsFromSocket);
    }
  }, [commentsFromSocket]);

  // Yo'nalish uchun initial qiymatlar (o'zgarish tekshirish)
  const [initialDirection, setInitialDirection] = useState({
    appealType: null,
    eduType: null,
    eduForm: null,
    eduField: null,
  });

  // ─── Region/District state ────────────────────────────────────────────────
  const [regions, setRegions] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);

  // Region/District initial qiymatlar
  const [initialRegion, setInitialRegion] = useState(null);
  const [initialDistrict, setInitialDistrict] = useState(null);

  // ─── Comments ─────────────────────────────────────────────────────────────
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);

  // ─── Save state ───────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [savingInfo, setSavingInfo] = useState(false);
  const [saveError, setSaveError] = useState("");

  // ─── Applicant detail ─────────────────────────────────────────────────────
  const [applicant, setApplicant] = useState(null);
  const [loadingApplicant, setLoadingApplicant] = useState(false);
  const commentsEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const userRef = useRef(null);

  // ─── Reminder state ───────────────────────────────────────────────────────
  const [showReminderPanel, setShowReminderPanel] = useState(false);
  const [reminderTime, setReminderTime] = useState("");
  const [reminderDescription, setReminderDescription] = useState("");
  const [reminderOperator, setReminderOperator] = useState(null);
  const [savingReminder, setSavingReminder] = useState(false);
  const reminderPanelRef = useRef(null);

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  useEffect(() => {
    ApiCall("/api/v1/auth/decode", "GET")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  // Close reminder panel on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        reminderPanelRef.current &&
        !reminderPanelRef.current.contains(e.target)
      ) {
        setShowReminderPanel(false);
      }
    };
    if (showReminderPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showReminderPanel]);

  // ─── Init on open ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!show || !lead) return;
    setSelectedCatId(lead.crmSubCategory?.crmCategory?.id || "");
    setSelectedSubCatId(lead.crmSubCategory?.id || "");
    setCommentText("");
    setSaveError("");
    setShowReminderPanel(false);
    setReminderTime("");
    setReminderDescription("");
    // Reminder operator — joriy operator pre-fill
    if (lead.operator) {
      setReminderOperator({
        value: lead.operator.id,
        label: lead.operator.username || lead.operator.name || lead.operator.id,
      });
    } else {
      setReminderOperator(null);
    }
    fetchCategories();
    fetchSubCategories(lead.crmSubCategory?.crmCategory?.id);
    if (lead.applicant?.id) fetchApplicant(lead.applicant.id);
    else setApplicant(null);
    fetchComments(lead.id);
    fetchAppealTypes();
    fetchEducationTypes();
    fetchRegions();
  }, [show, lead]);

  // Applicant yuklandi — formni to'ldirish
  useEffect(() => {
    handleSetUser();
    if (!applicant) return;

    const initial = {
      firstName: applicant.firstName || "",
      lastName: applicant.lastName || "",
      fatherName: applicant.fatherName || "",
      phone: applicant.phone || lead?.phone || "",
      passportNumber: applicant.passportNumber || "",
      passportPin: applicant.passportPin || "",
    };
    setInitialValues(initial);
    setEditForm(initial);

    // Yo'nalish
    let initAppeal = null;
    let initEduType = null;
    let initEduForm = null;
    let initEduField = null;

    if (applicant.educationField) {
      const form = applicant.educationField?.educationForm;
      const type = form?.educationType;
      if (type) {
        initEduType = { value: type.id, label: type.name };
        setSelectedEduType(initEduType);
        fetchEducationForms(type.id);
      }
      if (form) {
        initEduForm = { value: form.id, label: form.name };
        setSelectedEduForm(initEduForm);
        fetchEducationFields(form.id);
      }
      initEduField = {
        value: applicant.educationField.id,
        label: applicant.educationField.name,
      };
      setSelectedEduField(initEduField);
    }
    if (applicant.appealType) {
      initAppeal = {
        value: applicant.appealType.id,
        label: applicant.appealType.name,
      };
      setSelectedAppealType(initAppeal);
    }

    setInitialDirection({
      appealType: initAppeal,
      eduType: initEduType,
      eduForm: initEduForm,
      eduField: initEduField,
    });

    // Region / District
    let initRegion = null;
    let initDistrict = null;
    if (applicant.district) {
      const region = applicant.district.region;
      if (region) {
        initRegion = { value: region.id, label: region.name };
        setSelectedRegion(initRegion);
        fetchRegionDistricts(region.id);
      }
      initDistrict = {
        value: applicant.district.id,
        label: applicant.district.name,
      };
      setSelectedDistrict(initDistrict);
    }
    setInitialRegion(initRegion);
    setInitialDistrict(initDistrict);
  }, [applicant]);

  const [operators, setOperators] = useState([]);
  const [selectedOperator, setSelectedOperator] = useState(null);
  const [savingOperator, setSavingOperator] = useState(false);

  useEffect(() => {
    getOperators();
  }, []);

  // Init selected operator from lead
  useEffect(() => {
    if (!show || !lead) return;
    if (lead.operator) {
      setSelectedOperator({
        value: lead.operator.id,
        label: lead.operator.username || lead.operator.name || lead.operator.id,
      });
    } else {
      setSelectedOperator(null);
    }
  }, [show, lead]);

  const getOperators = async () => {
    await ApiCall("/api/v1/operator", "GET")
      .then((res) => {
        if (res?.data && Array.isArray(res.data)) {
          setOperators(res.data);
        }
      })
      .catch(() => toast.error("Operatorlarni yuklashda xatolik"));
  };

  const handleSetOperator = async (option) => {
    if (!lead || !option) return;
    setSavingOperator(true);
    try {
      const decodeRes = await ApiCall("/api/v1/auth/decode", "GET");
      const currentUserId = decodeRes?.data?.id;
      await ApiCall(
        `/api/v1/crm/leads/${lead.id}/operator/${option.value}/${currentUserId}`,
        "PUT",
      );
      setSelectedOperator(option);

      await fetchComments(lead.id);
      toast.success("Operator muvaffaqiyatli belgilandi!");
    } catch (e) {
      toast.error("Operatorni belgilashda xatolik yuz berdi");
    } finally {
      setSavingOperator(false);
    }
  };
  // Shaxsiy ma'lumotlar o'zgarishini kuzatish
  useEffect(() => {
    const isChanged = Object.keys(editForm).some(
      (key) => editForm[key] !== (initialValues[key] || ""),
    );
    // Region / District o'zgarishini ham hisobga olish
    const regionChanged =
      (selectedRegion?.value || null) !== (initialRegion?.value || null);
    const districtChanged =
      (selectedDistrict?.value || null) !== (initialDistrict?.value || null);
    setHasChanges(isChanged || regionChanged || districtChanged);
  }, [
    editForm,
    initialValues,
    selectedRegion,
    selectedDistrict,
    initialRegion,
    initialDistrict,
  ]);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (show) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [show, onClose]);

  // ─── Yo'nalish o'zgarishini tekshirish ───────────────────────────────────
  const hasDirectionChanges = () => {
    return (
      (selectedAppealType?.value || null) !==
        (initialDirection.appealType?.value || null) ||
      (selectedEduType?.value || null) !==
        (initialDirection.eduType?.value || null) ||
      (selectedEduForm?.value || null) !==
        (initialDirection.eduForm?.value || null) ||
      (selectedEduField?.value || null) !==
        (initialDirection.eduField?.value || null)
    );
  };

  // ─── CRM Lead o'zgarishini tekshirish ────────────────────────────────────
  const hasSubCatChanged =
    selectedSubCatId !== (lead?.crmSubCategory?.id || "");

  // ─── Fetches ──────────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCats(true);
      const res = await ApiCall("/api/v1/crm/categories", "GET");
      setAllCategories(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCats(false);
    }
  }, []);

  const fetchSubCategories = useCallback(async (categoryId) => {
    try {
      setLoadingSubCats(true);
      setAllSubCategories([]);
      const url = categoryId
        ? `/api/v1/crm/sub-categories/by-category/${categoryId}`
        : "/api/v1/crm/sub-categories";
      const res = await ApiCall(url, "GET");
      setAllSubCategories(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSubCats(false);
    }
  }, []);

  const fetchApplicant = useCallback(async (applicantId) => {
    try {
      setLoadingApplicant(true);
      const res = await ApiCall(`/api/v1/abuturient/app/${applicantId}`, "GET");
      setApplicant(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingApplicant(false);
    }
  }, []);

  const fetchComments = useCallback(async (leadId) => {
    try {
      setLoadingComments(true);
      const res = await ApiCall(`/api/v1/crm/leads/${leadId}/comments`, "GET");
      console.log(res.data);

      setComments(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const fetchAppealTypes = useCallback(async () => {
    try {
      const res = await ApiCall("/api/v1/appeal-type", "GET", null, null, true);
      setAppealType(res.data.map((t) => ({ value: t.id, label: t.name })));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchEducationTypes = useCallback(async () => {
    try {
      const res = await ApiCall(
        "/api/v1/education-type",
        "GET",
        null,
        null,
        true,
      );
      setEducationType(res.data.map((t) => ({ value: t.id, label: t.name })));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchEducationForms = useCallback(async (typeId) => {
    try {
      const res = await ApiCall(
        `/api/v1/education-form/active/${typeId}`,
        "GET",
        null,
        null,
        true,
      );
      setEducationForm(res.data.map((f) => ({ value: f.id, label: f.name })));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchEducationFields = useCallback(async (formId) => {
    try {
      const res = await ApiCall(
        `/api/v1/education-field/${formId}`,
        "GET",
        null,
        null,
        true,
      );
      setEducationField(
        res.data
          .filter((f) => f.isActive)
          .map((f) => ({ value: f.id, label: f.name })),
      );
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchRegions = useCallback(async () => {
    try {
      const res = await ApiCall("/api/v1/region", "GET", null, null);
      setRegions(res.data.map((r) => ({ value: r.id, label: r.name })));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const fetchRegionDistricts = useCallback(async (regionId) => {
    setLoadingDistricts(true);
    try {
      const res = await ApiCall(
        `/api/v1/district/${regionId}`,
        "GET",
        null,
        null,
      );
      setDistricts(res.data.map((d) => ({ value: d.id, label: d.name })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDistricts(false);
    }
  }, []);

  const handleCategoryChange = (catId) => {
    setSelectedCatId(catId);
    setSelectedSubCatId("");
    fetchSubCategories(catId);
  };

  // ─── Shaxsiy ma'lumotlarni saqlash ───────────────────────────────────────
  const handleSaveInfo = async () => {
    if (!hasChanges) {
      toast.info("O'zgarish mavjud emas");
      return;
    }
    try {
      setSavingInfo(true);
      await ApiCall(
        "/api/v1/abuturient/user-info/edit",
        "PUT",
        {
          ...editForm,
          regionId: selectedRegion?.value || null,
          districtId: selectedDistrict?.value || null,
        },
        null,
        true,
      );
      // Saqlangan qiymatlarni initial sifatida yangilash
      setInitialValues({ ...editForm });
      setInitialRegion(selectedRegion);
      setInitialDistrict(selectedDistrict);
      toast.success("Ma'lumotlar muvaffaqiyatli saqlandi!");
    } catch (e) {
      setSaveError("Ma'lumotlarni saqlashda xatolik");
      toast.error("Ma'lumotlarni saqlashda xatolik yuz berdi");
    } finally {
      setSavingInfo(false);
    }
  };

  // ─── Yo'nalishni saqlash ──────────────────────────────────────────────────
  const handleSaveDirection = async () => {
    if (!hasDirectionChanges()) {
      toast.info("Yo'nalishda o'zgarish mavjud emas");
      return;
    }
    if (
      !selectedAppealType ||
      !selectedEduType ||
      !selectedEduForm ||
      !selectedEduField
    ) {
      toast.warning("Barcha yo'nalish maydonlarini to'ldiring!");
      setSaveError("Barcha yo'nalish maydonlarini to'ldiring!");
      return;
    }
    setSavingInfo(true);
    setSaveError("");
    try {
      await ApiCall(
        "/api/v1/abuturient/data-form",
        "PUT",
        {
          phone: editForm.phone,
          appealTypeId: selectedAppealType.value,
          educationTypeId: selectedEduType.value,
          educationFormId: selectedEduForm.value,
          educationFieldId: selectedEduField.value,
        },
        null,
        true,
      );

      // Saqlangandan keyin initial yo'nalishni yangilash
      setInitialDirection({
        appealType: selectedAppealType,
        eduType: selectedEduType,
        eduForm: selectedEduForm,
        eduField: selectedEduField,
      });

      toast.success("Yo'nalish muvaffaqiyatli saqlandi!");

      if (onSaved && lead) {
        const updatedLead = await ApiCall(
          `/api/v1/crm/leads/${lead.id}`,
          "GET",
        );
        onSaved(updatedLead.data);
      }

      if (lead?.applicant?.id) {
        await fetchApplicant(lead.applicant.id);
      }
    } catch (e) {
      setSaveError("Yo'nalishni saqlashda xatolik.");
      toast.error("Yo'nalishni saqlashda xatolik yuz berdi");
    } finally {
      setSavingInfo(false);
    }
  };

  // ─── CRM lead saqlash ─────────────────────────────────────────────────────
  const handleSaveLead = async () => {
    if (!lead) return;
    if (!hasSubCatChanged) {
      toast.info("Kategoriyada o'zgarish mavjud emas");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      const res = await ApiCall(
        `/api/v1/crm/leads/${lead.id}/${userId}`,
        "PUT",
        {
          crmSubCategoryId: selectedSubCatId || lead.crmSubCategory?.id,
          status: lead.status != null ? (lead.status ? 1 : 0) : 1,
        },
      );
      toast.success("Kategoriya muvaffaqiyatli saqlandi!");
      if (onSaved) {
        onSaved(res.data);
      }
    } catch (e) {
      setSaveError("Saqlashda xatolik yuz berdi.");
      toast.error("Kategoriyani saqlashda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  const handleSetUser = async () => {
    try {
      const decodeRes = await ApiCall("/api/v1/auth/decode", "GET");
      setReminderOperator({
        value: decodeRes?.data?.id,
        label:
          decodeRes?.data?.username ||
          decodeRes?.data?.name ||
          decodeRes?.data?.id,
      });
    } catch (e) {
      toast.error("Foydalanuvchi saqlashda xatolik yuz berdi");
    } finally {
      setSavingReminder(false);
    }
  };

  // ─── Reminder saqlash ─────────────────────────────────────────────────────
  const handleSaveReminder = async () => {
    if (!reminderTime) {
      toast.warning("Iltimos, eslatma sanasini tanlang!");
      return;
    }
    if (!reminderOperator) {
      toast.warning("Iltimos, mas'ul operatorni tanlang!");
      return;
    }
    if (!reminderDescription.trim()) {
      toast.warning("Iltimos, eslatma matnini yozing!");
      return;
    }
    setSavingReminder(true);
    try {
      // 1. Lead ga reminderTime va reminderDescription saqlash
      await ApiCall(`/api/v1/crm/leads/${lead.id}/${userId}`, "PUT", {
        crmSubCategoryId: lead.crmSubCategory?.id,
        status: lead.status != null ? (lead.status ? 1 : 0) : 1,
        reminderTime: reminderTime,
        reminderDescription: reminderDescription.trim(),
      });

      // 2. Kim biriktirgani va kimga topshirilganligi haqida comment
      const decodeRes = await ApiCall("/api/v1/auth/decode", "GET");
      const currentUser = decodeRes?.data;
      setReminderOperator({
        value: decodeRes?.data?.id,
        label: decodeRes?.data?.name || decodeRes?.data?.id,
      });
      const dt = new Date(reminderTime);
      const formattedDt = dt.toLocaleString("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      const commentDesc =
        `⏰ Eslatma: ${currentUser?.name || "Noma'lum"} tomonidan ` +
        `${formattedDt} sanaga eslatma qo'ydi | ` +
        `Mas'ul: ${currentUser?.name} | ` +
        `Izoh: ${reminderDescription.trim()}`;

      await ApiCall(`/api/v1/crm/leads/${lead.id}/comments`, "POST", {
        description: commentDesc,
        commenterId: userId,
      });

      await fetchComments(lead.id);
      toast.success("Eslatma muvaffaqiyatli saqlandi!");
      setShowReminderPanel(false);
      setReminderTime("");
      setReminderDescription("");
    } catch (e) {
      toast.error("Eslatmani saqlashda xatolik yuz berdi");
    } finally {
      setSavingReminder(false);
    }
  };

  function getHistoryMeta(status) {
    switch (status) {
      case 1:
        return {
          label: "Lead o'zgartirildi",
          bg: "bg-blue-100",
          text: "text-blue-600",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7h8M8 12h8M8 17h5M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
              />
            </svg>
          ),
        };
      case 2:
        return {
          label: "Izoh yozildi",
          bg: "bg-emerald-100",
          text: "text-emerald-600",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.862 4.487a2.1 2.1 0 113.03 2.908L9 18l-4 1 1-4 10.862-10.513z"
              />
            </svg>
          ),
        };
      case 3:
        return {
          label: "Telefon",
          bg: "bg-amber-100",
          text: "text-amber-600",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M22 16.92v3a2 2 0 01-2.18 2 19.86 19.86 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.86 19.86 0 012.1 4.18 2 2 0 014.08 2h3a2 2 0 012 1.72c.12.9.33 1.78.62 2.62a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.46-1.18a2 2 0 012.11-.45c.84.29 1.72.5 2.62.62A2 2 0 0122 16.92z"
              />
            </svg>
          ),
        };
      default:
        return {
          label: "Tarix",
          bg: "bg-gray-100",
          text: "text-gray-600",
          icon: (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="9" />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 7v5l3 3"
              />
            </svg>
          ),
        };
    }
  }

  // ─── Izoh yuborish ────────────────────────────────────────────────────────
  const handleSendComment = async () => {
    if (!commentText.trim() || !lead) return;
    setSaving(true);
    setSaveError("");
    try {
      await ApiCall(`/api/v1/crm/leads/${lead.id}/comments`, "POST", {
        description: commentText.trim(),
        commenterId: userId,
      });
      setCommentText("");
      await fetchComments(lead.id);
    } catch (e) {
      setSaveError("Comment yuborishda xatolik.");
      toast.error("Izoh yuborishda xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };
  const extractRecordId = (text) => {
    const match = text?.match(/\[ID:(.*?)\]/);
    return match ? match[1] : null;
  };

  const handlePlayAudio = async (recordId) => {
    if (!recordId) return;

    // agar allaqachon yuklangan bo'lsa
    if (audioMap[recordId]) {
      setPlayingId(recordId);
      return;
    }

    try {
      setLoadingAudioId(recordId);

      const res = await fetch(`${baseUrl}/sipuni/audio?id=${recordId}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      setAudioMap((prev) => ({
        ...prev,
        [recordId]: url,
      }));

      setPlayingId(recordId);
    } catch (e) {
      console.error("Audio error:", e);
    } finally {
      setLoadingAudioId(null);
    }
  };

  if (!show || !lead) return null;

  const fullName = lead.applicant
    ? `${lead.applicant.firstName || ""} ${lead.applicant.lastName || ""}`.trim()
    : lead.phone || "Noma'lum";

  const agentName =
    lead?.applicant?.agent != null
      ? lead?.applicant?.agent?.name.toUpperCase()
      : "BXU";

  const selectStyles = {
    control: (b) => ({
      ...b,
      minHeight: 34,
      fontSize: 13,
      borderColor: "#e5e7eb",
      "&:hover": { borderColor: "#93c5fd" },
    }),
    option: (b, { isFocused }) => ({
      ...b,
      fontSize: 13,
      backgroundColor: isFocused ? "#eff6ff" : "white",
      color: "#1f2937",
    }),
    menu: (b) => ({ ...b, zIndex: 100 }),
  };

  const reminderSelectStyles = {
    control: (b) => ({
      ...b,
      minHeight: 34,
      fontSize: 13,
      borderColor: "#fde68a",
      "&:hover": { borderColor: "#f59e0b" },
    }),
    option: (b, { isFocused }) => ({
      ...b,
      fontSize: 13,
      backgroundColor: isFocused ? "#fffbeb" : "white",
      color: "#1f2937",
    }),
    menu: (b) => ({ ...b, zIndex: 9999 }),
    menuPortal: (b) => ({ ...b, zIndex: 9999 }),
  };

  const handleDownloadPDF = async (phone, isContract) => {
    if (!userRef.current?.id) {
      alert("User ID topilmadi");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const url = `${baseUrl}/api/v1/abuturient/contract/${phone}/${userRef.current.id}`;
      const response = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error("Failed to download file");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = isContract
        ? `Contract_${phone}.pdf`
        : `Application_${phone}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      toast.error("PDF yuklab olishda xatolik yuz berdi");
    }
  };

  const score = applicant?.ball || 0;

  const minDateTime = new Date().toISOString().slice(0, 16);

  return (
    <>
      <div className="fixed inset-0 z-50 flex flex-col bg-white">
        {/* ─── Top bar ─────────────────────────────────────────────────────── */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-2.5 shadow-sm">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
              title="Orqaga (ESC)"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-gray-800">
                  {fullName}
                </h1>
                {agentName && (
                  <span className="flex items-center gap-1 rounded-full bg-blue-50 border border-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-600">
                    <svg
                      className="h-2.5 w-2.5 flex-shrink-0"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                    {agentName}
                  </span>
                )}
                {editForm.passportPin && (
                  <button
                    onClick={() => handleDownloadPDF(editForm.phone, true)}
                    className="ml-2 flex items-center gap-1 rounded-md bg-green-500 px-2 py-1 text-[11px] text-white hover:bg-green-600"
                  >
                    Shartnoma
                  </button>
                )}
              </div>
            </div>
          </div>
          <div
            className="cursor-pointer hover:bg-gray-100 rounded-full px-2 text-red-500 font-bold"
            onClick={onClose}
          >
            X
          </div>
        </div>

        {/* ─── Content ─────────────────────────────────────────────────────── */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── Chap: Abuturient tahrirlash ───────────────────────────────── */}
          <div className="flex w-[320px] flex-shrink-0 flex-col gap-3 overflow-y-auto border-r border-gray-100 p-3">
            {/* Shaxsiy ma'lumotlar */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />{" "}
                  Shaxsiy ma'lumotlar
                </h3>
                <button
                  onClick={handleSaveInfo}
                  type="button"
                  disabled={savingInfo || locked}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-white transition-colors
                    ${
                      hasChanges
                        ? "bg-blue-500 hover:bg-blue-600"
                        : "bg-gray-300 cursor-not-allowed"
                    } disabled:opacity-50`}
                >
                  {savingInfo ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  ) : null}
                  Saqlash
                </button>
              </div>
              {loadingApplicant ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />{" "}
                  Yuklanmoqda...
                </div>
              ) : (
                <div className="space-y-2">
                  <Field label="Familiya">
                    <Input
                      value={editForm.lastName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, lastName: e.target.value })
                      }
                      placeholder="Familiya"
                      disabled={locked}
                    />
                  </Field>
                  <Field label="Ism">
                    <Input
                      value={editForm.firstName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, firstName: e.target.value })
                      }
                      placeholder="Ism"
                      disabled={locked}
                    />
                  </Field>
                  <Field label="Otasining ismi">
                    <Input
                      value={editForm.fatherName}
                      onChange={(e) =>
                        setEditForm({ ...editForm, fatherName: e.target.value })
                      }
                      placeholder="Sharif"
                      disabled={locked}
                    />
                  </Field>
                  <Field label="Telefon">
                    <a
                      href={`tel:${
                        editForm.phone?.startsWith("+998")
                          ? editForm.phone.slice(4)
                          : editForm.phone
                      }`}
                      className="text-blue-500 underline"
                    >
                      {editForm.phone}
                    </a>
                  </Field>
                  <Field label="Passport raqami">
                    <Input
                      value={editForm.passportNumber}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          passportNumber: e.target.value.toUpperCase(),
                        })
                      }
                      placeholder="AA1234567"
                      disabled={locked}
                    />
                  </Field>
                  <Field label="PINFL">
                    <Input
                      value={editForm.passportPin}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          passportPin: e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 14),
                        })
                      }
                      placeholder="14 raqam"
                      disabled={locked}
                    />
                  </Field>
                </div>
              )}
              <h3 className="my-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />{" "}
                Manzil
              </h3>
              <div className="space-y-2">
                <Field label="Viloyat">
                  <Select
                    options={regions}
                    value={selectedRegion}
                    isDisabled={locked}
                    onChange={(v) => {
                      setSelectedRegion(v);
                      setSelectedDistrict(null);
                      if (v) fetchRegionDistricts(v.value);
                    }}
                    placeholder="Viloyat..."
                    styles={selectStyles}
                  />
                </Field>
                <Field label="Tuman">
                  <Select
                    options={districts}
                    value={selectedDistrict}
                    isDisabled={locked || !selectedRegion || loadingDistricts}
                    onChange={(v) => setSelectedDistrict(v)}
                    isLoading={loadingDistricts}
                    placeholder="Tuman..."
                    styles={selectStyles}
                  />
                </Field>
              </div>
            </div>

            {/* Yo'nalish */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="mb-2.5 flex items-center justify-between">
                <h3 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-purple-400" />{" "}
                  Yo'nalish
                </h3>
                <button
                  type="button"
                  onClick={handleSaveDirection}
                  disabled={savingInfo || locked}
                  className={`flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-white transition-colors
                    ${
                      hasDirectionChanges()
                        ? "bg-purple-500 hover:bg-purple-600"
                        : "bg-gray-300 cursor-not-allowed"
                    } disabled:opacity-50`}
                >
                  {savingInfo ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" />
                  ) : null}
                  Saqlash
                </button>
              </div>
              <div className="space-y-2">
                <Field label="Ariza turi">
                  <Select
                    options={appealType}
                    value={selectedAppealType}
                    isDisabled={locked}
                    onChange={(v) => setSelectedAppealType(v)}
                    placeholder="Tanlang..."
                    styles={selectStyles}
                  />
                </Field>
                <Field label="Ta'lim turi">
                  <Select
                    options={educationType}
                    value={selectedEduType}
                    isDisabled={locked}
                    onChange={(v) => {
                      setSelectedEduType(v);
                      setSelectedEduForm(null);
                      setSelectedEduField(null);
                      if (v) fetchEducationForms(v.value);
                    }}
                    placeholder="Tanlang..."
                    styles={selectStyles}
                  />
                </Field>
                <Field label="Ta'lim shakli">
                  <Select
                    options={educationForm}
                    value={selectedEduForm}
                    isDisabled={locked || !selectedEduType}
                    onChange={(v) => {
                      setSelectedEduForm(v);
                      setSelectedEduField(null);
                      if (v) fetchEducationFields(v.value);
                    }}
                    placeholder="Tanlang..."
                    styles={selectStyles}
                  />
                </Field>
                <Field label="Yo'nalish">
                  <Select
                    options={educationField}
                    value={selectedEduField}
                    isDisabled={locked || !selectedEduForm}
                    onChange={(v) => setSelectedEduField(v)}
                    placeholder="Tanlang..."
                    styles={selectStyles}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* ── O'rta: CRM Kategoriya ─────────────────────────────────────── */}
          <div className="flex w-[300px] flex-shrink-0 flex-col gap-3 overflow-y-auto border-r border-gray-100 p-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3 my-2">
              <h3 className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />{" "}
                Operator
              </h3>
              <Select
                options={operators.map((op) => ({
                  value: op.id,
                  label: op.username || op.name || op.id,
                }))}
                value={selectedOperator}
                onChange={handleSetOperator}
                isLoading={savingOperator}
                isDisabled={savingOperator || locked}
                isSearchable
                placeholder="Operator tanlang..."
                styles={selectStyles}
              />
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <div className="flex justify-between items-center mb-2">
                <h3 className="mb-0 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400" />{" "}
                  Kategoriya
                </h3>
                <button
                  type="button"
                  onClick={handleSaveLead}
                  disabled={saving}
                  className={`flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors
                    ${
                      hasSubCatChanged
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-300 cursor-not-allowed"
                    } disabled:opacity-60`}
                >
                  {saving ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  Saqlash
                </button>
              </div>
              {loadingCats ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-300 border-t-indigo-600" />{" "}
                  Yuklanmoqda...
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {allCategories.map((cat) => {
                    const isSelected = selectedCatId === cat.id;
                    const isCurrent =
                      lead.crmSubCategory?.crmCategory?.id === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryChange(cat.id)}
                        disabled={locked}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-all
                          ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50 font-semibold text-indigo-700"
                              : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/40"
                          }`}
                      >
                        <span>{cat.name}</span>
                        <div className="flex items-center gap-1">
                          {isCurrent && !isSelected && (
                            <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500">
                              joriy
                            </span>
                          )}
                          {isSelected && (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5 text-indigo-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* SubKategoriya */}
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
              <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />{" "}
                Bosqich
              </h3>
              {loadingSubCats ? (
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-orange-300 border-t-orange-600" />{" "}
                  Yuklanmoqda...
                </div>
              ) : allSubCategories.length === 0 ? (
                <p className="text-xs text-gray-400">
                  {selectedCatId
                    ? "Bosqichlar yo'q"
                    : "Avval kategoriya tanlang"}
                </p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {allSubCategories
                    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                    .map((sub) => {
                      const isSelected = selectedSubCatId === sub.id;
                      const isCurrent = lead.crmSubCategory?.id === sub.id;
                      return (
                        <button
                          key={sub.id}
                          disabled={locked}
                          onClick={() => setSelectedSubCatId(sub.id)}
                          className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-all
                            ${
                              isSelected
                                ? "border-orange-500 bg-orange-50 font-semibold text-orange-700"
                                : "border-gray-200 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50/40"
                            }`}
                        >
                          <span>{sub.name}</span>
                          <div className="flex items-center gap-1">
                            {isCurrent && !isSelected && (
                              <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] text-gray-500">
                                joriy
                              </span>
                            )}
                            {isSelected && (
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-3.5 w-3.5 text-orange-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
              {hasSubCatChanged && (
                <div className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-700">
                  ⚠️ O'zgarish bor. "Saqlash" tugmasini bosing.
                </div>
              )}
            </div>
          </div>

          {/* ── O'ng: Izohlar ─────────────────────────────────────────────── */}
          <div className="flex flex-1 flex-col overflow-hidden p-3">
            <h3 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
              <span className="h-1.5 w-1.5 rounded-full bg-teal-400" /> Izohlar
            </h3>

            <div className="flex-1 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50 p-3">
              {loadingComments ? (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600" />
                </div>
              ) : comments.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-gray-300">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="mb-2 h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  <p className="text-xs">Izohlar yo'q</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {comments.map((c) => {
                    const recordId = extractRecordId(c.description);
                    const meta = getHistoryMeta(c.historyStatus);
                    return (
                      <div
                        key={c.id}
                        className="rounded-xl border border-gray-100 bg-white p-3 shadow-sm hover:shadow-md transition"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <div
                                  className={`mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${meta.bg} ${meta.text}`}
                                >
                                  {meta.icon}
                                </div>
                                <p className="text-xs font-medium text-gray-800 mb-0">
                                  {c.commenter?.username
                                    ? `${c.commenter.username}`.toUpperCase()
                                    : "NO'MALUM"}
                                </p>
                              </div>
                              <p className="text-[11px] text-gray-400 mb-0">
                                {formatDate(c.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div
                            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${meta.bg} ${meta.text}`}
                          >
                            {meta.icon}
                            {meta.label}
                          </div>
                        </div>
                        <div className="flex flex-col w-full">
                          <div className="flex items-start justify-between gap-2">
                            <p className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed mb-0">
                              {c.description}
                            </p>

                            {recordId &&
                              !c.description.includes("Не отвечен") && (
                                <button
                                  onClick={() => handlePlayAudio(recordId)}
                                  className="ml-2 text-blue-500 flex items-center hover:scale-110 transition"
                                >
                                  Audio tinglash:
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="h-6 w-6"
                                  >
                                    <path d="M8 6.82v10.36c0 .79.87 1.27 1.54.84l8.14-5.18a1 1 0 000-1.68L9.54 5.98A1 1 0 008 6.82z" />
                                  </svg>
                                </button>
                              )}
                          </div>

                          {playingId === recordId && audioMap[recordId] && (
                            <audio
                              controls
                              autoPlay
                              src={audioMap[recordId]}
                              className="w-full mt-1"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={commentsEndRef} />
                </div>
              )}
            </div>

            {/* ── Reminder panel ──────────────────────────────────────────── */}
            {showReminderPanel && (
              <div
                ref={reminderPanelRef}
                className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 shadow-lg"
              >
                <div className="mb-2.5 flex items-center justify-between">
                  <h4 className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-600">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Eslatma qo'shish
                  </h4>
                  <button
                    onClick={() => setShowReminderPanel(false)}
                    className="text-amber-400 hover:text-amber-600 text-xs"
                  >
                    ✕
                  </button>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-amber-600 uppercase tracking-wide">
                      Mas'ul operator
                    </p>
                    <Select
                      options={operators.map((op) => ({
                        value: op.id,
                        label: op.username || op.name || op.id,
                      }))}
                      value={reminderOperator}
                      onChange={(v) => setReminderOperator(v)}
                      isSearchable
                      isDisabled={true}
                      placeholder="Operator tanlang..."
                      styles={reminderSelectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-amber-600 uppercase tracking-wide">
                      Eslatma sanasi va vaqti
                    </p>
                    <input
                      type="datetime-local"
                      value={reminderTime}
                      min={minDateTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="w-full rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-gray-800 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <p className="mb-1 text-[11px] font-medium text-amber-600 uppercase tracking-wide">
                      Eslatma matni
                    </p>
                    <textarea
                      value={reminderDescription}
                      onChange={(e) => setReminderDescription(e.target.value)}
                      placeholder="Eslatma matnini yozing..."
                      rows={2}
                      className="w-full resize-none rounded-lg border border-amber-200 bg-white px-3 py-1.5 text-sm text-gray-700 placeholder-gray-400 focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSaveReminder}
                    disabled={savingReminder}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 disabled:opacity-50 transition-colors"
                  >
                    {savingReminder ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    Eslatmani saqlash
                  </button>
                </div>
              </div>
            )}

            {/* Izoh input */}
            <div className="mt-3 flex gap-2">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendComment();
                  }
                }}
                placeholder="Izoh yozing... (Enter — yuborish, Shift+Enter — yangi qator)"
                rows={3}
                className="flex-1 resize-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 placeholder-gray-400 focus:border-blue-400 focus:outline-none"
              />
              <div>
                {/* ── Reminder tugmasi (send tugmasidan YUQORIDA, chap tomonda) ── */}
                <button
                  type="button"
                  onClick={() => setShowReminderPanel((prev) => !prev)}
                  title="Eslatma qo'shish"
                  className={`flex h-10 w-10 mb-1 flex-shrink-0 items-center justify-center self-end rounded-xl border transition-colors
                  ${
                    showReminderPanel
                      ? "border-amber-400 bg-amber-100 text-amber-600"
                      : "border-gray-200 bg-white text-gray-400 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-500"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </button>
                <button
                  onClick={handleSendComment}
                  disabled={!commentText.trim() || saving}
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center self-end rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
                  title="Yuborish (Enter)"
                >
                  {saving ? (
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

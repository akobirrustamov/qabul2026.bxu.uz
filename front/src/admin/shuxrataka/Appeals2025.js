import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import Select from "react-select";
import axios from "axios";

function Appeals() {
  const baseUrl = "http://172.20.172.24:8080/";

  // Create axios instance with base URL and auth header
  const axiosInstance = axios.create({
    baseURL: baseUrl,
  });

  // Add request interceptor to include token
  axiosInstance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
  );

  // Helper function to make API calls
  const apiCall = async (url, method = "GET", data = null, params = null) => {
    try {
      const config = {
        method,
        url,
      };

      if (data) {
        config.data = data;
      }

      if (params) {
        config.params = params;
      }

      const response = await axiosInstance(config);
      return response.data;
    } catch (error) {
      console.error(`API Error (${url}):`, error);
      throw error;
    }
  };

  // Helper function for file uploads
  const apiCallFormData = async (url, method = "POST", formData) => {
    try {
      const config = {
        method,
        url,
        data: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      };

      const response = await axiosInstance(config);
      return response.data;
    } catch (error) {
      console.error(`API FormData Error (${url}):`, error);
      throw error;
    }
  };

  // All state variables remain the same
  const [appeals, setAppeals] = useState([]);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [appealType, setAppealType] = useState([]);
  const [educationType, setEducationType] = useState([]);
  const [educationForm, setEducationForm] = useState([]);
  const [educationField, setEducationField] = useState([]);
  const [agents, setAgents] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [ballModalOpen, setBallModalOpen] = useState(false);
  const [selectedAppealId, setSelectedAppealId] = useState(null);
  const [enteredBall, setEnteredBall] = useState("");
  const token = localStorage.getItem("access_token");
  const [documentStatus, setDocumentStatus] = useState(null);
  const [description, setDescription] = useState("");
  const [extraData, setExtraData] = useState([]);
  const [oldStudyValue, setOldStudyValue] = useState(null);
  const [oldStudyTime, setOldStudyTime] = useState(null);
  const [studyModalOpen, setStudyModalOpen] = useState(false);
  const [selectedStudyId, setSelectedStudyId] = useState(null);
  const [selectedStudyValue, setSelectedStudyValue] = useState(null);
  const [selectedStudyDate, setSelectedStudyDate] = useState("");

  // Payment related states
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: "",
    file: null,
  });

  const [discountModalOpen, setDiscountModalOpen] = useState(false);
  const [discountData, setDiscountData] = useState(null);
  const [discountLoading, setDiscountLoading] = useState(false);
  const [admin, setAdmin] = useState();
  const [agentModalOpen, setAgentModalOpen] = useState(false);
  const [agentAssignLoading, setAgentAssignLoading] = useState(false);
  const [agentSelectValue, setAgentSelectValue] = useState(null);
  const [targetAbuturientId, setTargetAbuturientId] = useState(null);

  // Document status options
  const documentLists = [
    { value: 0, label: "Hujjat topshirilmagan" },
    { value: 1, label: "Hujjat to'liq emas" },
    { value: 2, label: "Hujjat to'liq" },
  ];

  // Format date time helper
  const formatDateTime = (dateString) => {
    if (!dateString) return "Ma'lumot yo'q";
    const date = new Date(dateString);
    return date.toLocaleString("uz-UZ", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Fetch functions - updated with proper axios calls
  const fetchAppeals = async () => {
    try {
      const queryParams = {
        ...filters,
        page: pagination.pageNumber,
        size: pagination.size,
      };

      const response = await apiCall("/api/v1/admin/appeals", "GET", null, queryParams);
      setAppeals(response.content);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.totalPages,
      }));
    } catch (error) {
      console.error("Error fetching appeals:", error);
    }
  };

  const fetchAppealsExcel = async () => {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      window.open(`${baseUrl}/api/v1/admin/appeals/excel?${queryParams}`, "_blank");
    } catch (error) {
      console.error("Error downloading Excel:", error);
      alert("Excel faylni yuklab bo'lmadi");
    }
  };

  const fetchAgents = async () => {
    try {
      const response = await apiCall("/api/v1/agent", "GET");
      setAgents(response);
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  const fetchAppealType = async () => {
    try {
      const response = await apiCall("/api/v1/appeal-type", "GET");
      setAppealType(response || []);
    } catch (error) {
      console.error("Error fetching appeal types:", error);
    }
  };

  const fetchEducationType = async () => {
    try {
      const response = await apiCall("/api/v1/education-type", "GET");
      setEducationType(response);
    } catch (error) {
      console.error("Error fetching education types:", error);
    }
  };

  const fetchEducationForm = async (id) => {
    try {
      const response = await apiCall(`/api/v1/education-form/${id}`, "GET");
      setEducationForm(response);
    } catch (error) {
      console.error("Error fetching education forms:", error);
    }
  };

  const fetchEducationField = async (id) => {
    try {
      const response = await apiCall(`/api/v1/education-field/${id}`, "GET");
      setEducationField(response);
    } catch (error) {
      console.error("Error fetching education fields:", error);
    }
  };

  const fetchExtraData = async () => {
    try {
      const response = await apiCall("/api/v1/abuturient-document", "GET");
      setExtraData(response);
    } catch (error) {
      console.error("Qo'shimcha ma'lumotlar yuborishda xatolik:", error);
    }
  };

  const fetchAdmin = async () => {
    try {
      const response = await apiCall(`/api/v1/auth/me/${token}`, "GET");
      setAdmin(response.id || []);
    } catch (error) {
      console.error("Error fetching admin:", error);
    }
  };

  const fetchDiscountInfo = async (passportPin) => {
    if (!passportPin) {
      alert("Talabaning JSHR topilmadi!");
      return;
    }

    try {
      setDiscountLoading(true);
      const response = await fetch(
          `https://edu.bxu.uz/api/v1/discount-student/${passportPin}`
      );

      if (!response.ok) throw new Error("So'rovda xatolik!");
      const data = await response.json();
      setDiscountData(data);
      setDiscountModalOpen(true);
    } catch (error) {
      console.error("❌ Chegirma ma'lumotini olishda xato:", error);
      alert("Chegirma ma'lumotlari bazada mavjud emas yoki yuklanmagan!");
    } finally {
      setDiscountLoading(false);
    }
  };

  // Handlers - updated with proper axios calls
  const handleDeleteAppeal = async (abuturientId) => {
    if (window.confirm("Rostan ham bu arizani o'chirmoqchimisiz?")) {
      try {
        await apiCall(`/api/v1/abuturient/${abuturientId}`, "DELETE");
        fetchAppeals();
      } catch (error) {
        console.error("Arizani o'chirishda xatolik:", error);
        alert("Arizani o'chirishda xatolik yuz berdi");
      }
    }
  };

  const handleStudySelectChange = async (studentId, value) => {
    try {
      await apiCall(`/api/v1/admin/${studentId}/${value}`, "PUT");
      fetchAppeals();
    } catch (error) {
      console.error("❌ Holatni o'zgartirishda xato:", error);
      alert("Holatni o'zgartirib bo'lmadi!");
    }
  };

  const handleConfirmStudyChange = async () => {
    if (!selectedStudyDate) {
      alert("Sana va vaqtni tanlang!");
      return;
    }

    try {
      await apiCall(`/api/v1/admin/${selectedStudyId}/${selectedStudyValue}`, "PUT", {
        isStudyUpdatedAt: selectedStudyDate,
      });

      setStudyModalOpen(false);
      setSelectedStudyDate("");
      fetchAppeals();
    } catch (error) {
      console.error("Holatni o'zgartirishda xato:", error);
      alert("Holatni o'zgartirib bo'lmadi!");
    }
  };

  const handlePaymentSubmit = async () => {
    try {
      let fileId = null;

      // 1️⃣ Fayl yuklash
      if (paymentData.file) {
        const formDataFile = new FormData();
        formDataFile.append("photo", paymentData.file);
        formDataFile.append("prefix", "payment");

        const uploadResponse = await apiCallFormData(
            "/api/v1/file/upload",
            "POST",
            formDataFile
        );

        fileId = uploadResponse?.data?.id || uploadResponse?.data;
      }

      // 2️⃣ To'lov ma'lumotini yuborish
      const body = {
        userId: selectedAgent?.agentId,
        abuturientId: selectedAgent?.studentId,
        fileId,
        amount: Number(paymentData.amount),
      };

      try {
        const res = await apiCall("/api/v1/payment-agents", "POST", body);
        alert("✅ To'lov muvaffaqiyatli qo'shildi!");
      } catch (error) {
        if (error.response?.status === 400) {
          alert("❌ Bu talabaga to'lov avval qilingan!");
        } else {
          throw error;
        }
      }

      setIsPaymentModalOpen(false);
      setPaymentData({ amount: "", file: null });
    } catch (error) {
      console.error("Error adding payment:", error);
      alert("❌ To'lovni saqlashda xatolik yuz berdi!");
    }
  };

  const handleDownloadFile = async (id) => {
    if (!id) {
      alert("Fayl mavjud emas");
      return;
    }

    try {
      window.open(`${baseUrl}/api/v1/file/getFile/${id}`, "_blank");
    } catch (error) {
      console.error("Download error:", error);
      alert("Faylni yuklashda xatolik yuz berdi");
    }
  };

  const handleDownloadPDF = async (phone) => {
    try {
      window.open(`${baseUrl}/api/v1/abuturient/contract/${phone}`, "_blank");
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("PDF yuklashda xatolik yuz berdi");
    }
  };

  const handleDownloadPDF02 = async (phone) => {
    try {
      window.open(`${baseUrl}/api/v1/abuturient/contract02/${phone}`, "_blank");
    } catch (error) {
      console.error("Error downloading PDF02:", error);
      alert("PDF yuklashda xatolik yuz berdi");
    }
  };

  const assignAgentToAbuturient = async () => {
    if (!targetAbuturientId || !agentSelectValue?.value) {
      alert("Сначала выберите агента.");
      return;
    }
    try {
      setAgentAssignLoading(true);
      await apiCall(`/api/v1/abuturient/agent/${targetAbuturientId}/${agentSelectValue.value}`, "PUT");

      setAgentModalOpen(false);
      setAgentSelectValue(null);
      setTargetAbuturientId(null);
      await fetchAppeals();
    } catch (e) {
      console.error("Agent assign error:", e);
      alert("Не удалось назначить агента (возможно, агент не найден).");
    } finally {
      setAgentAssignLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!validateInputs()) return;

    try {
      await apiCall(`/api/v1/admin/appeals/${editData.id}/${token}`, "PUT", editData);
      await handleSubmitExtraData();
      setEditModalOpen(false);
      fetchAppeals();
    } catch (error) {
      console.error("Error updating appeal:", error);
    }
  };

  const handleSubmitExtraData = async () => {
    const isStatusFilled = !!documentStatus;
    const isDescriptionFilled = !!description.trim();

    if ((isStatusFilled && !isDescriptionFilled) || (!isStatusFilled && isDescriptionFilled)) {
      setEditModalOpen(true);
      return;
    }

    if (!isStatusFilled && !isDescriptionFilled) {
      console.log("Qo'shimcha ma'lumotlar to'ldirilmagan — yuborilmadi.");
      return;
    }

    try {
      await apiCall("/api/v1/abuturient-document", "POST", {
        userId: admin,
        abuturientId: editData.id,
        documentStatus: documentStatus.value,
        title: "Hujjat holati",
        description,
      });

      setDocumentStatus(null);
      setDescription("");
      console.log("Qo'shimcha ma'lumotlar yuborildi.");
    } catch (error) {
      console.error("Qo'shimcha ma'lumotlar yuborishda xatolik:", error);
    }
  };

  const handleSubmitBall = async () => {
    const ball = parseFloat(enteredBall);

    if (isNaN(ball) || ball <= 0 || ball >= 189) {
      alert("Ball 0 dan katta va 189 dan kichik bo'lishi kerak");
      return;
    }

    try {
      await apiCall(`/api/v1/admin/appeals/ball/${selectedAppealId}/${ball}/${token}`, "PUT");
      setBallModalOpen(false);
      setEnteredBall("");
      await fetchAppeals();
    } catch (error) {
      console.error("Ball yuborishda xatolik:", error);
      alert("Ball yuborilmadi");
    }
  };

  // Rest of your state and logic remains exactly the same...
  // [All your existing state and UI rendering code stays the same]

  // Filters state
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

  const [pagination, setPagination] = useState({
    pageNumber: 0,
    totalPages: 1,
    size: 50,
  });

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

  // Agent options
  const agentOptions = [
    { value: "", label: "Hammasi" },
    ...agents.map((item) => ({
      value: String(item.agent.id),
      label: item.agent.name,
    })),
  ];

  const agentSelectOptions = React.useMemo(
      () =>
          agents.map((item) => ({
            value: String(item?.agent?.id ?? item?.id),
            label: item?.agent?.name ?? item?.name,
          })),
      [agents]
  );

  // Event handlers
  const handlePageChange = async (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, pageNumber: newPage }));
      await fetchAppeals();
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    if (name === "educationTypeId") fetchEducationForm(value);
    if (name === "educationFormId") fetchEducationField(value);
  };

  const handleAgentChange = (selectedOption) => {
    const value = selectedOption ? selectedOption.value : "";
    setFilters((prev) => ({
      ...prev,
      agentId: value,
    }));
  };

  const handleApplyFilters = () => {
    fetchAppeals();
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
      isStudy: 1,
    });
    fetchAppeals();
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;

    if (name === "passportPin") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 14) {
        setEditData((prev) => ({ ...prev, [name]: numericValue }));
      }
      return;
    }

    if (name === "passportNumber") {
      const formattedValue = value.toUpperCase();
      const letters = formattedValue.slice(0, 2).replace(/[^A-Z]/g, "");
      const numbers = formattedValue.slice(2).replace(/\D/g, "");
      const passportNumber = `${letters}${numbers.slice(0, 7)}`;
      setEditData((prev) => ({ ...prev, [name]: passportNumber }));
      return;
    }

    setEditData((prev) => ({ ...prev, [name]: value }));
    if (name === "educationTypeId") fetchEducationForm(value);
    if (name === "educationFormId") fetchEducationField(value);
  };

  const validateInputs = () => {
    const baseValid =
        editData.passportPin.length === 14 ||
        /^[A-Z]{2}\d{7}$/.test(editData.passportNumber) ||
        editData.firstName.trim() ||
        editData.lastName.trim() ||
        editData.fatherName.trim() ||
        editData.appealTypeId ||
        editData.educationTypeId ||
        editData.educationFormId ||
        editData.educationFieldId;

    const extraDocumentValid =
        !editModalOpen ||
        documentStatus?.value === 0 ||
        (documentStatus?.value !== 0 &&
            description.trim() &&
            editData?.passportPin?.length === 14 &&
            /^[A-Z]{2}\d{7}$/.test(editData?.passportNumber));

    return baseValid && extraDocumentValid;
  };

  const handleEditClick = (appeal) => {
    const educationTypeId = appeal.educationField?.educationForm?.educationType?.id || "";
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

    const matchedStatus = documentLists.find(
        (opt) => opt.value === appeal.documentStatus
    );
    setDocumentStatus(matchedStatus || null);

    const matchedExtra = extraData.find(
        (extra) =>
            extra.abuturient.firstName === appeal.firstName &&
            extra.abuturient.lastName === appeal.lastName
    );
    setDescription(matchedExtra?.description || "");
    setEditModalOpen(true);
  };

  function openAgentPicker(appeal) {
    setTargetAbuturientId(appeal.id);
    const currentId = appeal?.agent?.id ? String(appeal.agent.id) : null;
    setAgentSelectValue(
        currentId
            ? agentSelectOptions.find((o) => o.value === currentId) ?? null
            : null
    );
    setAgentModalOpen(true);
  }

  function handleAgentSelectChange(opt) {
    setAgentSelectValue(opt);
  }

  // Pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const totalPages = pagination.totalPages;

    buttons.push(
        <button
            key={1}
            onClick={() => handlePageChange(0)}
            className={`px-4 py-2 rounded-md ${
                pagination.pageNumber === 0
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 hover:bg-gray-300"
            }`}
        >
          1
        </button>
    );

    if (pagination.pageNumber > 2) {
      buttons.push(<span key="ellipsis-start">...</span>);
    }

    for (
        let i = Math.max(1, pagination.pageNumber - 1);
        i <= Math.min(totalPages - 2, pagination.pageNumber + 1);
        i++
    ) {
      buttons.push(
          <button
              key={i + 1}
              onClick={() => handlePageChange(i)}
              className={`px-4 py-2 rounded-md ${
                  pagination.pageNumber === i
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
              }`}
          >
            {i + 1}
          </button>
      );
    }

    if (pagination.pageNumber < totalPages - 3) {
      buttons.push(<span key="ellipsis-end">...</span>);
    }

    if (totalPages > 1) {
      buttons.push(
          <button
              key={totalPages}
              onClick={() => handlePageChange(totalPages - 1)}
              className={`px-4 py-2 rounded-md ${
                  pagination.pageNumber === totalPages - 1
                      ? "bg-blue-500 text-white"
                      : "bg-gray-200 hover:bg-gray-300"
              }`}
          >
            {totalPages}
          </button>
      );
    }

    return buttons;
  };

  // Use effect
  useEffect(() => {
    fetchAppeals();
    fetchAppealType();
    fetchEducationType();
    fetchAgents();
    fetchAdmin();
    fetchExtraData();
  }, []);

  // Your UI rendering code remains exactly the same...
  // [Keep all your JSX/UI code exactly as it is]

  return (
      <div>
        <Sidebar />
        <div className="p-10 sm:ml-64">
          <h2 className="text-3xl">Kelib tushgan arizalar</h2>

          {/* Filter Section */}
          <div className=" bg-white p-4 rounded-lg shadow-md">
            {showFilter && (
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/*<div>*/}
                  {/*    <label className="block text-gray-600">Familiya</label>*/}
                  {/*    <input*/}
                  {/*        type="text"*/}
                  {/*        name="lastName"*/}
                  {/*        value={filters.lastName}*/}
                  {/*        onChange={handleFilterChange}*/}
                  {/*        className="border border-gray-300 rounded-md p-1 w-full"*/}
                  {/*    />*/}
                  {/*</div>*/}
                  <div>
                    <label className="block text-gray-600">FIO</label>
                    <input
                        type="text"
                        name="firstName"
                        value={filters.firstName}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-md p-1 w-full"
                    />
                  </div>
                  {/*<div>*/}
                  {/*    <label className="block text-gray-600">Sharifi</label>*/}
                  {/*    <input*/}
                  {/*        type="text"*/}
                  {/*        name="fatherName"*/}
                  {/*        value={filters.fatherName}*/}
                  {/*        onChange={handleFilterChange}*/}
                  {/*        className="border border-gray-300 rounded-md p-1 w-full"*/}
                  {/*    />*/}
                  {/*</div>*/}
                  <div>
                    <label className="block text-gray-600">Passport raqami</label>
                    <input
                        type="text"
                        name="passportNumber"
                        value={filters.passportNumber}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-md p-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600">JSHR</label>
                    <input
                        type="text"
                        name="passportPin"
                        value={filters.passportPin}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-md p-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600">Telefon</label>
                    <input
                        type="text"
                        name="phone"
                        value={filters.phone}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-md p-1 w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-600">Ariza turi</label>
                    <select
                        name="appealTypeId"
                        value={filters.appealTypeId}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-md p-1 w-full"
                    >
                      <option value="">Hammasi</option>
                      {appealType.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-600">Ta'lim turi</label>
                    <select
                        name="educationTypeId"
                        value={filters.educationTypeId}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-md p-1 w-full"
                    >
                      <option value="">Hammasi</option>
                      {educationType.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-600">Ta'lim shakli</label>
                    <select
                        name="educationFormId"
                        value={filters.educationFormId}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-md p-1 w-full"
                    >
                      <option value="">Hammasi</option>
                      {educationForm.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-600">Yo'nalish</label>
                    <select
                        name="educationFieldId"
                        value={filters.educationFieldId}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-md p-1 w-full"
                    >
                      <option value="">Hammasi</option>
                      {educationField.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-600">Agent</label>
                    <Select
                        name="agentId"
                        value={agentOptions.find(
                            (option) => option.value === String(filters.agentId)
                        )}
                        onChange={handleAgentChange}
                        options={agentOptions}
                        isClearable
                        isSearchable
                        placeholder="Agentni tanlang..."
                    />
                  </div>

                  <div>
                    <label className="block text-gray-600">Sana</label>
                    <input
                        type="date"
                        name="createdAt"
                        value={filters.createdAt}
                        onChange={handleFilterChange}
                        className="border border-gray-300 rounded-md p-1 w-full"
                    />
                  </div>
                </div>
            )}
            <div className=" flex justify-content-between mt-6">
              <div className={"flex gap-2"}>
                <button
                    onClick={handleApplyFilters}
                    className="bg-blue-500 text-white px-2 py-1 rounded-md hover:bg-blue-600"
                >
                  Filtrlash
                </button>
                <button
                    onClick={handleResetFilters}
                    className="bg-gray-500 text-white px-2 py-1 rounded-md hover:bg-gray-600"
                >
                  Tozalash
                </button>
                <button
                    onClick={fetchAppealsExcel}
                    className="bg-green-500 text-white px-2 py-1 rounded-md hover:bg-green-600 flex gap-2"
                >
                  <svg
                      className="w-6 h-6 text-gray-800 dark:text-white"
                      aria-hidden="true"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                  >
                    <path
                        stroke="currentColor"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 15v2a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-2m-8 1V4m0 12-4-4m4 4 4-4"
                    />
                  </svg>
                  Excel
                </button>
              </div>
              <div>
                <button
                    onClick={() => setShowFilter(!showFilter)}
                    className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600"
                >
                  {showFilter ? (
                      <svg
                          className="w-6 h-6 text-gray-800 dark:text-white"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="none"
                          viewBox="0 0 24 24"
                      >
                        <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="m5 15 7-7 7 7"
                        />
                      </svg>
                  ) : (
                      <svg
                          className="w-6 h-6 text-gray-800 dark:text-white"
                          aria-hidden="true"
                          xmlns="http://www.w3.org/2000/svg"
                          width="24"
                          height="24"
                          fill="none"
                          viewBox="0 0 24 24"
                      >
                        <path
                            stroke="currentColor"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="m19 9-7 7-7-7"
                        />
                      </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <table className="min-w-full mt-4 border-collapse border border-gray-300">
            <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                N%
              </th>
              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                FIO
              </th>
              {/* <th className="border border-gray-300 px-1 py-1 text-[14px]">
                Onasining ismi
              </th> */}
              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                Operator ismi
              </th>
              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                Operator birikkan vaqti
              </th>
              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                Passport
              </th>
              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                Telefon
              </th>

              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                Ta'lim turi
              </th>
              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                Ta'lim shakli
              </th>
              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                Yonalishi
              </th>
              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                Agent
              </th>
              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                Sana
              </th>
              {/* <th className="border border-gray-300 px-1 py-1 text-[14px]">
                Manzil
              </th> */}
              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                Status
              </th>
              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                Ball
              </th>
              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                O‘qish holati
              </th>

              <th className="border border-gray-300 px-1 py-1 text-[14px]">
                To'lov
              </th>
              <th className="border border-gray-300 px-1 py-1 text-[14px]"></th>
            </tr>
            </thead>
            <tbody>
            {appeals.map((appeal, index) => (
                <tr
                    key={index}
                    className="group border-t border-gray-200 hover:border-blue-500 hover:bg-blue-50 hover:border-l-green-400 transition-all"
                >
                  <td className="border border-gray-200 px-1 py-1 text-[14px]">
                    {index + 1}
                  </td>
                  <td className="border border-gray-200 px-1 py-1 text-[12px]">{`${appeal.lastName} ${appeal.firstName} ${appeal.fatherName}`}</td>
                  {/* <td className="border border-gray-200 px-1 py-1 text-[14px]">
                  {appeal?.motherName}
                </td> */}
                  <td
                      className="border border-gray-200 px-1 py-1 text-[14px] text-blue-600 cursor-pointer hover:underline"
                      onClick={() => handleDownloadFile(appeal?.operatorChek?.id)}
                  >
                    {appeal?.operator?.name
                        ? appeal?.operator?.name
                        : "Operator yo'q"}
                  </td>

                  <td className="border border-gray-200 px-1 py-1 text-[14px]">
                    {appeal?.operatorCreatedAt
                        ? formatDateTime(appeal.operatorCreatedAt)
                        : "Ma'lumot yo'q"}
                  </td>

                  <td
                      className={`border border-gray-200 px-1 py-1 text-[14px]
                    ${appeal.documentStatus === 1 && "bg-yellow-500"} ${
                          appeal.documentStatus === 2 && "bg-green-500"
                      } ${
                          appeal.documentStatus !== 1 &&
                          appeal.documentStatus !== 2 &&
                          "bg-red-500"
                      }`}
                  >
                    {`${appeal.passportPin || ""} ${appeal.passportNumber || ""}`}
                  </td>
                  <td className="border border-gray-200 px-1 py-1 text-[14px]">
                    {appeal.phone.trim()}
                  </td>

                  <td className="border border-gray-200 px-1 py-1 text-[14px]">
                    {appeal.educationField?.educationForm?.educationType?.name}
                  </td>
                  <td className="border border-gray-200 px-1 py-1 text-[14px]">
                    {appeal.educationField?.educationForm?.name}
                  </td>
                  <td className="border border-gray-200 px-1 py-1 text-[14px]">
                    {appeal.educationField?.name}
                  </td>
                  <td
                      onClick={() => openAgentPicker(appeal)}
                      title="Agentni o'zgartirish"
                      className="border cursor-pointer border-gray-200 px-1 py-1 text-[14px] hover:bg-blue-100"
                  >
                    {appeal.agent?.name || <span>BXU</span>}
                  </td>
                  <td className="border border-gray-200 px-1 py-1 text-[14px]">
                    {new Date(appeal.createdAt).toLocaleString()}
                  </td>
                  {/* {appeal.isForeign ? (
                  <td className="border border-gray-200 px-1 py-1 text-[12px]">
                    {appeal?.country}
                    <br />
                    {appeal?.city}
                  </td>
                ) : (
                  <td className="border border-gray-200 px-1 py-1 text-[12px]">
                    {appeal?.district?.region.name}
                    <br />
                    {appeal?.district?.name}
                  </td>
                )} */}

                  <td className="border border-gray-200 px-1 py-1 text-[10px]">
                    {appeal.status === 1 && "Telefon raqam kiritgan"}
                    {appeal.status === 2 && "Ma'lumot kiritgan"}
                    {appeal.status === 3 && "Test yechgan"}
                    {appeal.status === 4 && "Shartnoma olgan"}
                  </td>

                  <td className="border border-gray-200 px-1 py-1 text-[14px]">
                    <button
                        className="bg-blue-600 rounded p-1 text-white"
                        onClick={() => {
                          setSelectedAppealId(appeal.id);
                          setBallModalOpen(true);
                        }}
                    >
                      {appeal.ball ? appeal.ball : "0.0"}
                    </button>
                  </td>

                  <td className="border border-gray-200 px-1 py-1 text-[14px]">
                    <select
                        value={appeal.isStudy ?? 1}
                        onChange={(e) => {
                          setSelectedStudyId(appeal.id);
                          setSelectedStudyValue(Number(e.target.value));
                          setOldStudyValue(appeal.isStudy);
                          setOldStudyTime(appeal.isStudyUpdatedAt);
                          setStudyModalOpen(true);
                        }}
                        className="border border-gray-300 rounded-md p-1"
                    >
                      <option value={1}>O'qiydi</option>
                      <option value={0}>O'qimaydi</option>
                    </select>

                    {/* 🟢 ESKI HOLAT VA VAQTNI CHIQARAMIZ */}
                    <div className="text-[11px] text-gray-600 mt-1">
                      {appeal.isStudyUpdatedAt && (
                          <div>
                            <strong>Tanlangan vaqt:</strong>{" "}
                            {new Date(appeal.isStudyUpdatedAt).toLocaleString()}
                          </div>
                      )}
                    </div>
                  </td>

                  <td className="border border-gray-200 px-1 py-1 text-[14px]">
                    <button
                        onClick={() => fetchDiscountInfo(appeal.passportPin)}
                        title="Chegirma ma'lumotini olish"
                        className="bg-blue-600 text-white p-1 rounded-md"
                    >
                      Chegirmalar
                    </button>
                    {appeal.isPayed ? (
                        <p>{appeal.amount}</p>
                    ) : (
                        <button
                            onClick={() => {
                              setSelectedAgent({
                                agentId: appeal.agent?.id || null,
                                studentId: appeal.studentId || appeal.id, // <-- yangi qo‘shildi
                              });
                              setIsPaymentModalOpen(true);
                            }}
                            className="bg-purple-600 text-white px-2 py-1 rounded-md hover:bg-purple-700 ml-1"
                        >
                          💵 To‘lov
                        </button>
                    )}
                  </td>

                  <td className="border border-gray-200 px-1 py-1 text-[14px] d-flex gap-1 flex-col">
                    <div className="flex">
                      <button
                          className="text-white bg-blue-600 rounded p-1 hover:underline"
                          onClick={() => handleEditClick(appeal)}
                      >
                        <svg
                            className="w-6 h-6 text-gray-800 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                          <path
                              stroke="currentColor"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M10.779 17.779 4.36 19.918 6.5 13.5m4.279 4.279 8.364-8.643a3.027 3.027 0 0 0-2.14-5.165 3.03 3.03 0 0 0-2.14.886L6.5 13.5m4.279 4.279L6.499 13.5m2.14 2.14 6.213-6.504M12.75 7.04 17 11.28"
                          />
                        </svg>
                      </button>
                      <button
                          className="text-white bg-green-600 rounded p-1 hover:underline"
                          onClick={() => handleDownloadPDF(appeal.phone)}
                      >
                        <svg
                            className="w-6 h-6 text-gray-800 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                          <path
                              stroke="currentColor"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 5h6m-6 4h6M10 3v4h4V3h-4Z"
                          />
                        </svg>
                      </button>
                      <button
                          className="text-white bg-yellow-400 rounded p-1 hover:underline"
                          onClick={() => handleDownloadPDF02(appeal.phone)}
                      >
                        <svg
                            className="w-6 h-6 text-gray-800 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                          <path
                              stroke="currentColor"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 5h6m-6 4h6M10 3v4h4V3h-4Z"
                          />
                        </svg>
                      </button>
                      {/* Delete button */}
                      <button
                          className="text-white bg-red-600 rounded p-1 hover:underline"
                          onClick={() => handleDeleteAppeal(appeal.id)}
                      >
                        <svg
                            className="w-6 h-6 text-gray-800 dark:text-white"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                          <path
                              stroke="currentColor"
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
            ))}
            </tbody>
          </table>

          <div className="mt-4 flex justify-center gap-2">
            <button
                onClick={() => handlePageChange(pagination.pageNumber - 1)}
                disabled={pagination.pageNumber === 0}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
            >
              <svg
                  className="w-6 h-6 text-gray-800 dark:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
              >
                <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 6v12m8-12v12l-8-6 8-6Z"
                />
              </svg>
            </button>
            {renderPaginationButtons()}
            <button
                onClick={() => handlePageChange(pagination.pageNumber + 1)}
                disabled={pagination.pageNumber === pagination.totalPages - 1}
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
            >
              <svg
                  className="w-6 h-6 text-gray-800 dark:text-white"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
              >
                <path
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M16 6v12M8 6v12l8-6-8-6Z"
                />
              </svg>
            </button>
          </div>
          <Modal
              open={isPaymentModalOpen}
              onClose={() => setIsPaymentModalOpen(false)}
              center
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              💵 To‘lov qo‘shish
            </h2>

            <div
                className="flex flex-col bg-white rounded-lg shadow-lg p-6"
                style={{ width: "420px" }}
            >
              <label className="text-gray-600 mb-2">
                To‘lov summasi (so‘mda)
              </label>
              <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) =>
                      setPaymentData((prev) => ({ ...prev, amount: e.target.value }))
                  }
                  className="border border-gray-300 rounded-md p-2 mb-4"
                  placeholder="Masalan: 1500000"
              />

              <label className="text-gray-600 mb-2">
                To‘lov fayli (chek, rasm)
              </label>
              <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) =>
                      setPaymentData((prev) => ({ ...prev, file: e.target.files[0] }))
                  }
                  className="border border-gray-300 rounded-md p-2 mb-4"
              />

              <button
                  onClick={handlePaymentSubmit}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Saqlash
              </button>
            </div>
          </Modal>
          <Modal
              open={agentModalOpen}
              onClose={() => setAgentModalOpen(false)}
              center
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Agentni tanlash
            </h2>

            <div
                className="flex flex-col bg-white rounded-lg shadow-lg p-6"
                style={{ width: 420 }}
            >
              <label className="block text-gray-600 mb-2">Agent</label>
              <Select
                  options={agentSelectOptions}
                  value={agentSelectValue}
                  onChange={handleAgentSelectChange}
                  isSearchable
                  placeholder="Agentni tanlang..."
              />

              <div className="mt-6 flex gap-2">
                <button
                    onClick={assignAgentToAbuturient}
                    disabled={agentAssignLoading || !agentSelectValue?.value}
                    className={`px-4 py-2 rounded-md text-white ${
                        agentAssignLoading || !agentSelectValue?.value
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-600 hover:bg-green-700"
                    }`}
                >
                  {agentAssignLoading ? "Yuborilmoqda..." : "Qabul qilish"}
                </button>

                <button
                    onClick={() => setAgentModalOpen(false)}
                    className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
                >
                  Bekor qilish
                </button>
              </div>
            </div>
          </Modal>

          <Modal
              open={discountModalOpen}
              onClose={() => setDiscountModalOpen(false)}
              center
          >
            <div
                className="p-6 bg-white rounded-lg shadow-lg"
                style={{ width: "420px" }}
            >
              {discountLoading ? (
                  <p className="text-gray-600 text-center">Yuklanmoqda...</p>
              ) : discountData ? (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-3">
                      🎓 Chegirma ma'lumotlari
                    </h2>

                    <p>
                      <strong>FIO:</strong> {discountData.name}
                    </p>
                    <p>
                      <strong>JSHR:</strong> {discountData.passport_pin}
                    </p>
                    <p>
                      <strong>Asos:</strong> {discountData.asos || "Ko‘rsatilmagan"}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      {discountData.status === 1
                          ? "Tasdiqlangan"
                          : "Tasdiqlanmagan"}
                    </p>

                    {discountData.discountByYear?.length > 0 ? (
                        <div className="mt-3 border-t pt-2">
                          {discountData.discountByYear.map((item) => (
                              <div key={item.id} className="mb-2">
                                <p>
                                  <strong>Yil:</strong> {item.name}
                                </p>
                                <p>
                                  <strong>Chegirma:</strong>{" "}
                                  {item.discount?.toLocaleString()} so‘m
                                </p>
                                <p className="text-sm text-gray-500">
                                  Sana: {new Date(item.createAt).toLocaleString()}
                                </p>
                              </div>
                          ))}
                        </div>
                    ) : (
                        <p className="text-red-500 mt-3">Chegirma topilmadi.</p>
                    )}

                    <button
                        className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                        onClick={() => setDiscountModalOpen(false)}
                    >
                      Yopish
                    </button>
                  </div>
              ) : (
                  <p className="text-gray-600 text-center">Ma'lumot topilmadi.</p>
              )}
            </div>
          </Modal>

          {/* Edit Modal */}
          <Modal
              open={editModalOpen}
              onClose={() => setEditModalOpen(false)}
              animationDuration={600}
              center
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Tahrirlash
            </h2>
            <div
                className="flex flex-col bg-white rounded-lg shadow-lg p-6"
                style={{
                  width: "700px",
                  height: "auto",
                }}
            >
              <form>
                <div className="space-y-4">
                  <div className="flex gap-8">
                    <div className="w-1/2">
                      <div>
                        <label className="text-gray-600">Familiya</label>
                        <input
                            type="text"
                            name="lastName"
                            value={editData.lastName || ""}
                            onChange={handleInputChange}
                            className="border border-gray-300 rounded-md p-1 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                      </div>

                      <div>
                        <label className="text-gray-600">Ism</label>
                        <input
                            type="text"
                            name="firstName"
                            value={editData.firstName || ""}
                            onChange={handleInputChange}
                            className="border border-gray-300 rounded-md p-1 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                      </div>

                      <div>
                        <label className="text-gray-600">Otasining ismi</label>
                        <input
                            type="text"
                            name="fatherName"
                            value={editData.fatherName || ""}
                            onChange={handleInputChange}
                            className="border border-gray-300 rounded-md p-1 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                      </div>
                      <div>
                        <label className="text-gray-600">Onasining ismi</label>
                        <input
                            type="text"
                            name="motherName"
                            value={editData.motherName || ""}
                            onChange={handleInputChange}
                            className="border border-gray-300 rounded-md p-1 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                      </div>

                      <div>
                        <label className="text-gray-600">Ariza turi</label>
                        <select
                            name="appealTypeId"
                            value={editData.appealTypeId || ""}
                            onChange={handleInputChange}
                            className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        >
                          <option value="">Ariza turini tanlang</option>
                          {appealType?.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-gray-600">Ta'lim turi</label>
                        <select
                            name="educationTypeId"
                            value={editData.educationTypeId || ""}
                            onChange={(e) => {
                              handleInputChange(e);
                              fetchEducationForm(e.target.value);
                            }}
                            className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        >
                          <option value="">Ta'lim turini tanlang</option>
                          {educationType.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-gray-600">Ta'lim shakli</label>
                        <select
                            name="educationFormId"
                            value={editData.educationFormId || ""}
                            onChange={(e) => {
                              handleInputChange(e);
                              fetchEducationField(e.target.value);
                            }}
                            className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        >
                          <option value="">Ta'lim shaklini tanlang</option>
                          {educationForm.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-gray-600">Yo'nalish</label>
                        <select
                            name="educationFieldId"
                            value={editData.educationFieldId || ""}
                            onChange={handleInputChange}
                            className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        >
                          <option value="">Yo'nalishni tanlang</option>
                          {educationField?.length > 0 ? (
                              educationField.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                              ))
                          ) : (
                              <option value="">Ma'lumot mavjud emas</option>
                          )}
                        </select>
                      </div>
                    </div>
                    <div className="w-1/2">
                      <div>
                        <label className="text-gray-600">JSHR</label>
                        <input
                            type="text"
                            name="passportPin"
                            placeholder="Passport Pin (14 digits)"
                            value={editData.passportPin || ""}
                            onChange={handleInputChange}
                            className="border border-gray-300 rounded-md p-1 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                      </div>

                      <div>
                        <label className="text-gray-600">Passport raqami</label>
                        <input
                            type="text"
                            name="passportNumber"
                            placeholder="Passport Number (e.g., AB123456789)"
                            value={editData.passportNumber || ""}
                            onChange={handleInputChange}
                            className="border border-gray-300 rounded-md p-1 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                            required
                        />
                      </div>

                      <div>
                        <label className="block text-gray-700 font-medium mb-1">
                          Hujjat holati
                        </label>
                        <Select
                            id="documentStatus"
                            name="documentStatus"
                            options={documentLists}
                            value={documentStatus}
                            onChange={(selectedOption) =>
                                setDocumentStatus(selectedOption)
                            } // obyekt saqlanadi!
                            placeholder="Hujjat holatini tanlang"
                            isSearchable
                            required
                            styles={{
                              control: (base) => ({
                                ...base,
                                minHeight: "48px",
                                borderColor: "#d1d5db",
                                "&:hover": { borderColor: "#3b82f6" },
                              }),
                              option: (base, { isFocused }) => ({
                                ...base,
                                backgroundColor: isFocused ? "#e0e7ff" : "white",
                                color: "#1e3a8a",
                              }),
                            }}
                        />

                        <label className="text-gray-600">Batafsil</label>
                        <textarea
                            className="border border-gray-300 rounded-md p-1 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <button
                        type="button"
                        onClick={handleEditSubmit}
                        disabled={!validateInputs()}
                        className={`w-full p-3 rounded-md transition duration-200 ${
                            validateInputs()
                                ? "bg-green-600 text-white hover:bg-green-700"
                                : "bg-gray-400 text-white cursor-not-allowed"
                        }`}
                    >
                      Saqlash
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </Modal>

          <Modal
              open={ballModalOpen}
              onClose={() => setBallModalOpen(false)}
              center
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Ballni kiriting
            </h2>
            <div
                className="flex flex-col bg-white rounded-lg shadow-lg p-6"
                style={{ width: "400px" }}
            >
              <input
                  type="number"
                  value={enteredBall}
                  onChange={(e) => setEnteredBall(e.target.value)}
                  placeholder="0 dan 189 gacha"
                  className="border border-gray-300 rounded-md p-2 mb-4"
              />
              <button
                  onClick={handleSubmitBall}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Saqlash
              </button>
            </div>
          </Modal>
          <Modal
              open={studyModalOpen}
              onClose={() => setStudyModalOpen(false)}
              center
          >
            <div className="p-6 bg-white rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-4">
                O'qish holatini o'zgartirish
              </h2>

              <div className="mb-4">
                <label className="block text-gray-700 mb-1">
                  Sana va vaqtni tanlang
                </label>
                <input
                    type="datetime-local"
                    value={selectedStudyDate}
                    onChange={(e) => setSelectedStudyDate(e.target.value)}
                    className="border p-2 rounded w-full"
                />
              </div>
              {(oldStudyValue !== null || oldStudyTime) && (
                  <div className="mb-4 p-3 rounded bg-gray-100">
                    <p className="text-gray-700">
                      <strong>Tanlangan holat:</strong>{" "}
                      {oldStudyValue === 1 ? "O'qiydi" : "O'qimaydi"}
                    </p>

                    {oldStudyTime && (
                        <p className="text-gray-700">
                          <strong>Tanlangan vaqt:</strong>{" "}
                          {new Date(oldStudyTime).toLocaleString()}
                        </p>
                    )}
                  </div>
              )}

              <button
                  onClick={handleConfirmStudyChange}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
              >
                Tasdiqlash
              </button>
            </div>
          </Modal>
        </div>
      </div>
  );
}

export default Appeals;




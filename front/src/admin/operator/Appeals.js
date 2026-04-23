import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import ApiCall, { baseUrl } from "../../config";
import "react-responsive-modal/styles.css";
import { Modal } from "react-responsive-modal";
import Select from "react-select";
import { useNavigate } from "react-router-dom";

function Appeals() {
  const navigate = useNavigate();
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
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [targetAppealId, setTargetAppealId] = useState(null);
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);

  function openFileModal(appeal) {
    setTargetAppealId(appeal.id);
    setSelectedFile(null);
    setFileModalOpen(true);
  }

  async function handleFileUpload() {
    function validateFile(file) {
      if (!file) return "Fayl tanlanmagan";
      if (file.type !== "application/pdf")
        return "Faqat PDF fayl yuklash mumkin!";
      if (file.size > 5 * 1024 * 1024)
        return "Fayl hajmi 5 MB dan oshmasligi kerak!";
      return null;
    }

    const error = validateFile(selectedFile);
    if (error) {
      alert(error);
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("photo", selectedFile);
      formData.append("prefix", "abuturient_files");

      const uploadResponse = await fetch(`${baseUrl}/api/v1/file/upload`, {
        method: "POST",
        body: formData,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!uploadResponse.ok) throw new Error("Fayl yuklanmadi");

      const rawId = await uploadResponse.text();
      const fileId = rawId.replace(/"/g, "").trim();
      if (!fileId) throw new Error("Fayl ID topilmadi");

      const response = await ApiCall(
        `/api/v1/abuturient-operator/${targetAppealId}/${admin}/${fileId}`,
        "POST",
        null,
        null,
        true,
      );

      alert("PDF fayl muvaffaqiyatli yuklandi va bog'landi!");
      setFileModalOpen(false);
      fetchAppeals();
    } catch (err) {
      console.error("Fayl upload xatosi:", err);
      alert("Fayl yuborishda xatolik yuz berdi.");
    } finally {
      setUploading(false);
    }
  }

  const documentLists = [
    { value: 0, label: "Hujjat topshirilmagan" },
    { value: 1, label: "Hujjat to'liq emas" },
    { value: 2, label: "Hujjat to'liq" },
  ];

  const [admin, setAdmin] = useState();
  const [agentAssignLoading, setAgentAssignLoading] = useState(false);
  const [agentSelectValue, setAgentSelectValue] = useState(null);
  const [targetAbuturientId, setTargetAbuturientId] = useState(null);

  const fetchAdmin = async () => {
    try {
      const response = await ApiCall(
        `/api/v1/auth/me/` + token,
        "GET",
        null,
        null,
        true,
      );
      setAdmin(response.data.id);
    } catch (error) {
      console.error("Error fetching admin:", error);
      localStorage.removeItem("access_token");
      navigate("/admin/login");
    }
  };

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
    [agents],
  );

  function handleAgentSelectChange(opt) {
    setAgentSelectValue(opt);
  }

  async function assignAgentToAbuturient() {
    if (!targetAbuturientId || !agentSelectValue?.value) {
      alert("Агентни танланг.");
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
      setAgentSelectValue(null);
      setTargetAbuturientId(null);
      await fetchAppeals();
    } catch (e) {
      console.error("Agent assign error:", e);
      alert("Agent biriktirishda xatolik.");
    } finally {
      setAgentAssignLoading(false);
    }
  }

  function handleAgentChange(selectedOption) {
    const value = selectedOption ? selectedOption.value : "";
    setFilters((prev) => ({ ...prev, agentId: value }));
  }

  const fetchExtraData = async () => {
    try {
      const response = await ApiCall(
        `/api/v1/abuturient-document`,
        "GET",
        null,
        null,
        true,
      );
      setExtraData(response.data);
    } catch (error) {
      console.error("Qo'shimcha ma'lumotlar yuborishda xatolik:", error);
    }
  };

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

  useEffect(() => {
    if (!token) {
      navigate("/admin/login");
      return;
    }

    fetchAppeals();
    fetchAppealType();
    fetchEducationType();
    fetchAgents();
    fetchAdmin();
    fetchExtraData();
  }, []);

  const handleDeleteAppeal = async (abuturientId) => {
    if (window.confirm("Rostan ham bu arizani o'chirmoqchimisiz?")) {
      try {
        await ApiCall(
          `/api/v1/abuturient/${abuturientId}`,
          "DELETE",
          null,
          null,
          true,
        );
        fetchAppeals();
      } catch (error) {
        console.error("Arizani o'chirishda xatolik:", error);
        alert("Arizani o'chirishda xatolik yuz berdi");
      }
    }
  };

  const [pagination, setPagination] = useState({
    pageNumber: 0,
    totalPages: 1,
    size: 50,
  });

  const fetchAppeals = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...filters,
        page: pagination.pageNumber,
        size: pagination.size,
      }).toString();
      const response = await ApiCall(
        `/api/v1/admin/appeals?${queryParams}`,
        "GET",
        null,
        null,
        true,
      );
      setAppeals(response.data.content);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.data.totalPages,
      }));
    } catch (error) {
      console.error("Error fetching appeals:", error);
    }
  };

  const fetchAppealsExcel = async () => {
    try {
      const queryParams = new URLSearchParams({ ...filters }).toString();
      const response = await fetch(
        `${baseUrl}/api/v1/admin/appeals/excel?${queryParams}`,
        { method: "GET" },
      );
      if (!response.ok) throw new Error("Failed to download file");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Appeals.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading Excel file:", error);
    }
  };

  const handlePageChange = async (newPage) => {
    if (newPage >= 0 && newPage < pagination.totalPages) {
      setPagination((prev) => ({ ...prev, pageNumber: newPage }));
      await fetchAppeals();
    }
  };

  const renderPaginationButtons = () => {
    const buttons = [];
    const totalPages = pagination.totalPages;
    buttons.push(
      <button
        key={1}
        onClick={() => handlePageChange(0)}
        className={`px-4 py-2 rounded-md ${pagination.pageNumber === 0 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
      >
        1
      </button>,
    );
    if (pagination.pageNumber > 2)
      buttons.push(<span key="ellipsis-start">...</span>);
    for (
      let i = Math.max(1, pagination.pageNumber - 1);
      i <= Math.min(totalPages - 2, pagination.pageNumber + 1);
      i++
    ) {
      buttons.push(
        <button
          key={i + 1}
          onClick={() => handlePageChange(i)}
          className={`px-4 py-2 rounded-md ${pagination.pageNumber === i ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
        >
          {i + 1}
        </button>,
      );
    }
    if (pagination.pageNumber < totalPages - 3)
      buttons.push(<span key="ellipsis-end">...</span>);
    if (totalPages > 1) {
      buttons.push(
        <button
          key={totalPages}
          onClick={() => handlePageChange(totalPages - 1)}
          className={`px-4 py-2 rounded-md ${pagination.pageNumber === totalPages - 1 ? "bg-blue-500 text-white" : "bg-gray-200 hover:bg-gray-300"}`}
        >
          {totalPages}
        </button>,
      );
    }
    return buttons;
  };

  const fetchAgents = async () => {
    try {
      const response = await ApiCall("/api/v1/agent", "GET", null, null, true);
      setAgents(response.data);
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  const fetchAppealType = async () => {
    try {
      const response = await ApiCall(
        `/api/v1/appeal-type`,
        "GET",
        null,
        null,
        true,
      );
      setAppealType(response.data || []);
    } catch (error) {
      console.error("Error fetching appeal types:", error);
    }
  };

  const fetchEducationType = async () => {
    try {
      const response = await ApiCall(
        `/api/v1/education-type`,
        "GET",
        null,
        null,
        true,
      );
      setEducationType(response.data);
    } catch (error) {
      console.error("Error fetching education types:", error);
    }
  };

  const fetchEducationForm = async (id) => {
    try {
      const response = await ApiCall(
        `/api/v1/education-form/${id}`,
        "GET",
        null,
        null,
        true,
      );
      setEducationForm(response.data);
    } catch (error) {
      console.error("Error fetching education forms:", error);
    }
  };

  const fetchEducationField = async (id) => {
    try {
      const response = await ApiCall(
        `/api/v1/education-field/${id}`,
        "GET",
        null,
        null,
        true,
      );
      setEducationField(response.data);
    } catch (error) {
      console.error("Error fetching education fields:", error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    if (name === "educationTypeId") fetchEducationForm(value);
    if (name === "educationFormId") fetchEducationField(value);
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
    });
    fetchAppeals();
  };

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
    const matchedStatus = documentLists.find(
      (opt) => opt.value === appeal.documentStatus,
    );
    setDocumentStatus(matchedStatus || null);
    const matchedExtra = extraData.find(
      (extra) =>
        extra.abuturient.firstName === appeal.firstName &&
        extra.abuturient.lastName === appeal.lastName,
    );
    setDescription(matchedExtra?.description || "");
    setEditModalOpen(true);
  };

  const handleSubmitExtraData = async () => {
    const isStatusFilled = !!documentStatus;
    const isDescriptionFilled = !!description.trim();
    if (
      (isStatusFilled && !isDescriptionFilled) ||
      (!isStatusFilled && isDescriptionFilled)
    ) {
      setEditModalOpen(true);
      return;
    }
    if (!isStatusFilled && !isDescriptionFilled) {
      return;
    }
    try {
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
    } catch (error) {
      console.error("Qo'shimcha ma'lumotlar yuborishda xatolik:", error);
    }
  };

  const handleDownloadPDF = async (phone) => {
    try {
      const response = await fetch(
        `${baseUrl}/api/v1/abuturient/contract/${phone}`,
        { method: "GET" },
      );
      if (!response.ok) throw new Error("Failed to download file");
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `Contract_${phone}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("Error downloading PDF:", error);
    }
  };

  const handleInputChange = async (e) => {
    const { name, value } = e.target;
    if (name === "passportPin") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length <= 14)
        setEditData((prev) => ({ ...prev, [name]: numericValue }));
      return;
    }
    if (name === "passportNumber") {
      const formattedValue = value.toUpperCase();
      const letters = formattedValue.slice(0, 2).replace(/[^A-Z]/g, "");
      const numbers = formattedValue.slice(2).replace(/\D/g, "");
      setEditData((prev) => ({
        ...prev,
        [name]: `${letters}${numbers.slice(0, 7)}`,
      }));
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
    } catch (error) {
      console.error("Error updating appeal:", error);
    }
  };

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
      await fetchAppeals();
    } catch (error) {
      console.error("Ball yuborishda xatolik:", error);
      alert("Ball yuborilmadi");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed top-0 left-0 h-screen z-40">
        <Sidebar onHoverChange={setIsSidebarExpanded} />
      </div>

      {/* Blur overlay */}
      {isSidebarExpanded && (
        <div className="fixed inset-0 z-30 bg-black/10 backdrop-blur-[2px] transition-all duration-300" />
      )}

      {/* Main content */}
      <div className="flex-1 ml-20 p-10">
        <h2 className="text-3xl mb-4">Kelib tushgan arizalar</h2>

        {/* Filter Section */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-4">
          {showFilter && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                    (option) => option.value === String(filters.agentId),
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
          <div className="flex justify-between mt-6">
            <div className="flex gap-2">
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

            </div>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className="bg-red-500 text-white px-2 py-1 rounded-md hover:bg-red-600"
            >
              {showFilter ? (
                <svg
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m5 15 7-7 7 7"
                  />
                </svg>
              ) : (
                <svg
                  className="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="m19 9-7 7-7-7"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Table Section */}
        <table className="min-w-full mt-4 border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              {[
                "N%",
                "FIO",
                "Passport",
                "Telefon",
                "Operator ismi",
                "Ta'lim turi",
                "Ta'lim shakli",
                "Yonalishi",
                "Agent",
                "Sana",
                "Manzil",
                "Status",
                "Ball",
                "",
              ].map((col) => (
                <th
                  key={col}
                  className="border border-gray-300 px-1 py-1 text-[14px]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {appeals.map((appeal, index) => (
              <tr
                key={index}
                className="group border-t border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all"
              >
                <td className="border border-gray-200 px-1 py-1 text-[14px]">
                  {index + 1}
                </td>
                <td className="border border-gray-200 px-1 py-1 text-[12px]">{`${appeal.lastName} ${appeal.firstName} ${appeal.fatherName}`}</td>
                <td
                  className={`border border-gray-200 px-1 py-1 text-[14px]
                  ${appeal.documentStatus === 1 ? "bg-yellow-500" : ""}
                  ${appeal.documentStatus === 2 ? "bg-green-500" : ""}
                  ${appeal.documentStatus !== 1 && appeal.documentStatus !== 2 ? "bg-red-500" : ""}`}
                >
                  {`${appeal.passportPin || ""} ${appeal.passportNumber || ""}`}
                </td>
                <td className="border border-gray-200 px-1 py-1 text-[14px]">
                  {appeal.phone.trim()}
                </td>
                <td className="border border-gray-200 px-1 py-1 text-[14px]">
                  {appeal?.operator?.name || "Operator yo'q"}
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
                <td className="border border-gray-200 px-1 py-1 text-[14px]">
                  {appeal.agent?.name}
                </td>
                <td className="border border-gray-200 px-1 py-1 text-[14px]">
                  {new Date(appeal.createdAt).toLocaleString()}
                </td>
                {appeal.isForeign ? (
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
                )}
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
                <td className="border-gray-200 px-1 py-1 text-[14px] flex gap-1">
                  <button
                    className="text-white bg-green-600 rounded p-1 hover:underline"
                    onClick={() => handleDownloadPDF(appeal.phone)}
                  >
                    <svg
                      className="w-6 h-6"
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 4h3a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3m0 3h6m-6 5h6m-6 4h6M10 3v4h4V3h-4Z"
                      />
                    </svg>
                  </button>
                  {(!appeal.operator || !appeal.operatorChek) && (
                    <button
                      className="text-white bg-purple-600 rounded p-1 hover:underline"
                      onClick={() => openFileModal(appeal)}
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M12 12V4m0 8l-4-4m4 4 4-4" />
                      </svg>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* File Modal */}
        <Modal
          open={fileModalOpen}
          onClose={() => setFileModalOpen(false)}
          center
        >
          <h2 className="text-lg font-semibold mb-4">Fayl yuklash</h2>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => setSelectedFile(e.target.files[0])}
            className="mb-4"
          />
          <button
            onClick={handleFileUpload}
            disabled={uploading}
            className={`px-4 py-2 rounded-md text-white ${uploading ? "bg-gray-400" : "bg-purple-600 hover:bg-purple-700"}`}
          >
            {uploading ? "Yuklanmoqda..." : "Yuborish"}
          </button>
        </Modal>

        {/* Pagination */}
        <div className="mt-4 flex justify-center gap-2">
          <button
            onClick={() => handlePageChange(pagination.pageNumber - 1)}
            disabled={pagination.pageNumber === 0}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-gray-300"
          >
            <svg
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
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
              className="w-6 h-6"
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M16 6v12M8 6v12l8-6-8-6Z"
              />
            </svg>
          </button>
        </div>

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
            style={{ width: "700px" }}
          >
            <form>
              <div className="space-y-4">
                <div className="flex gap-8">
                  <div className="w-1/2">
                    {[
                      { label: "Familiya", name: "lastName" },
                      { label: "Ism", name: "firstName" },
                      { label: "Otasining ismi", name: "fatherName" },
                      { label: "Onasining ismi", name: "motherName" },
                    ].map(({ label, name }) => (
                      <div key={name}>
                        <label className="text-gray-600">{label}</label>
                        <input
                          type="text"
                          name={name}
                          value={editData[name] || ""}
                          onChange={handleInputChange}
                          className="border border-gray-300 rounded-md p-1 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-gray-600">Ariza turi</label>
                      <select
                        name="appealTypeId"
                        value={editData.appealTypeId || ""}
                        onChange={handleInputChange}
                        className="border border-gray-300 rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
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
                      />
                    </div>
                    <div>
                      <label className="text-gray-600">Passport raqami</label>
                      <input
                        type="text"
                        name="passportNumber"
                        placeholder="AB1234567"
                        value={editData.passportNumber || ""}
                        onChange={handleInputChange}
                        className="border border-gray-300 rounded-md p-1 w-full focus:outline-none focus:ring-2 focus:ring-green-500"
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
                        onChange={(opt) => setDocumentStatus(opt)}
                        placeholder="Hujjat holatini tanlang"
                        isSearchable
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
                <button
                  type="button"
                  onClick={handleEditSubmit}
                  disabled={!validateInputs()}
                  className={`w-full p-3 rounded-md transition duration-200 ${validateInputs() ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-400 text-white cursor-not-allowed"}`}
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </Modal>

        {/* Ball Modal */}
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
      </div>
    </div>
  );
}

export default Appeals;

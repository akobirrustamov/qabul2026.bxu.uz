import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ApiCall from "../config/index";
import Select from "react-select";
import { FaUserPlus, FaIdCard, FaPhone, FaMapMarkerAlt, FaGraduationCap, FaSave, FaExclamationTriangle } from "react-icons/fa";
import Loading from './Loading';

function AddStudent() {
    const [phone, setPhone] = useState("+998");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState(""); // success, error, warning
    const [regions, setRegions] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [loadingDistricts, setLoadingDistricts] = useState(false);
    const [appealType, setAppealType] = useState([]);
    const [educationType, setEducationType] = useState([]);
    const [educationForm, setEducationForm] = useState([]);
    const [educationField, setEducationField] = useState([]);
    const [user, setUser] = useState(null);
    const [error, setError] = useState(null);
    const [agentUUID, setAgentUUID] = useState(null);

    const [student, setStudent] = useState({
        firstName: "",
        lastName: "",
        fatherName: "",
        regionId: "",
        districtId: "",
        phone: "",
        passportNumber: "",
        passportPin: "",
        language: true,
        appealTypeId: "",
        educationTypeId: "",
        educationFormId: "",
        educationFieldId: "",
        createdAt: new Date().toISOString(),
    });

    useEffect(() => {
        fetchRegions();
        getAppealType();
        getEducationType();
        localStorage.removeItem("browser_token");
        fetchProfilePath()
    }, []);


    const fetchProfilePath = async () => {
        try {
            const token = localStorage.getItem("access_token");

            if (!token) {
                setError("Token topilmadi. Iltimos, tizimga qayta kiring.");
                setLoading(false);
                return;
            }

            const res = await ApiCall(
                `/api/v1/ambassador/agent-path/${token}`,
                "GET",
                null,
                null,
                true
            );
            console.log(res.data);

            if (res.data) {
                setUser(res.data.agentNumber);
                setAgentUUID(res.data.agent.id);
            } else {
                setError("Foydalanuvchi ma'lumotlari topilmadi.");
            }
        } catch (error) {
            console.error("Profil ma'lumotlarini olishda xatolik:", error);
            setError("Profil ma'lumotlarini yuklashda xatolik yuz berdi.");
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (text, type) => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage("");
            setMessageType("");
        }, 5000);
    };

    const fetchRegions = async () => {
        try {
            const response = await ApiCall("/api/v1/region", "GET", null, null);
            setRegions(
                response.data.map((region) => ({
                    value: region.id,
                    label: region.name,
                }))
            );
        } catch (error) {
            console.error("Error fetching regions:", error);
            showMessage("Viloyatlar yuklanmadi", "error");
        }
    };

    const fetchRegionDistricts = async (regionId) => {
        setLoadingDistricts(true);
        try {
            const response = await ApiCall(
                `/api/v1/district/${regionId}`,
                "GET",
                null,
                null
            );
            setDistricts(
                response.data.map((district) => ({
                    value: district.id,
                    label: district.name,
                }))
            );
        } catch (error) {
            console.error("Error fetching districts:", error);
            showMessage("Tumanlar yuklanmadi", "error");
        } finally {
            setLoadingDistricts(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        let newValue = value;

        if (name === "passportPin") {
            const numericValue = value.replace(/\D/g, "");
            newValue = numericValue.slice(0, 14);
            setStudent({ ...student, passportPin: newValue });
        }
        else if (name === "passportNumber") {
            const formattedValue = value.toUpperCase();
            const letters = formattedValue.slice(0, 2).replace(/[^A-Z]/g, "");
            const numbers = formattedValue.slice(2).replace(/\D/g, "");
            newValue = `${letters}${numbers.slice(0, 7)}`;
            setStudent({ ...student, passportNumber: newValue });
        }
        else if (name === "phone") {
            let cleaned = value.replace(/\D/g, "");

            if (!cleaned.startsWith("998")) {
                cleaned = "998" + cleaned;
            }

            cleaned = cleaned.slice(0, 12);
            newValue = "+" + cleaned;

            setPhone(newValue);
            setStudent({ ...student, phone: newValue });
        }
        else {
            setStudent({ ...student, [name]: newValue });
        }
    };

    const handleSelectChange = (selectedOption, { name }) => {
        setStudent({ ...student, [name]: selectedOption.value });

        if (name === "regionId") {
            fetchRegionDistricts(selectedOption.value);
            setStudent((prev) => ({ ...prev, districtId: "" }));
            setEducationForm([]);
            setEducationField([]);
        } else if (name === "educationTypeId") {
            getEducationForm(selectedOption.value);
            setStudent((prev) => ({
                ...prev,
                educationFormId: "",
                educationFieldId: "",
            }));
        } else if (name === "educationFormId") {
            getEducationField(selectedOption.value);
            setStudent((prev) => ({
                ...prev,
                educationFieldId: "",
            }));
        }
    };

    const getAppealType = async () => {
        try {
            const response = await ApiCall(
                `/api/v1/appeal-type`,
                "GET",
                null,
                null,
                true
            );
            setAppealType(
                response.data.map((type) => ({
                    value: type.id,
                    label: type.name,
                }))
            );
        } catch (error) {
            console.error("Error fetching appeal types:", error);
            showMessage("Ariza turlari yuklanmadi", "error");
        }
    };

    const getEducationType = async () => {
        try {
            const response = await ApiCall(
                `/api/v1/education-type`,
                "GET",
                null,
                null,
                true
            );
            setEducationType(
                response.data.map((type) => ({
                    value: type.id,
                    label: type.name,
                }))
            );
        } catch (error) {
            console.error("Error fetching education types:", error);
            showMessage("Ta'lim turlari yuklanmadi", "error");
        }
    };

    const getEducationField = async (id) => {
        try {
            const response = await ApiCall(
                `/api/v1/education-field/${id}`,
                "GET",
                null,
                null,
                true
            );
            setEducationField(
                response.data
                    .filter((field) => field.isActive === true)
                    .map((field) => ({
                        value: field.id,
                        label: field.name,
                        status: field.isActive,
                    }))
            );
        } catch (error) {
            console.error("Error fetching education fields:", error);
            showMessage("Yo'nalishlar yuklanmadi", "error");
        }
    };

    const getEducationForm = async (id) => {
        try {
            const response = await ApiCall(
                `/api/v1/education-form/active/${id}`,
                "GET",
                null,
                null,
                true
            );
            setEducationForm(
                response.data.map((form) => ({
                    value: form.id,
                    label: form.name,
                }))
            );
        } catch (error) {
            console.error("Error fetching education forms:", error);
            showMessage("Ta'lim shakllari yuklanmadi", "error");
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);

        const phoneRegex = /^\+998\d{9}$/;
        if (!phoneRegex.test(phone)) {
            showMessage("Telefon raqami noto'g'ri formatda!", "error");
            setLoading(false);
            return;
        }

        if (student.passportPin.length !== 14) {
            showMessage("JSHSHIR 14 ta raqamdan iborat bo'lishi kerak!", "error");
            setLoading(false);
            return;
        }

        if (
            !student.firstName ||
            !student.lastName ||
            !student.regionId ||
            !student.districtId ||
            !student.passportNumber ||
            student.passportNumber.length !== 9 ||
            !student.appealTypeId ||
            !student.educationTypeId ||
            !student.educationFormId ||
            !student.educationFieldId
        ) {
            showMessage("Barcha maydonlarni to'ldiring!", "error");
            setLoading(false);
            return;
        }

        try {
            let agentId = user;
            // 1️⃣ Telefon POST
            const postData = { phone, agentId };   // <-- MUHIM!
            const postResponse = await ApiCall(`/api/v1/abuturient`, "POST", postData, null, true);
            console.log(postResponse.data);

            if (postResponse.data.agent.id === agentUUID) {
                // 2️⃣ Boshqa ma'lumotlarni PUT
                const abuturient = { ...student, phone };  // <-- MUHIM!
                const putResponse = await ApiCall(`/api/v1/abuturient`, "PUT", abuturient, null, true);
                console.log(putResponse.data);

                if (putResponse.data.phone === phone) {
                    showMessage("Talaba muvaffaqiyatli qo'shildi!", "success");
                    // tozalash
                    setStudent({ ...student, firstName: "", lastName: "", fatherName: "", regionId: "", districtId: "", phone: "", passportNumber: "", passportPin: "", appealTypeId: "", educationTypeId: "", educationFormId: "", educationFieldId: "" });
                    setPhone("+998");
                    setDistricts([]);
                    setEducationForm([]);
                    setEducationField([]);
                } else {
                    // alert("Bunday seriya yoki JSHSHIR bilan talaba allaqachon mavjud!");
                    showMessage("Ma'lumotlarni saqlashda xatolik", "error");
                }
            } else {
                alert("Bu raqam bilan bunday talaba allaqachon mavjud yoki Bunaqa raqam mavjud emas!");
                showMessage("Talaba yaratishda xatolik", "error");
            }
        } catch (error) {
            console.error("Error saving student:", error);
            if (error.response?.status === 409) {
                showMessage("Bu telefon raqam bilan talaba allaqachon mavjud", "warning");
            } else {
                showMessage("Bunaqa raqam mavjud emas yoki server bilan bog'lanishda xatolik yuz berdi!");
                alert("Bunday seriya yoki JSHSHIR bilan talaba allaqachon mavjud!");
            }
        } finally {
            setLoading(false);
        }
    };


    const customStyles = {
        control: (provided, state) => ({
            ...provided,
            minHeight: "44px",
            borderRadius: "0.5rem",
            borderColor: state.isFocused ? "#3b82f6" : "#d1d5db",
            borderWidth: "2px",
            "&:hover": {
                borderColor: "#3b82f6",
            },
            boxShadow: state.isFocused ? "0 0 0 3px rgba(59, 130, 246, 0.2)" : "none",
            backgroundColor: state.isDisabled ? "#f3f4f6" : "white",
        }),
        option: (provided, state) => ({
            ...provided,
            backgroundColor: state.isSelected ? "#3b82f6" : state.isFocused ? "#e5e7eb" : "white",
            color: state.isSelected ? "white" : "#1f2937",
            padding: "10px 15px",
        }),
        menu: (provided) => ({
            ...provided,
            borderRadius: "0.5rem",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
            zIndex: 9999,
        }),
        placeholder: (provided) => ({
            ...provided,
            color: "#9ca3af",
        }),
    };

    const getMessageClass = () => {
        switch (messageType) {
            case "success":
                return "bg-green-100 border border-green-400 text-green-700";
            case "error":
                return "bg-red-100 border border-red-400 text-red-700";
            case "warning":
                return "bg-yellow-100 border border-yellow-400 text-yellow-700";
            default:
                return "bg-blue-100 border border-blue-400 text-blue-700";
        }
    };

    return (
        <div className='min-h-screen'>
            {loading && <Loading />}
            <div className='flex'>
                <Sidebar />
                <div className='flex-1 p-4 lg:p-6 lg:p-8 ml-0 lg:ml-64'>
                    <div className="max-w-6xl mx-auto">
                        <div className=" p-6 lg:p-8">
                            <div className="flex items-center justify-center mb-8">
                                <div className="bg-indigo-100 p-3 rounded-full mr-4">
                                    <FaUserPlus className="text-3xl text-indigo-600" />
                                </div>
                                <h2 className="text-3xl font-bold text-gray-800">
                                    Talaba Qo'shish
                                </h2>
                            </div>
                            <form onSubmit={handleSave} className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Shaxsiy ma'lumotlar bo'limi */}
                                    <div className="lg:col-span-2">
                                        <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                                            <FaIdCard className="mr-2 text-blue-500" />
                                            Shaxsiy ma'lumotlar
                                        </h3>
                                    </div>

                                    {/* Familiya */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Familiya
                                        </label>
                                        <input
                                            type="text"
                                            name="lastName"
                                            value={student.lastName}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                            required
                                            placeholder="Familiyani kiriting"
                                        />
                                    </div>
                                    {/* Ism */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ism *
                                        </label>
                                        <input
                                            type="text"
                                            name="firstName"
                                            value={student.firstName}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                            required
                                            placeholder="Ismni kiriting"
                                        />
                                    </div>

                                    {/* Sharifi */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Sharifi
                                        </label>
                                        <input
                                            type="text"
                                            name="fatherName"
                                            value={student.fatherName}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                            placeholder="Sharifini kiriting"
                                        />
                                    </div>

                                    {/* Telefon */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Telefon raqami *
                                        </label>
                                        <div className="relative">
                                            <FaPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                name="phone"
                                                value={phone}
                                                onChange={handleInputChange}
                                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                                placeholder="+998901234567"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Hujjatlar bo'limi */}
                                    <div className="lg:col-span-2 ">
                                        <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                                            <FaIdCard className="mr-2 text-blue-500" />
                                            Hujjat ma'lumotlari
                                        </h3>
                                    </div>

                                    {/* Passport */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Passport seriya raqami *
                                        </label>
                                        <input
                                            type="text"
                                            name="passportNumber"
                                            value={student.passportNumber}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                            placeholder="AA1234567"
                                            required
                                        />
                                    </div>

                                    {/* JSHSHIR */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            JSHSHIR *
                                        </label>
                                        <input
                                            type="text"
                                            name="passportPin"
                                            value={student.passportPin}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                                            placeholder="12345678901234"
                                            required
                                        />
                                    </div>

                                    {/* Manzil bo'limi */}
                                    <div className="lg:col-span-2 ">
                                        <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                                            <FaMapMarkerAlt className="mr-2 text-blue-500" />
                                            Manzil
                                        </h3>
                                    </div>

                                    {/* Region */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Viloyat *
                                        </label>
                                        <Select
                                            name="regionId"
                                            value={regions.find(option => option.value === student.regionId)}
                                            onChange={handleSelectChange}
                                            options={regions}
                                            placeholder="Viloyatni tanlang"
                                            isSearchable
                                            styles={customStyles}
                                            required
                                        />
                                    </div>

                                    {/* District */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tuman/Shahar *
                                        </label>
                                        <Select
                                            name="districtId"
                                            value={districts.find(option => option.value === student.districtId)}
                                            onChange={handleSelectChange}
                                            options={districts}
                                            placeholder={loadingDistricts ? "Yuklanmoqda..." : "Tuman/Shaharni tanlang"}
                                            isDisabled={!student.regionId || loadingDistricts}
                                            isSearchable
                                            styles={customStyles}
                                            required
                                        />
                                    </div>

                                    {/* Ta'lim bo'limi */}
                                    <div className="lg:col-span-2 ">
                                        <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                                            <FaGraduationCap className="mr-2 text-blue-500" />
                                            Ta'lim ma'lumotlari
                                        </h3>
                                    </div>

                                    {/* Appeal Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ariza turi *
                                        </label>
                                        <Select
                                            name="appealTypeId"
                                            value={appealType.find(option => option.value === student.appealTypeId)}
                                            onChange={handleSelectChange}
                                            options={appealType}
                                            placeholder="Ariza turini tanlang"
                                            isSearchable
                                            styles={customStyles}
                                            required
                                        />
                                    </div>

                                    {/* Education Type */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ta'lim turi *
                                        </label>
                                        <Select
                                            name="educationTypeId"
                                            value={educationType.find(option => option.value === student.educationTypeId)}
                                            onChange={handleSelectChange}
                                            options={educationType}
                                            placeholder="Ta'lim turini tanlang"
                                            isSearchable
                                            styles={customStyles}
                                            required
                                        />
                                    </div>

                                    {/* Education Form */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Ta'lim shakli *
                                        </label>
                                        <Select
                                            name="educationFormId"
                                            value={educationForm.find(option => option.value === student.educationFormId)}
                                            onChange={handleSelectChange}
                                            options={educationForm}
                                            placeholder={student.educationTypeId ? "Ta'lim shaklini tanlang" : "Avval ta'lim turini tanlang"}
                                            isDisabled={!student.educationTypeId}
                                            isSearchable
                                            styles={customStyles}
                                            required
                                        />
                                    </div>

                                    {/* Education Field */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Yo'nalish *
                                        </label>
                                        <Select
                                            name="educationFieldId"
                                            value={educationField.find(option => option.value === student.educationFieldId)}
                                            onChange={handleSelectChange}
                                            options={educationField}
                                            placeholder={student.educationFormId ? "Yo'nalishni tanlang" : "Avval ta'lim shaklini tanlang"}
                                            isDisabled={!student.educationFormId}
                                            isSearchable
                                            styles={customStyles}
                                            menuPortalTarget={document.body}
                                            menuPosition="fixed"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Save */}
                                <div className="flex justify-end mt-8 ">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <FaSave className="mr-2" />
                                        {loading ? "Saqlanmoqda..." : "Saqlash"}
                                    </button>
                                </div>
                            </form>
                            {message && (
                                <div className={`mb-6 p-4 rounded-lg ${getMessageClass()} flex items-center`}>
                                    {messageType === "error" && <FaExclamationTriangle className="mr-3" />}
                                    <span>{message}</span>
                                    <button
                                        onClick={() => setMessage("")}
                                        className="ml-auto text-lg font-bold hover:opacity-70"
                                    >
                                        x
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AddStudent;
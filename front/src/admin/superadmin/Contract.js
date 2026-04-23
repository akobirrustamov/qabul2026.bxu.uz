import React, { useState, useEffect } from "react";
import ApiCall, { baseUrl } from "../../config/index";
import Sidebar from "./Sidebar";
import Rodal from "rodal";
import "rodal/lib/rodal.css";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Contract = () => {
    const [file, setFile] = useState(null);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [amountModalIsOpen, setAmountModalIsOpen] = useState(false)
    const [contractFiles, setContractFiles] = useState([]);
    const [amount, setAmount] = useState(null)
    const [isLoading, setIsLoading] = useState(false)
    const navigate = useNavigate();

    const [studentIdNumber, setStudentIdNumber]=useState(null)
    const [student, setStudent] = useState(null)
    const [input, setInput] = useState(false)
    const [addPaymet, setAddPaymet] = useState(null)
    // Fetch contract files on component mount
    useEffect(() => {
        fetchContractFiles();
        fetchContractAmount();
    }, []);
    const handleAdd =()=>{
        setInput(true)
    }
    const handleHidden = ()=>{
        setInput(false)
    }

    const handleSave =async ()=>{
        if (addPaymet==null || studentIdNumber<0){
            return;
        }
        let obj={
            id: student.id,
            fullName: student.fullName,
            level:student.level,
            hemisId:student.hemisId,
            amount:student.amount,
            payment: addPaymet,
            debt: student.debt,

        }
        try {
            const response = await ApiCall('/api/v1/contract-amount/student/'+studentIdNumber, 'POST', obj, null, true);
            handleSearchStudent()
        } catch (error) {
            console.error("Error fetching contract amount:", error);
            toast.error("Kontrakt summasini yuklashda xatolik yuz berdi");
        }
        setInput(false)
    }
    const fetchContractFiles = async () => {
        try {
            setIsLoading(true);
            const response = await ApiCall('/api/v1/contract-file', 'GET', null, null, true);
            setContractFiles(response.data);
        } catch (error) {
            console.error("Error fetching contract files:", error);
            toast.error("Kontrakt fayllarini yuklashda xatolik yuz berdi");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchContractAmount = async () => {
        try {
            const response = await ApiCall('/api/v1/contract-amount', 'GET', null, null, true);
            setAmount(response.data.amount);
        } catch (error) {
            console.error("Error fetching contract amount:", error);
            toast.error("Kontrakt summasini yuklashda xatolik yuz berdi");
        }
    };
    const handleSearchStudent = async () => {
        if (studentIdNumber==null|| studentIdNumber.length!=12 || studentIdNumber<0){
            return;
        }
        try {
            const response = await ApiCall('/api/v1/contract-amount/student/'+studentIdNumber, 'GET', null, null, true);
            setStudent(response.data);
            alert(JSON.stringify(response.data))
        } catch (error) {
            console.error("Error fetching contract amount:", error);
            toast.error("Kontrakt summasini yuklashda xatolik yuz berdi");
        }
    };

    const uploadImage = async (file, prefix) => {
        const formData = new FormData();
        formData.append('photo', file);
        formData.append('prefix', prefix);

        try {
            const response = await ApiCall('/api/v1/file/upload', 'POST', formData, null, true);
            toast.success("Fayl muvaffaqiyatli yuklandi");
            return response.data; // Return the UUID of the uploaded file
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Faylni yuklashda xatolik yuz berdi");
            throw error;
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            const uuid = await uploadImage(file, "/contract");
            await ApiCall('/api/v1/contract-file/' + uuid, 'GET', null, null, true);
            fetchContractFiles(); // Refresh the list after upload
            closeModal();
            toast.success("Kontrakt fayli muvaffaqiyatli saqlandi");
        } catch (error) {
            console.error("Error saving file:", error);
            toast.error("Kontrakt faylini saqlashda xatolik yuz berdi");
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const openModal = () => setModalIsOpen(true);
    const closeModal = () => setModalIsOpen(false);

    // Function to extract the file name after the `_` symbol
    const getFileNameAfterUnderscore = (fileName) => {
        return fileName.split('_')[1] || fileName; // Return the part after `_` or the full name if `_` is not found
    };

    const handleDownload = async (id) => {
        try {
            setIsLoading(true);
            const response = await fetch(`${baseUrl}/api/v1/file/getFile/${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/xlsx',
                },
            });
            if (!response.ok) {
                throw new Error("Failed to download file");
            }
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = 'contract.xlsx'; // Change the name as desired
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);
            toast.success("Fayl muvaffaqiyatli yuklab olindi");
        } catch (error) {
            console.error("Error downloading file:", error);
            toast.error("Faylni yuklab olishda xatolik yuz berdi");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAmountChange = (e) => {
        let value = parseInt(e.target.value, 10);
        if (value >= 10 && value <= 100) {
            setAmount(value);
        }
    };

    const handleAmountSubmit = async (e) => {
        e.preventDefault();
        try {
            setIsLoading(true);
            await ApiCall('/api/v1/contract-amount', 'POST', { amount }, null, true);
            fetchContractAmount();
            closeAmountModal();
            toast.success("Kontrakt summasi muvaffaqiyatli o'zgartirildi");
        } catch (error) {
            console.error("Error saving contract amount:", error);
            toast.error("Kontrakt summasini o'zgartirishda xatolik yuz berdi");
        } finally {
            setIsLoading(false);
        }
    };

    const openAmountModal = () => setAmountModalIsOpen(true);
    const closeAmountModal = () => setAmountModalIsOpen(false);

    return (
        <div>
            <Sidebar />
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />
            {isLoading ?
                <div className="p-10 pb-1 sm:ml-64">
                    Yuklanmoqda...
                </div>
                :
                <div>
                    <div className="p-10 pb-1 sm:ml-64">
                        <h2 className="text-2xl font-bold text-gray-800 md:text-3xl xl:text-4xl">
                            Kontrakt fayllari
                        </h2>
                        <div className={"border-2 my-2 rounded-md"}>


                            <button onClick={openAmountModal} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2">
                                Kontrakt Foiz
                            </button>


                            <div className="p-4 bg-gray-100 mt-4">
                                <p className="text-lg">Joriy kontrakt foizi: <strong>{amount} %</strong></p>
                            </div>
                        </div>


                        <div className={'border-2 my-2 rounded-md'}>




                            <div>
                                <input type={"number"} value={studentIdNumber} onChange={(e)=>setStudentIdNumber(e.target.value)} className={"form-input p-2 border-2 rounded-sm"}  placeholder={"Talaba hemis raqami"} />
                                <button onClick={handleSearchStudent} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded ml-2">
                                    Qidiruv
                                </button>
                            </div>
                            <div className="p-4 bg-gray-100 mt-4">
                                {student ? (
                                    <div className="space-y-2">
                                        <p className="text-lg font-semibold">Talaba ma'lumotlari:</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <p><span className="font-medium">To'liq ismi:</span> {student.fullName}</p>
                                            <p><span className="font-medium">Kursi:</span> {student.level}</p>
                                            <p><span className="font-medium">HEMIS ID:</span> {student.hemisId}</p>
                                            <p><span className="font-medium">Kontrakt summasi:</span> {student?.amount?.toLocaleString()} so'm</p>
                                            <div>
                                                <p className="text-gray-700">
                                                    <span className="font-medium">To'langan summa:</span>
                                                    <span className="ml-1 text-green-600">{student?.payment?.toLocaleString()} so'm</span>
                                                </p>
                                                {!input && (
                                                    <button
                                                        onClick={handleAdd}
                                                        className="px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors border-2 border-blue-500"
                                                    >
                                                        +
                                                    </button>
                                                )}
                                                {input && (
                                                    <button
                                                        onClick={handleHidden}
                                                        className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors border-2 border-red-500"
                                                    >
                                                        -
                                                    </button>
                                                )}
                                                {input && (
                                                    <input
                                                        onChange={(e) => {setAddPaymet(e.target.value)}}
                                                        placeholder="To'langan summani kiriting:"
                                                        type="number"
                                                        className="px-3 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                )}
                                                {input && (
                                                    <button
                                                        onClick={handleSave}
                                                        className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                                                    >
                                                        Save
                                                    </button>
                                                )}
                                            </div>
                                            <p><span className="font-medium">Qarzdorlik:</span> {student?.debt?.toLocaleString()} so'm</p>
                                            <p><span className="font-medium">Qo'shimcha:</span> {student?.extra?.toLocaleString()} so'm</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-lg">Talaba ma'lumotlari topilmadi</p>
                                )}
                            </div>
                        </div>

                        {/* Table to display contract files */}
                        <div className="mt-8">
                            <button onClick={openModal} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 my-2 rounded">
                                Fayl yuklash
                            </button>
                            <table className="min-w-full bg-white border border-gray-300">
                                <thead>
                                <tr>
                                    <th className="py-2 px-4 border-b">Fayl nomi</th>
                                    <th className="py-2 px-4 border-b">Yuklangan vaqti</th>
                                    <th className="py-2 px-4 border-b">Harakatlar</th>
                                </tr>
                                </thead>
                                <tbody>
                                {contractFiles?.sort((a, b) => new Date(b?.createdAt) - new Date(a?.createdAt))?.map((file) => (
                                        <tr key={file.id} className="hover:bg-gray-50">
                                            <td className="py-2 px-4 border-b">
                                                {getFileNameAfterUnderscore(file.file.name)}
                                            </td>
                                            <td className="py-2 px-4 border-b">
                                                {new Date(file.createdAt).toLocaleString()}
                                            </td>
                                            <td className="py-2 px-4 border-b">
                                                <button
                                                    onClick={() => handleDownload(file.file.id)}
                                                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded"
                                                >
                                                    Yuklab olish
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Modal for file upload */}
                    <Rodal visible={modalIsOpen} onClose={closeModal} width={450} height={300}>
                        <h2 className="text-2xl mb-4">Kontrakt fayli qo'shish</h2>
                        <form onSubmit={handleFormSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Fayl (.xlsx)</label>
                                <input
                                    type="file"
                                    onChange={handleFileChange}
                                    accept=".xlsx"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="flex items-center justify-evenly">
                                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                    Saqlash
                                </button>
                                <button type="button" onClick={closeModal} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                    Bekor qilish
                                </button>
                            </div>
                        </form>
                    </Rodal>


                    {/* Modal for contract amount */}
                    <Rodal visible={amountModalIsOpen} onClose={closeAmountModal} width={400} height={250}>
                        <h2 className="text-2xl mb-4">Kontrakt summasini o'zgartirish</h2>
                        <form onSubmit={handleAmountSubmit}>
                            <div className="mb-4">
                                <label className="block text-gray-700 text-sm font-bold mb-2">Summani kiriting (10-100)</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    min="10"
                                    max="100"
                                    className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    required
                                />
                            </div>
                            <div className="flex items-center justify-evenly">
                                <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                                    Saqlash
                                </button>
                                <button type="button" onClick={closeAmountModal} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                                    Bekor qilish
                                </button>
                            </div>
                        </form>
                    </Rodal>
                </div>
            }
        </div>
    );
};

export default Contract;
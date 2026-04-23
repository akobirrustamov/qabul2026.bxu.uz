import React, { useEffect, useState } from "react";
import Sidebar from './Sidebar';
import ApiCall from "../config/index";
import Loading from "./Loading";
import {
    Instagram,
    Users,
    UserPlus,
    FileText,
    Calendar,
    Edit3,
    BarChart3,
    ExternalLink,
    RefreshCw,
    CheckCircle,
    XCircle,
    Link as LinkIcon
} from "lucide-react";

function Instagramcom() {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState(null);
    const [instagramData, setInstagramData] = useState(null);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState({
        url: "",
        description: ""
    });

    const fetchProfile = async () => {
        try {
            const token = localStorage.getItem("access_token");
            if (!token) {
                setLoading(false);
                return;
            }
            const res = await ApiCall(`/api/v1/agent/me/${token}`, "GET", null, null, true);
            setProfile(res.data);
            fetchInstagram(res.data.id);
        } catch (error) {
            console.error("Profil ma'lumotlarini olishda xatolik:", error);
        }
    };

    const fetchInstagram = async (agentId) => {
        setLoading(true);
        try {
            const res = await ApiCall(`/api/v1/ambassador-instagram/${agentId}`, "GET", null, null, true);
            setInstagramData(res.data);
            setFormData({
                url: res.data.url || "",
                description: res.data.description || ""
            });
        } catch (error) {
            console.error("Instagram ma'lumotlarini olishda xatolik:", error);
            setInstagramData(null);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Faqat POST so'rovini yuboramiz (PUT emas)
            await ApiCall(`/api/v1/ambassador-instagram/${profile.id}`, "POST", formData, null, true);
            setEditing(false);
            fetchInstagram(profile.id);
        } catch (error) {
            console.error("Ma'lumotlarni saqlashda xatolik:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    if (loading) return <Loading />;

    return (
        <div className="min-h-screen">
            <Sidebar />
            <div className="ml-0 lg:ml-64 pt-16 pl-4">
                <div className="max-w-6xl mx-auto">
                    {/* Sarlavha va Amallar */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                                <Instagram className="mr-3 text-pink-600" size={32} />
                                Instagram Profil
                            </h1>
                            <p className="text-gray-600 mt-2">
                                Instagram profilingizni boshqaring va monitoring qiling
                            </p>
                        </div>

                        <div className="flex mt-4 lg:mt-0">
                            {!instagramData && (
                                <button
                                    onClick={() => setEditing(!editing)}
                                    className="flex items-center bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mr-3"
                                >
                                    <Edit3 size={18} className="mr-2" />
                                    {editing ? 'Bekor qilish' : 'Profil Qo\'shish'}
                                </button>
                            )}
                            <button
                                onClick={() => fetchInstagram(profile.id)}
                                className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                            >
                                <RefreshCw size={18} className="mr-2" />
                                Yangilash
                            </button>
                        </div>
                    </div>

                    {!instagramData && !editing ? (
                        // Profil mavjud emas - yangi yaratish uchun
                        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                            <Instagram size={64} className="mx-auto text-gray-300 mb-4" />
                            <h2 className="text-2xl font-semibold text-gray-700 mb-2">Instagram Profil Qo'shilmagan</h2>
                            <p className="text-gray-600 mb-6">Instagram profilingizni qo'shing va monitoringni boshlang</p>
                            <button
                                onClick={() => setEditing(true)}
                                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
                            >
                                Profil Qo'shish
                            </button>
                        </div>
                    ) : editing ? (
                        // Tahrirlash shakli
                        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
                            <h2 className="text-xl font-semibold text-gray-800 mb-6">
                                {instagramData ? 'Profilni Yangilash' : 'Yangi Profil Qo\'shish'}
                            </h2>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-6">
                                    <label className="block text-gray-700 mb-2 font-medium">Instagram Profil URL</label>
                                    <div className="flex items-center">
                                        <span className="bg-gray-100 text-gray-500 px-4 py-3 rounded-l-lg border border-r-0">
                                            instagram.com/
                                        </span>
                                        <input
                                            type="text"
                                            value={formData.url}
                                            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                            className="flex-1 p-3 border rounded-r-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="foydalanuvchi_nomi"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="mb-6">
                                    <label className="block text-gray-700 mb-2 font-medium">Profil Tavsifi</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        rows="4"
                                        placeholder="Instagram profilingiz haqida qisqacha..."
                                    ></textarea>
                                </div>

                                <div className="flex justify-end">
                                    <button
                                        type="button"
                                        onClick={() => setEditing(false)}
                                        className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg mr-3"
                                    >
                                        Bekor qilish
                                    </button>
                                    <button
                                        type="submit"
                                        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                                    >
                                        Saqlash
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        // Profil ma'lumotlarini ko'rsatish
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                                {/* Asosiy profil ma'lumotlari */}
                                <div className="bg-white rounded-2xl shadow-lg p-6 lg:col-span-2">
                                    <div className="flex items-center mb-6">
                                        <div className="w-16 h-16 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                                            {profile?.firstName?.charAt(0)}{profile?.lastName?.charAt(0)}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">{profile?.firstName} {profile?.lastName}</h2>
                                            <p className="text-gray-600">Ambassador</p>
                                        </div>
                                    </div>

                                    <div className="mb-6">
                                        <div className="flex items-center text-gray-700 mb-2">
                                            <LinkIcon size={18} className="mr-2" />
                                            <span className="font-medium">Instagram Profili:</span>
                                        </div>
                                        <a
                                            href={`https://instagram.com/${instagramData.url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-500 hover:underline flex items-center"
                                        >
                                            @{instagramData.url}
                                            <ExternalLink size={16} className="ml-1" />
                                        </a>
                                    </div>

                                    <div className="mb-4">
                                        <div className="flex items-center text-gray-700 mb-2">
                                            <FileText size={18} className="mr-2" />
                                            <span className="font-medium">Tavsif:</span>
                                        </div>
                                        <p className="text-gray-600">{instagramData.description || "Tavsif qo'shilmagan"}</p>
                                    </div>

                                    <div className="flex items-center text-gray-700">
                                        <Calendar size={18} className="mr-2" />
                                        <span className="font-medium">Qo'shilgan sana:</span>
                                        <span className="ml-2 text-gray-600">
                                            {new Date(instagramData.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Statistikalar */}
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                                        <BarChart3 size={20} className="mr-2" />
                                        Statistikalar
                                    </h3>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <FileText size={18} className="text-blue-500 mr-2" />
                                                <span className="text-gray-700">Postlar</span>
                                            </div>
                                            <span className="font-semibold">{instagramData.posts || 0}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <Users size={18} className="text-green-500 mr-2" />
                                                <span className="text-gray-700">Followers</span>
                                            </div>
                                            <span className="font-semibold">{instagramData.followers || 0}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                <UserPlus size={18} className="text-purple-500 mr-2" />
                                                <span className="text-gray-700">Following</span>
                                            </div>
                                            <span className="font-semibold">{instagramData.following || 0}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center">
                                                {instagramData.active ? (
                                                    <CheckCircle size={18} className="text-green-500 mr-2" />
                                                ) : (
                                                    <XCircle size={18} className="text-red-500 mr-2" />
                                                )}
                                                <span className="text-gray-700">Holati</span>
                                            </div>
                                            <span className={`font-semibold ${instagramData.active ? 'text-green-600' : 'text-red-600'}`}>
                                                {instagramData.active ? 'Faol' : 'Nofaol'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Monitoring bo'limi */}
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h3 className="text-xl font-semibold text-gray-800 mb-6">Monitoring</h3>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <div className="text-blue-500 font-bold text-2xl mb-2">{instagramData.posts || 0}</div>
                                        <div className="text-blue-700">Postlar</div>
                                    </div>

                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="text-green-500 font-bold text-2xl mb-2">{instagramData.followers || 0}</div>
                                        <div className="text-green-700">Followers</div>
                                    </div>

                                    <div className="bg-purple-50 p-4 rounded-lg">
                                        <div className="text-purple-500 font-bold text-2xl mb-2">{instagramData.following || 0}</div>
                                        <div className="text-purple-700">Following</div>
                                    </div>
                                </div>

                                <div className="mt-6 text-center">
                                    <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-2 rounded-lg">
                                        Batafsil Ko'rsatish
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Instagramcom;
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import { Phone, Video, MessageSquare, MoreVertical, Search } from "lucide-react";

function Instagram() {
    const [searchTerm, setSearchTerm] = useState("");

    const contacts = [
        {
            name: "Barotov Shuxrat",
            phone: "+998955251737",
            online: true
        },
        {
            name: "Behruz",
            phone: "+998998999777",
            online: true
        },
        {
            name: "Rusatamov Akobir",
            phone: "+998942488434",
            online: true
        },

    ];

    const filteredContacts = contacts.filter(contact =>
        contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.phone.includes(searchTerm)
    );

    return (
        <div className="min-h-screen">
            <Sidebar />

            <div className="ml-0 lg:ml-64 pl-4 pt-16">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">Aloqa</h1>
                    <p className="text-gray-600 mb-8">Sizning aloqa ro'yxatingiz</p>

                    {/* Qidiruv qutisi */}
                    <div className="bg-white rounded-xl shadow-sm p-3 mb-8 flex items-center">
                        <Search className="text-gray-400 mx-2" size={20} />
                        <input
                            type="text"
                            placeholder="Aloqa qidirish..."
                            className="w-full p-2 outline-none bg-transparent"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Aloqa kartalari */}
                    <div className="grid gap-5 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        {filteredContacts.map((contact, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                            >
                                <div className="p-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center">
                                            <div className="relative">
                                                <div className="w-14 h-14 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                                                    {contact.name.charAt(0)}
                                                </div>
                                                <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${contact.online ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                            </div>
                                            <div className="ml-4">
                                                <h2 className="text-lg font-semibold text-gray-800">{contact.name}</h2>
                                                <p className={`text-sm ${contact.online ? 'text-green-600' : 'text-gray-500'}`}>
                                                    {contact.online ? 'Onlayn' : contact.lastSeen}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-gray-600 text-sm mb-1">Telefon raqami</p>
                                        <p className="text-gray-800 font-medium">{contact.phone}</p>
                                    </div>

                                    <div className="flex justify-between mt-6">
                                        <a
                                            href={`tel:${contact.phone}`}
                                            className="flex-1 mr-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg flex items-center justify-center transition-colors"
                                        >
                                            <Phone size={18} className="mr-2" />
                                            Qo'ng'iroq
                                        </a>

                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredContacts.length === 0 && (
                        <div className="text-center py-10">
                            <p className="text-gray-500">Hech qanday aloqa topilmadi</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Instagram;
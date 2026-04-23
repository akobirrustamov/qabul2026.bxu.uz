import React, { useEffect, useState } from "react";
import ApiCall, { baseUrl } from "../../config";
import "react-responsive-modal/styles.css";
import Sidebar from "./Sidebar";
import Modal from "react-responsive-modal";

function SmsTemplates() {
  const [name, setName] = useState("");
  const [smsId, setSmsId] = useState("");
  const [smsTemplates, setSmsTemplates] = useState([]);
  const [modal, setModal] = useState(false);

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
  const fetchSmsTemplate = async () => {
    try {
      const res = await ApiCall(
        `/api/v1/sms-templates`,
        "GET",
        null,
        null,
        true,
      );
      console.log(res.data);

      setSmsTemplates(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSmsTemplate();
  }, []);

  const handleEditClick = (sms) => {
    setSmsId(sms.id);
    setModal(true);
  };

  const handleSave = async () => {
    try {
      const res = await ApiCall(`/api/v1/sms-templates/${smsId}`, "PUT", {
        name,
      });
      fetchSmsTemplate();
    } catch (e) {
      console.log(e);
    } finally {
      setModal(false);
    }
  };

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
            Sms Namunalar
          </h1>

          {/* ── table ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b-2 border-slate-100 bg-slate-50">
                  {[
                    "№",
                    "Nomi",
                    "Namuna",
                    "Statusi",
                    "Birikkan vaqt",
                    "Amallar",
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
                {smsTemplates.map((sms, idx) => (
                  <tr
                    key={sms.id ?? idx}
                    className="hover:bg-blue-50/40 transition"
                  >
                    <td className="px-3 py-2.5 text-slate-400 font-semibold text-xs">
                      {idx + 1}
                    </td>

                    <td className="px-3 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                      {sms.name}
                    </td>
                    <td className=" px-3 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                      <p className="text-wrap">{sms.template}</p>
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                      {sms.status}
                    </td>
                    <td className="px-3 py-2.5 font-bold text-slate-800 whitespace-nowrap">
                      {sms.updatedAt}
                    </td>

                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditClick(sms)}
                          title="Tahrirlash"
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition"
                        >
                          <IconEdit />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {smsTemplates.length === 0 && (
                  <tr>
                    <td
                      colSpan={16}
                      className="text-center py-16 text-slate-300 text-sm font-semibold"
                    >
                      Hech qanday sms namunalar topilmadi
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit */}
        <Modal
          open={modal}
          onClose={() => setModal(false)}
          center
          animationDuration={300}
        >
          <div className="p-7 w-[700px] max-w-full">
            <h2 className="text-lg font-extrabold text-slate-800 mb-5">
              ✏️ Tahrirlash
            </h2>

            <div className="mt-6">
              <input
                type="text"
                id="nomi"
                placeholder="nomi"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                className="block border p-2 mt-2 w-full"
              />
            </div>

            <button
              onClick={handleSave}
              className="w-full mt-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm transition active:scale-95"
            >
              Saqlash
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default SmsTemplates;

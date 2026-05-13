import React, { useEffect, useState } from "react";
import Sidebar from "../Sidebar";
import { Modal } from "react-responsive-modal";
import ApiCall from "../../../config";
import "react-responsive-modal/styles.css";

function Agents() {
  const [agents, setAgents] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    login: "",
    password: "",
  });

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const response = await ApiCall("/api/v1/agent", "GET", null, null, true);
      setAgents(response.data);
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      const url = "/api/v1/agent";
      const updateUrl = `${url}/${editingId}`;

      if (editingId) {
        // Обновление агента
        await ApiCall(updateUrl, "PUT", formData, null, true);
      } else {
        // Новый агент
        await ApiCall(url, "POST", formData, null, true);
      }

      setIsModalOpen(false);
      setFormData({ name: "", login: "", password: "" });
      setEditingId(null);

      await fetchAgents();
    } catch (error) {
      console.error("Error saving agent:", error);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      name: record.name,
      login: record.phone || record.login,
      password: "",
    });
    setEditingId(record.id);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setFormData({ name: "", login: "", password: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const isBotAgent = (phone) => /^[0-9]+$/.test(phone);

  const botAgents = agents.filter((agent) => isBotAgent(agent?.agent?.phone));
  const siteAgents = agents.filter((agent) => !isBotAgent(agent?.agent?.phone));

  const renderAgentTable = (title, agentList) => (
    <div className="mb-10">
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <table className="min-w-full table-auto border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 px-4 py-2">N%</th>
            <th className="border border-gray-300 px-4 py-2">Ism</th>
            <th className="border border-gray-300 px-4 py-2">Telefon(Login)</th>
            <th className="border border-gray-300 px-4 py-2">Havola</th>
            <th className="border border-gray-300 px-4 py-2">Amallar</th>
          </tr>
        </thead>
        <tbody>
          {agentList.map((agent, index) => (
            <tr key={agent.id} className="hover:bg-gray-100">
              <td className="border border-gray-300 px-4 py-2 text-center">
                {index + 1}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {agent?.agent?.name}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                {agent?.agent?.phone}
              </td>
              <td className="border border-gray-300 px-4 py-2">
                https://qabul.bxu.uz/{agent.agentNumber}
              </td>
              <td className="border border-gray-300 px-4 py-2 flex gap-2 justify-center">
                <button
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                  onClick={() => handleEdit(agent?.agent)}
                >
                  Tahrirlash
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <Sidebar />
      <div className="p-10 sm:ml-64">
        {/* Agents Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl md:text-4xl xl:text-5xl">
              Agents/Ambassador
            </h2>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={openAddModal}
            >
              Add Agent
            </button>
          </div>

          <div className="mt-4">
            {renderAgentTable(
              "🧑‍💻 Sayt orqali tayinlangan agentlar",
              siteAgents
            )}
            {renderAgentTable("🤖 Bot orqali tayinlangan agentlar", botAgents)}
          </div>
        </div>

        {/* Modal for Add/Edit */}
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} center>
          <div>
            <h2 className="text-xl mb-4">
              {editingId ? "Edit Agent" : "Add Agent"}
            </h2>
            <div className="mb-4">
              <label className="block mb-2">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Login</label>
              <input
                type="text"
                name="login"
                value={formData.login}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full border border-gray-300 p-2"
              />
            </div>
            <button
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default Agents;

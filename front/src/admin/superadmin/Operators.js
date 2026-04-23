import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { Modal } from "react-responsive-modal";
import ApiCall from "../../config";
import "react-responsive-modal/styles.css";
import { useNavigate } from "react-router-dom";

function Operators() {
  const navigate = useNavigate();
  const [operators, setOperators] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    login: "",
    password: "",
    callCenterNumber: null,
  });
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [confirmationDetails, setConfirmationDetails] = useState({});

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await ApiCall(
        "/api/v1/operator",
        "GET",
        null,
        null,
        true,
      );
      setOperators(response.data);
    } catch (error) {
      console.error("Error fetching operators:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    try {
      const url = "/api/v1/operator";
      const updateUrl = `${url}/${editingId}`;

      if (editingId) {
        await ApiCall(updateUrl, "PUT", formData, null, true);
      } else {
        await ApiCall(url, "POST", formData, null, true);
      }

      setIsModalOpen(false);
      setFormData({
        name: "",
        login: "",
        password: "",
        callCenterNumber: null,
      });
      setEditingId(null);
      await fetchOperators();
    } catch (error) {
      console.error("Error saving operator:", error);
    }
  };

  const handleEdit = (record) => {
    setFormData({
      name: record.name,
      login: record.phone || record.login,
      password: "",
      callCenterNumber: record.callCenterNumber || null,
    });
    setEditingId(record.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await ApiCall(`/api/v1/operator/${id}`, "DELETE", null, null, true);
      fetchOperators();
    } catch (error) {
      console.error("Error deleting operator:", error);
    }
  };

  const openAddModal = () => {
    setFormData({ name: "", login: "", password: "" });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleStatusStaff = async (id, isChecked, name) => {
    setConfirmationDetails({ id, isChecked, name });
    setIsConfirmationModalOpen(true);
  };

  const confirmStatusChange = async (confirm) => {
    if (!confirm) {
      setIsConfirmationModalOpen(false);
      return;
    }

    try {
      const { id, isChecked } = confirmationDetails;
      const url = `/api/v1/admin/status/${id}`;
      const payload = { active: isChecked };
      await ApiCall(url, "PUT", payload, null, true);

      fetchOperators();
    } catch (error) {
      console.error(
        `Error updating status for ${confirmationDetails.name}:`,
        error,
      );
    } finally {
      setIsConfirmationModalOpen(false);
    }
  };

  return (
    <div>
      <Sidebar />
      <div className="p-10 sm:ml-64">
        {/* Operators Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-3xl md:text-4xl xl:text-5xl">Operators</h2>
            <button
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              onClick={openAddModal}
            >
              Add Operator
            </button>
          </div>

          <table className="min-w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-200">
                <th className="border border-gray-300 px-4 py-2">#</th>
                <th className="border border-gray-300 px-4 py-2">Name</th>
                <th className="border border-gray-300 px-4 py-2">Phone</th>
                <th className="border border-gray-300 px-4 py-2">
                  Call Center Number
                </th>
                <th className="border border-gray-300 px-4 py-2">
                  Malumot kiritish
                </th>
                <th className="border border-gray-300 px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((operator, index) => (
                <tr key={operator.id} className="hover:bg-gray-100">
                  <td className="border border-gray-300 px-4 py-2 text-center">
                    {index + 1}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {operator.name}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {operator.phone}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {operator.callCenterNumber}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    <input
                      type="checkbox"
                      checked={operator.roles.some(
                        (item) => item.name === "ROLE_DATA_MANAGER",
                      )}
                      onChange={(e) =>
                        handleStatusStaff(
                          operator.id,
                          e.target.checked,
                          operator.name,
                        )
                      }
                    />
                  </td>
                  <td className="border border-gray-300 px-4 py-2 flex gap-2 justify-center">
                    <button
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                      onClick={() => handleEdit(operator)}
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      onClick={() => handleDelete(operator.id)}
                    >
                      Delete
                    </button>
                    <button
                      className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                      onClick={() => navigate(`/main/operators/${operator.id}`)}
                    >
                      Ko'rish
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal for Add/Edit */}
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)} center>
          <div>
            <h2 className="text-xl mb-4">
              {editingId ? "Edit" : "Add"} Operator
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
              <label className="block mb-2">Call Center Number</label>
              <input
                type="number"
                name="callCenterNumber"
                value={formData.callCenterNumber || ""}
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

        {/* Confirmation Modal */}
        <Modal
          open={isConfirmationModalOpen}
          onClose={() => setIsConfirmationModalOpen(false)}
          center
        >
          <div>
            <h2 className="text-xl mb-4 pr-4">
              {confirmationDetails?.name?.toUpperCase()} ning statusini rostdan
              ham o'zgartirmoqchimisiz?
            </h2>
            <div className="flex justify-between gap-4">
              <button
                className="bg-red-500 text-white px-6 py-2 rounded hover:bg-red-600"
                onClick={() => confirmStatusChange(false)}
              >
                No
              </button>
              <button
                className="bg-green-500 text-white px-6 py-2 rounded hover:bg-green-600"
                onClick={() => confirmStatusChange(true)}
              >
                Yes
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
}

export default Operators;

import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ApiCall from "../../config";
import {toast} from "react-toastify";

// Icons SVG components
const HomeIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
);

const GridIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
    </svg>
);

const BookIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
);

const FileIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const TransferIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </svg>
);

const UserIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);

const UsersIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.67 3.137a4 4 0 00-5.665-5.665" />
    </svg>
);

const SettingsIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

const LogoutIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const CalendarIcon = ({ className }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);

// Menu items configuration
const menuItems = [
  {
    path: "/manager/home",
    label: "Bosh sahifa",
    icon: HomeIcon,
  },
  {
    path: "/manager/statistic",
    label: "CrmStatistika",
    icon: HomeIcon,
  }, 


  {
    path: "/manager/appeal",
    label: "Kelib tushgan arizalar",
    icon: FileIcon,
    // badge: 0, // Example badge count
  },
  {
    path: "/manager/transform-education",
    label: "O'qishni ko'chirish ",
    icon: TransferIcon,
    // badge: 0,
  },
  {
    path: "/manager/SecondStudy",
    label: "2 Mutahassislik ",
    icon: BookIcon,
  },
  {
    path: "/manager/staff",
    label: "Xodimlar",
    icon: UserIcon,
  },
  {
    path: "/manager/operator",
    label: "Operatorlar",
    icon: UsersIcon,
  },

  {
    path: "/manager/settings",
    label: "Parol",
    icon: SettingsIcon,
  },
];

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path) => {
    if (path === "/manager/") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
    useEffect(() => {
        fetchAdmin();
    }, []);

    const fetchAdmin = async () => {
        const token = localStorage.getItem("access_token");
        try {
            const response = await ApiCall('/api/v1/auth/me/' + token, 'GET', null, null);

            if (response.data===undefined){
                navigate("/")
            }

            if (response?.data?.roles[0]?.name!=="ROLE_DATA_MANAGER"){
                navigate("/")
            }
        } catch (error) {
            navigate("/")
            console.error("Error fetching agent:", error);
            toast.error("Agent ma'lumotlarini yuklashda xato yuz berdi");
        }
    };
  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && !event.target.closest("#sidebar")) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [sidebarOpen]);

  return (
      <>
        {/* Mobile Toggle Button */}
        <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="fixed top-4 left-2 z-50 p-2 text-gray-600 rounded-lg lg:hidden hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition-all duration-300"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Desktop Toggle Button */}
        <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:fixed top-4 -right-12 z-40 p-2 bg-gray-800 text-white rounded-r-lg hover:bg-gray-700 transition-all duration-300"
        >
          <svg className={`w-5 h-5 transform transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={collapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>

        {/* Overlay for mobile */}
        {sidebarOpen && (
            <div
                className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )}

        {/* Sidebar */}
        <aside
            id="sidebar"
            className={`fixed top-0 left-0 z-40 h-screen transition-all duration-300 ease-in-out bg-gradient-to-b from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-xl
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          ${collapsed ? "lg:w-32" : "lg:w-64"}
          lg:translate-x-0`}
        >
          {/* Logo */}
          <div className={`flex items-center ${collapsed ? "justify-center px-1" : "justify-between px-2"} py-2 border-b border-gray-200 dark:border-gray-700`}>
            {!collapsed && (
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">Q</span>
                  </div>
                  <span className="text-xl font-bold text-gray-800 dark:text-white">Qabul 2026</span>
                </div>
            )}
            {collapsed && (
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">Q</span>
                </div>
            )}
            {!collapsed && (
                <button
                    onClick={() => setCollapsed(true)}
                    className="hidden lg:block p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
            )}
          </div>

          {/* Menu Items */}
          <div className=" py-6 overflow-y-auto h-[calc(100vh-5rem)]">
            <ul className="space-y-2">
              {menuItems.map((item, index) => {
                const Icon = item.icon;
                const active = isActive(item.path);

                return (
                    <li key={index}>
                      <Link
                          to={item.path}
                          className={`flex items-center p-2 rounded-xl transition-all duration-200 group
                      ${active
                              ? "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 text-blue-600 dark:text-blue-400 border-l-4 border-blue-500"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }
                      ${collapsed ? "justify-center" : ""}
                    `}
                          onClick={() => setSidebarOpen(false)}
                      >
                        <div className="relative">
                          <Icon className={`w-5 h-5 ${active ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400 group-hover:text-blue-500"}`} />
                          {item.badge && (
                              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {item.badge}
                        </span>
                          )}
                        </div>
                        {!collapsed && (
                            <>
                        <span className={`ms-3 flex-1 ${active ? "font-semibold" : ""}`}>
                          {item.label}
                        </span>
                              {item.badge && !collapsed && (
                                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                              )}
                            </>
                        )}
                      </Link>
                    </li>
                );
              })}

              {/* Logout Button */}
              <li className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleLogout}
                    className={`flex items-center p-3 w-full rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200
                  ${collapsed ? "justify-center" : ""}
                `}
                >
                  <LogoutIcon className="w-5 h-5" />
                  {!collapsed && <span className="ms-3 font-medium">Chiqish</span>}
                </button>
              </li>
            </ul>


          </div>
        </aside>
      </>
  );
}

export default Sidebar;
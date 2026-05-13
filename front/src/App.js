import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import React, { useEffect } from "react";
import "./App.css";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ApiCall from "./config/index";

// my pages
import Home from "./pages/home/Home";
import PageNotFound from "./pages/404/404";
import DataForm from "./pages/home/DataForm";
import Kabinet from "./pages/home/Kabinet";
import Result from "./pages/home/Result";
import EducationTypeInstitute from "./pages/educationType/EducationTypeInstitute";
import EducationExam from "./pages/educationExam/EducationExam";
import EducationOffer from "./pages/educationOffer/EducationOffer";
import EducationSocial from "./pages/educationSocial/EducationSocial";
import EducationPrize from "./pages/educationPrize/EducationPrize";

// admin pages
import LoginAdmin from "./admin/LoginAdmin";
import EducationForm from "./admin/shuxrataka/EducationForm";
import ForeignForm from "./pages/home/ForeignForm";
import EducationField from "./admin/shuxrataka/EducationField";
import EducationType from "./admin/shuxrataka/EducationType";
import MyAppeals from "./admin/shuxrataka/Appeals";
import MyPagesTransformEducation from "./admin/shuxrataka/Transform";
import MyPagesSeconStudy from "./admin/shuxrataka/SecondStudy";
import AdminHome from "./admin/shuxrataka/AdminHome";
import MyPagesHistory from "./admin/shuxrataka/History";
import Staff from "./admin/shuxrataka/Staff";
import MyOperators from "./admin/shuxrataka/Operators";
import MyOperatorsCabinet from "./admin/shuxrataka/AdminHomeCabinet";
import DashboardAppeals2025 from "./admin/shuxrataka/Appeals2025";
import ShuxratakaStatistic from "./admin/shuxrataka/lead-modal/CrmStatistic";
import ShuxratakaLead from "./admin/shuxrataka/lead-modal/Lead";

// Manager pages
import ManagerEducationForm from "./admin/manager/EducationForm";
import ManagerEducationField from "./admin/manager/EducationField";
import ManagerEducationType from "./admin/manager/EducationType";
import ManagerMyAppeals from "./admin/manager/Appeals";
import ManagerMyPagesTransformEducation from "./admin/manager/Transform";
import ManagerMyPagesSeconStudy from "./admin/manager/SecondStudy";
import ManagerAdminHome from "./admin/manager/AdminHome";
import ManagerMyPagesHistory from "./admin/manager/History";
import ManagerStaff from "./admin/manager/Staff";
import ManagerMyOperators from "./admin/manager/Operators";
import ManagerMyOperatorsCabinet from "./admin/manager/AdminHomeCabinet";
import ManagerDashboardAppeals2025 from "./admin/manager/Appeals2025";
import ManagerSettings from "./admin/manager/Settings";
import ManagerStatistic from "./admin/manager/lead-modal/CrmStatistic";
import ManagerLead from "./admin/manager/lead-modal/Lead";
import ManagerOperatorStatistic from "./admin/manager/lead-modal/OperatorStatistic";

// superadmin
import EducationFormWorker from "./admin/superadmin/EducationForm";
import EducationFieldWorker from "./admin/superadmin/EducationField";
import EducationTypeWorker from "./admin/superadmin/EducationType";
import MyAppealsWorker from "./admin/superadmin/Appeals";
import MyPagesTransformEducationWorker from "./admin/superadmin/Transform";
import AdminHomeWorker from "./admin/superadmin/AdminHome";
import MyPagesHistoryWorker from "./admin/superadmin/History";
import MyQRCodeWorker from "./admin/superadmin/MyQRCode";
import SettingsWorker from "./admin/superadmin/Settings";
import StaffWorker from "./admin/superadmin/Staff";
import OperatorWorker from "./admin/superadmin/Operators";
import SuperadminStatistic from "./admin/superadmin/lead-modal/CrmStatistic";
import SuperadminOperatorStatistic from "./admin/superadmin/lead-modal/OperatorStatistic";
import SuperadminLead from "./admin/superadmin/lead-modal/Lead";
import SocialMediaWorker from "./admin/superadmin/SocialMedia";
import SecondStudyWorker from "./admin/superadmin/SecondStudy";
import SendPayment from "./admin/superadmin/SendPayment";
import AmbassadorAkobir from "./admin/superadmin/AmbassadorStatistika";
import AmbassadorProfileAkobir from "./admin/superadmin/AmbassadorPage";
import PaymentWithDraw from "./admin/superadmin/PaymentWithdraw";
import WithDrawPage from "./admin/superadmin/WithDrawPage";
import Appeals2025 from "./admin/superadmin/Appeals2025";
import CrmCategories from "./admin/superadmin/crm-category/crm-category";
import CrmSubCategories from "./admin/superadmin/crm-category/crm-sub-category";
import CrmRemider from "./admin/superadmin/lead-modal/Remider";
import Users from "./admin/superadmin/user/Users";

// operator (accountant)
import AppealsOperator from "./admin/operator/Appeals";
import TransformEducationOperator from "./admin/operator/Transform";
import SecondStudyOperator from "./admin/operator/SecondStudy";
import OperatorCabinet2 from "./admin/operator/AdminHomeCabinet";
import OperatorLeads from "./admin/operator/Lead";
import OperatorCrmRemider from "./admin/operator/Remider";

// agent
import AdminHomeAgent from "./admin/agent/AdminHome";
import AppealsAgent from "./admin/agent/Appeals";
import TestAbuturient from "./pages/home/TestAbuturient";
import AllAppeals from "./admin/agent/AllAppeals";
import SocialMedia from "./admin/shuxrataka/SocialMedia";
import MyQRCode from "./admin/shuxrataka/MyQRCode";
import GoldCard from "./pages/goldCard/GoldCard";
import QRCodeAgent from "./admin/agent/QRCodeAgent";
import Settings from "./admin/shuxrataka/Settings";
import Directions from "./pages/home/Directions";
import Contract from "./admin/superadmin/Contract";
import SmsTemplates from "./admin/superadmin/SmsTemplates";
function App() {
  const blockedPages = ["/dashboard", "/agent", "/admin"];
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkSecurity();
  }, [blockedPages, location.pathname, navigate]);
  async function checkSecurity() {
    if (location.pathname === "/admin/login") return;
    if (
      blockedPages.some((blockedPage) =>
        location.pathname.startsWith(blockedPage),
      )
    ) {
      let accessToken = localStorage.getItem("access_token");
      const res = await ApiCall("/api/v1/security", "GET");
      if (res?.data == 401) {
        navigate("/admin/login");
      }
      if (accessToken !== null) {
        if (res?.data !== 401 && res?.error) {
          if (res?.data[0]?.name !== "ROLE_ADMIN") {
            navigate("/404");
          }
        }
      } else {
        navigate("/admin/login");
      }
    }
  }

  return (
    <div>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        style={{ zIndex: 999999 }}
      />
      <Routes>
        {/*open pages*/}
        <Route path={"/:agentId"} element={<Home />} />
        <Route path={"/"} element={<Home />} />
        <Route path={"/card/:cardId"} element={<GoldCard />} />
        <Route path={"/user-info"} element={<Directions />} />
        <Route path={"/data-form"} element={<DataForm />} />
        <Route path={"/cabinet"} element={<Kabinet />} />
        <Route path={"/test"} element={<TestAbuturient />} />
        <Route path={"/result"} element={<Result />} />
        <Route path={"/education-type"} element={<EducationTypeInstitute />} />
        <Route path={"/education-exam"} element={<EducationExam />} />
        <Route path={"/education-offer"} element={<EducationOffer />} />
        <Route path={"/data-form-foreign"} element={<ForeignForm />} />

        {/* superadmin */}
        <Route path={"/main"} element={<AdminHomeWorker />} />
        <Route path={"/main/appeal"} element={<MyAppealsWorker />} />
        <Route path={"/main/contract"} element={<Contract />} />
        <Route path={"/main/sms-templates"} element={<SmsTemplates />} />
        <Route path={"/main/users"} element={<Users />} />
        <Route
          path={"/main/transform-education"}
          element={<MyPagesTransformEducationWorker />}
        />
        <Route path={"/main/qr-code"} element={<MyQRCodeWorker />} />
        <Route path={"/main/settings"} element={<SettingsWorker />} />
        <Route path={"/main/staff"} element={<StaffWorker />} />
        <Route path={"/main/operators"} element={<OperatorWorker />} />
        <Route path={"/main/statistic"} element={<SuperadminStatistic />} />
        <Route
          path={"/main/operator"}
          element={<SuperadminOperatorStatistic />}
        />
        <Route path={"/main/crms/:id"} element={<SuperadminLead />} />
        <Route
          path={"/main/education-socialMedia"}
          element={<SocialMediaWorker />}
        />
        <Route
          path={"/main/education-form"}
          element={<EducationFormWorker />}
        />
        <Route
          path={"/main/education-field"}
          element={<EducationFieldWorker />}
        />
        <Route
          path={"/main/historyWorker"}
          element={<MyPagesHistoryWorker />}
        />
        <Route
          path={"/main/education-type"}
          element={<EducationTypeWorker />}
        />
        <Route path={"/main/send-payment"} element={<SendPayment />} />
        <Route
          path={"/main/ambassador-statistik"}
          element={<AmbassadorAkobir />}
        />
        <Route
          path={"/main/ambassador-statistik/:id"}
          element={<AmbassadorProfileAkobir />}
        />
        <Route path={"/main/payment-withdraw"} element={<PaymentWithDraw />} />
        <Route path={"/main/payment-withdraw/:id"} element={<WithDrawPage />} />
        <Route path={"/main/MyQRCode"} element={<MyQRCodeWorker />} />
        <Route path={"/main/staffWorker"} element={<StaffWorker />} />
        <Route
          path={"/main/socialMediaWorker"}
          element={<SocialMediaWorker />}
        />
        <Route path={"/main/settingsWorker"} element={<SettingsWorker />} />
        <Route path={"/main/SecondStudy"} element={<SecondStudyWorker />} />
        <Route path={"/main/qabul2025"} element={<Appeals2025 />} />
        <Route path={"/main/crm-categories"} element={<CrmCategories />} />
        <Route path="/crm/categories/:id" element={<CrmSubCategories />} />
        <Route path="/main/crm-remider" element={<CrmRemider />} />

        {/* generator */}
        <Route path={"/admin/login"} element={<LoginAdmin />} />
        <Route path={"/dashboard/home"} element={<AdminHome />} />
        <Route
          path={"/dashboard/operator/statistic"}
          element={<SuperadminOperatorStatistic />}
        />
        <Route
          path={"/dashboard/statistic"}
          element={<ShuxratakaStatistic />}
        />
        <Route path={"/dashboard/crms/:id"} element={<ShuxratakaLead />} />

        <Route
          path={"/dashboard/SecondStudy"}
          element={<MyPagesSeconStudy />}
        />
        <Route path={"/dashboard/appeal"} element={<MyAppeals />} />
        <Route
          path={"/dashboard/transform-education"}
          element={<MyPagesTransformEducation />}
        />
        <Route path={"/dashboard/qr-code"} element={<MyQRCode />} />
        <Route path={"/dashboard/settings"} element={<Settings />} />
        <Route path={"/dashboard/staff"} element={<Staff />} />
        <Route path={"/dashboard/operators"} element={<MyOperators />} />
        <Route
          path={"/dashboard/operators/:id"}
          element={<MyOperatorsCabinet />}
        />
        <Route
          path={"/dashboard/education-socialMedia"}
          element={<SocialMedia />}
        />
        <Route path={"/dashboard/education-form"} element={<EducationForm />} />
        <Route
          path={"/dashboard/education-field"}
          element={<EducationField />}
        />
        <Route path={"/dashboard/history"} element={<MyPagesHistory />} />
        <Route path={"/dashboard/education-type"} element={<EducationType />} />
        <Route
          path={"/dashboard/qabul2025"}
          element={<DashboardAppeals2025 />}
        />

        {/* manager */}
        <Route path={"/manager/home"} element={<ManagerAdminHome />} />
        <Route path={"/manager/statistic"} element={<ManagerStatistic />} />
        <Route path={"/manager/crms/:id"} element={<ManagerLead />} />
        <Route
          path={"/manager/operators"}
          element={<ManagerOperatorStatistic />}
        />
        <Route
          path={"/manager/SecondStudy"}
          element={<ManagerMyPagesSeconStudy />}
        />
        <Route path={"/manager/appeal"} element={<ManagerMyAppeals />} />
        <Route
          path={"/manager/transform-education"}
          element={<ManagerMyPagesTransformEducation />}
        />
        <Route path={"/manager/staff"} element={<ManagerStaff />} />
        <Route path={"/manager/operator"} element={<ManagerMyOperators />} />
        <Route
          path={"/manager/operators/:id"}
          element={<ManagerMyOperatorsCabinet />}
        />
        <Route
          path={"/manager/education-form"}
          element={<ManagerEducationForm />}
        />
        <Route
          path={"/manager/education-field"}
          element={<ManagerEducationField />}
        />
        <Route path={"/manager/history"} element={<ManagerMyPagesHistory />} />
        <Route
          path={"/manager/education-type"}
          element={<ManagerEducationType />}
        />
        <Route
          path={"/manager/qabul2025"}
          element={<ManagerDashboardAppeals2025 />}
        />
        <Route path={"/manager/settings"} element={<ManagerSettings />} />

        <Route path={"/*"} element={<PageNotFound />} />

        {/*agent*/}
        <Route path={"/agent/home"} element={<AdminHomeAgent />} />
        {/*<Route path={"/agent/vaucher"} element={<QRCodeAgent />} />*/}
        {/*<Route path={"/agent/appeals"} element={<AppealsAgent />} />*/}
        {/*<Route path={"/agent/all-appeals"} element={<AllAppeals />} />*/}

        {/*operator*/}
        <Route path={"/operator/appeal"} element={<AppealsOperator />} />
        <Route
          path={"/operator/transform-education"}
          element={<TransformEducationOperator />}
        />
        <Route
          path={"/operator/second-study"}
          element={<SecondStudyOperator />}
        />
        <Route path={"/operator"} element={<OperatorCabinet2 />} />
        <Route path={"/operator/leads/:id"} element={<OperatorLeads />} />
        <Route
          path={"/operator/crm-remider"}
          element={<OperatorCrmRemider />}
        />
      </Routes>
    </div>
  );
}

export default App;

import { useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

const Home            = lazy(() => import("./components/Home/Home"));
const About           = lazy(() => import("./components/About/About"));
const Projects        = lazy(() => import("./components/Projects/Projects"));
const Blog            = lazy(() => import("./components/Blog/Blog"));
const Contact         = lazy(() => import("./components/Contact/Contact"));
const Portfolio       = lazy(() => import("./components/Portfolio/Portfolio"));
const MobileHeader    = lazy(() => import("./components/MobileHeader/MobileHeader"));
const Sidebar         = lazy(() => import("./components/Sidebar/Sidebar"));
const Publications    = lazy(() => import("./components/Publications/Publications"));
const Footer          = lazy(() => import("./components/Footer/Footer"));
const ProjectDetails  = lazy(() => import("./components/Projects/ProjectDetailsPage/ProjectDetailsPage"));

const AdminLayout     = lazy(() => import("./admin/AdminLayout"));
const AdminLoginPage  = lazy(() => import("./admin/LoginPage/LoginPage"));
const AdminDashboard  = lazy(() => import("./admin/DashboardPage/DashboardPage"));
const AdminProjects   = lazy(() => import("./admin/AdminProjects/AdminProjects"));
const AdminMediaLibrary = lazy(
  () => import("./admin/MediaLibraryPage/MediaLibraryPage"),
);

import "./App.scss";

function PublicApp() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MobileHeader />

      <div className="global-outer">
        <div className="global-inner">
          <Sidebar />

          <main id="main-outer">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/projects/:slug" element={<ProjectDetails />} />

              <Route path="/portfolio" element={<Portfolio initialFilter="All" />} />
              <Route path="/portfolio/premium" element={<Portfolio initialFilter="Premium" />} />
              <Route path="/portfolio/rtw" element={<Portfolio initialFilter="Ready-to-Wear" />} />
              <Route path="/portfolio/sketches" element={<Portfolio initialFilter="Sketches" />} />
              <Route path="/portfolio/styling" element={<Portfolio initialFilter="Styling" />} />

              <Route path="/publications" element={<Publications initialFilter="All" />} />
              <Route path="/publications/celebrities" element={<Publications initialFilter="Celebrities" />} />
              <Route path="/publications/covers" element={<Publications initialFilter="Covers" />} />
            </Routes>
          </main>
        </div>

        <Footer />
      </div>
    </Suspense>
  );
}

// Админская часть
function AdminApp() {
  return (
    <AdminLayout>
      <Routes>
        {/* логин */}
        <Route path="/admin" element={<AdminLoginPage />} />
        {/* дальше будем добавлять маршруты админки */}
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/media" element={<AdminMediaLibrary />} />
      </Routes>
    </AdminLayout>
  );
}

// Компонент, выбирающий какую “оболочку” показать
function AppRouter() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return isAdmin ? <AdminApp /> : <PublicApp />;
}

function App() {
  useEffect(() => {
    setTimeout(() => {
      document.body.classList.add("loaded");
    }, 10);
  }, []);

  return (
    <BrowserRouter>
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;


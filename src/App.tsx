import React, { useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { GalleriesProvider, useGalleries } from "./context/GalleriesContext";
import { loadAndApplySeoConfig } from "./utils/seo";
import ThemeToggle from "./components/ThemeToggle/ThemeToggle";

const Home = lazy(() => import("./components/Home/Home"));
const About = lazy(() => import("./components/About/About"));
const Projects = lazy(() => import("./components/Projects/Projects"));
const Blog = lazy(() => import("./components/Blog/Blog"));
const Contact = lazy(() => import("./components/Contact/Contact"));
const MobileHeader = lazy(() => import("./components/MobileHeader/MobileHeader"));
const Sidebar = lazy(() => import("./components/Sidebar/Sidebar"));
const Footer = lazy(() => import("./components/Footer/Footer"));
const ProjectDetails = lazy(() => import("./components/Projects/ProjectDetailsPage/ProjectDetailsPage"));
const GalleryPage = lazy(() => import("./components/Gallery/GalleryPage"));
const PdfWorksList = lazy(() => import("./components/PdfWorks/PdfWorksList"));
const PdfWorkPage = lazy(() => import("./components/PdfWorks/PdfWorkPage"));

const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminLoginPage = lazy(() => import("./admin/LoginPage/LoginPage"));
const AdminDashboard = lazy(() => import("./admin/DashboardPage/DashboardPage"));
const AdminProjects = lazy(() => import("./admin/AdminProjects/AdminProjects"));
const AdminMediaLibrary = lazy(() => import("./admin/MediaLibraryPage/MediaLibraryPage"));
const AdminGalleries = lazy(() => import("./admin/GalleriesPage/GalleriesPage"));
const AdminPdfWorks = lazy(() => import("./admin/PdfWorksPage/PdfWorksPage"));
const AdminSeo = lazy(() => import("./admin/SeoPage/SeoPage"));
const AdminUsers = lazy(() => import("./admin/UsersPage/UsersPage"));
const AdminSetPassword = lazy(() => import("./admin/SetPasswordPage/SetPasswordPage"));

import "./App.scss";

function PublicRoutes() {
  const { galleries } = useGalleries();

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/blog" element={<Blog />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/projects" element={<Projects />} />
      <Route path="/projects/:slug" element={<ProjectDetails />} />
      <Route path="/works/pdf" element={<PdfWorksList />} />
      <Route path="/works/pdf/:slug" element={<PdfWorkPage />} />

      {galleries.map((gallery) => (
        <React.Fragment key={gallery.id}>
          <Route
            path={`/${gallery.routePath}`}
            element={<GalleryPage galleryId={gallery.id} />}
          />
          <Route
            path={`/${gallery.routePath}/:filterId`}
            element={<GalleryPage galleryId={gallery.id} />}
          />
        </React.Fragment>
      ))}
    </Routes>
  );
}

function PublicApp() {
  return (
    <GalleriesProvider>
      <Suspense fallback={<div>Loading...</div>}>
        <MobileHeader />
        <ThemeToggle />

        <div className="global-outer">
          <div className="global-inner">
            <Sidebar />

            <main id="main-outer">
              <PublicRoutes />
            </main>
          </div>

          <Footer />
        </div>
      </Suspense>
    </GalleriesProvider>
  );
}

function AdminApp() {
  return (
    <AdminLayout>
      <Routes>
        <Route path="/admin" element={<AdminLoginPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/projects" element={<AdminProjects />} />
        <Route path="/admin/media" element={<AdminMediaLibrary />} />
        <Route path="/admin/galleries" element={<AdminGalleries />} />
        <Route path="/admin/pdf" element={<AdminPdfWorks />} />
        <Route path="/admin/seo" element={<AdminSeo />} />
        <Route path="/admin/users" element={<AdminUsers />} />
        <Route path="/admin/set-password" element={<AdminSetPassword />} />
      </Routes>
    </AdminLayout>
  );
}

function AppRouter() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  return isAdmin ? <AdminApp /> : <PublicApp />;
}

function SeoSync() {
  const location = useLocation();

  useEffect(() => {
    loadAndApplySeoConfig();
  }, [location.pathname]);

  return null;
}

function App() {
  useEffect(() => {
    setTimeout(() => {
      document.body.classList.add("loaded");
    }, 10);
  }, []);

  return (
    <BrowserRouter>
      <SeoSync />
      {/* Background daemon that sends init + ping from startup <RefreshKeeper /> */}
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;

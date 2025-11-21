import React, { useEffect, Suspense, lazy } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { GalleriesProvider, useGalleries } from "./context/GalleriesContext";

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

const AdminLayout = lazy(() => import("./admin/AdminLayout"));
const AdminLoginPage = lazy(() => import("./admin/LoginPage/LoginPage"));
const AdminDashboard = lazy(() => import("./admin/DashboardPage/DashboardPage"));
const AdminProjects = lazy(() => import("./admin/AdminProjects/AdminProjects"));
const AdminMediaLibrary = lazy(() => import("./admin/MediaLibraryPage/MediaLibraryPage"));
const AdminGalleries = lazy(() => import("./admin/GalleriesPage/GalleriesPage"));

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
      </Routes>
    </AdminLayout>
  );
}

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

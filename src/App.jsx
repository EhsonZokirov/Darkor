import { BrowserRouter, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import ScrollToTop from "./components/ScrollToTop";
import AuthProvider from "./context/AuthProvider";
import LanguageProvider from "./i18n/LanguageProvider";

import Home from "./pages/Home";
import BloggersPage from "./pages/BloggersPage";
import BloggerProfile from "./pages/BloggerProfile";
import SMM from "./pages/Smm";
import AddBlogger from "./pages/AddBlogger";
import Contacts from "./pages/Contacts";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Privacy from "./pages/Privacy";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
      <AuthProvider>
        <ScrollToTop />

        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/bloggers" element={<BloggersPage />} />
            <Route path="/blogger/:id" element={<BloggerProfile />} />
            <Route path="/smm" element={<SMM />} />
            <Route path="/add-blogger" element={<AddBlogger />} />
            <Route path="/cabinet" element={<AddBlogger />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AuthProvider>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;

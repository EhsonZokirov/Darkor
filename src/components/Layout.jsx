import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

// Общая «обёртка»: меню сверху и футер снизу на каждой странице.
function Layout() {
  const { pathname } = useLocation();

  return (
    <>
      <Navbar />

      <div className="page" key={pathname}>
        <Outlet />
      </div>

      <Footer />
    </>
  );
}

export default Layout;

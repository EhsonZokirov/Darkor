import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import SponsorBanner from "./SponsorBanner";

// Общая «обёртка»: меню сверху и футер снизу на каждой странице.
function Layout() {
  const { pathname } = useLocation();

  return (
    <>
      <Navbar />

      <div className="page" key={pathname}>
        <Outlet />
      </div>

      {/* Реклама партнёра на всех страницах. На главной она стоит внутри страницы. */}
      {pathname !== "/" && pathname !== "/admin" && <SponsorBanner compact />}

      <Footer />
    </>
  );
}

export default Layout;

import Header from "./Header";
import Footer from "./Footer";
import { Outlet } from "react-router-dom";

export function Layout() {
    return (
        <div className="layout-shell">
            <div className="layout-frame">
                <Header />
                <main className="layout-content">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </div> 
    );
}
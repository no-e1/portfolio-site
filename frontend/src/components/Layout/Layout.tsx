import Header from "../Header";
import Footer from "../Footer";
import { Outlet } from "react-router-dom";
import styles from "./Layout.module.css";

export function Layout() {
    return (
        <div className={styles["layout-shell"]}>
            <div className={styles["layout-frame"]}>
                <Header />
                <main className={styles["layout-content"]}>
                    <Outlet />
                </main>
                <Footer />
            </div>
        </div> 
    );
}

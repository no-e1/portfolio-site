import { FeaturedProjects } from "../../components/Home/FeaturedProjects"
import { GreetingsCard } from "../../components/Home/GreetingsCard"
import { TrexRunner } from "../../components/Home/TrexRunner"
import styles from "./HomePage.module.css"

export function HomePage() {
    return (
        <main className={styles.page}>
            <h1 className={styles.title}>Noel Kohn</h1>
            <GreetingsCard />
            <TrexRunner />
            <FeaturedProjects />
        </main>
    )
}

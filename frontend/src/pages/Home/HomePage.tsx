import { FeaturedProjects } from "../../components/Home/FeaturedProjects"
import { GreetingsCard } from "../../components/Home/GreetingsCard"
import { Interests } from "../../components/Home/Interests"
import styles from "./HomePage.module.css"

export function HomePage() {
    return (
        <main className={styles.page}>
            <h1 className={styles.title}>Noel Kohn</h1>
            <GreetingsCard />
            <Interests />
            <FeaturedProjects />
        </main>
    )
}

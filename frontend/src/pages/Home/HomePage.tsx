import { GreetingsCard } from "../../components/Home/GreetingsCard"
import styles from "./HomePage.module.css"

export function HomePage() {
    return (
        <main className={styles.page}>
                <GreetingsCard />
        </main>
    )
}
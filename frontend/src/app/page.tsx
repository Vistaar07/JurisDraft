import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className="flex flex-col bg-amber-950 text-rose-300 p-4 rounded-lg">
          Hello from Tailwind!
        </h1>
      </main>
    </div>
  );
}

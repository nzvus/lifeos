/** Sign-in and sign-up: the kit's page, no navigation and no settings yet. */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="k-page">
      <header className="k-ph">
        <div className="bar">
          <h1 className="k-ph-t">lifeos</h1>
        </div>
      </header>
      <section className="k-section g3">{children}</section>
    </main>
  );
}

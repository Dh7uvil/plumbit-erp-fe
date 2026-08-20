export default function HomePage() {
  return (
    <section className="flex max-w-lg flex-col gap-2">
      <h1 className="text-xl font-semibold">Welcome</h1>
      <p className="text-muted-foreground text-sm">
        You are signed in. Use Change password or Sign out in the header to manage your session.
      </p>
    </section>
  );
}

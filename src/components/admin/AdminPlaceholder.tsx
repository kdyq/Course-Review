export function AdminPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <>
      <h1 className="admin-title">{title}</h1>
      <div className="empty-state">
        <h2>这一步在 M5 接入</h2>
        <p>{description}</p>
      </div>
    </>
  );
}

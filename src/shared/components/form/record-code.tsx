export function RecordCode({ entity, code }: { entity: string; code?: string | null }) {
  if (!code) {
    return null;
  }
  return (
    <p className="text-foreground font-mono text-sm">
      {entity} ID : <span className="font-bold">{code}</span>
    </p>
  );
}

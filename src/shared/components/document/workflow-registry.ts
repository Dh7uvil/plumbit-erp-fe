export type DocumentActionVariant = "default" | "outline" | "destructive";

export type DocumentActionSpec<TAction extends string = string> = {
  action: TAction;
  label: string;
  permission: string;
  variant?: DocumentActionVariant;
  confirmCopy?: (documentLabel: string) => string;
  reasonField?: {
    label?: string;
    placeholder: string;
    required?: boolean;
    options?: readonly { value: string; label: string }[];
  };
};

export function visibleActions<TAction extends string>(
  availableActions: readonly string[],
  registry: readonly DocumentActionSpec<TAction>[],
  can: (permission: string) => boolean,
): DocumentActionSpec<TAction>[] {
  const byAction = new Map(registry.map((spec) => [spec.action, spec]));
  const visible: DocumentActionSpec<TAction>[] = [];
  for (const action of availableActions) {
    const spec = byAction.get(action as TAction);
    if (spec && can(spec.permission)) {
      visible.push(spec);
    }
  }
  return visible;
}

export function getDocumentAction<TAction extends string>(
  registry: readonly DocumentActionSpec<TAction>[],
  action: TAction,
): DocumentActionSpec<TAction> {
  const spec = registry.find((item) => item.action === action);
  if (!spec) {
    throw new Error(`Unknown document action: ${action}`);
  }
  return spec;
}

export type DocumentActionVariant = "default" | "outline" | "destructive";

export type DocumentActionSpec<TAction extends string = string> = {
  action: TAction;
  label: string;
  permission: string;
  variant?: DocumentActionVariant;
  /** When true, action is shown under the record view "Convert to" menu. */
  convertTo?: boolean;
  /** When true, never group this action under "Convert to" (overrides defaults). */
  convertToExclude?: boolean;
  /** Additional permissions required before the action is shown. */
  alsoRequires?: readonly string[];
  confirmCopy?: (documentLabel: string) => string;
  reasonField?: {
    label?: string;
    placeholder: string;
    required?: boolean;
    options?: readonly { value: string; label: string }[];
  };
};

/** Downstream document actions grouped under the record view "Convert to" menu. */
export function isConvertToMenuAction(action: string, spec: DocumentActionSpec): boolean {
  if (spec.convertToExclude) {
    return false;
  }
  if (spec.convertTo) {
    return true;
  }
  return (
    action === "convert" ||
    action.startsWith("create_") ||
    action === "add_to_shipment" ||
    action === "reverse"
  );
}

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
      if (spec.alsoRequires?.some((code) => !can(code))) {
        continue;
      }
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

export function appendMissingActions(
  availableActions: readonly string[],
  extras: readonly string[],
): string[] {
  const next = [...availableActions];
  for (const action of extras) {
    if (!next.includes(action)) {
      next.push(action);
    }
  }
  return next;
}

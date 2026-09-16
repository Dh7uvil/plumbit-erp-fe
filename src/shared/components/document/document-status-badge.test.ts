import { describe, expect, it } from "vitest";

import {
  documentStatusTone,
  documentStatusTooltip,
} from "@/shared/components/document/document-status-badge";

describe("documentStatusTone", () => {
  it("maps posted and paid to success", () => {
    expect(documentStatusTone("POSTED")).toBe("success");
    expect(documentStatusTone("paid")).toBe("success");
  });

  it("does not treat unposted as posted", () => {
    expect(documentStatusTone("UNPOSTED")).toBe("muted");
  });

  it("maps draft and overdue to warning", () => {
    expect(documentStatusTone("DRAFT")).toBe("warning");
    expect(documentStatusTone("OVERDUE")).toBe("warning");
  });

  it("maps cancelled to destructive", () => {
    expect(documentStatusTone("CANCELLED")).toBe("destructive");
  });
});

describe("documentStatusTooltip", () => {
  it("joins kind and label", () => {
    expect(documentStatusTooltip("Fulfillment", "Partially delivered")).toBe(
      "Fulfillment: Partially delivered",
    );
  });
});

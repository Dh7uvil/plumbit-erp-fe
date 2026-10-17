import { describe, expect, it } from "vitest";

import { OPTIONAL_SELECT_NONE } from "@/config/constants";
import { mapSourceToHeaderValues } from "@/shared/components/document/source-header-autofill";

describe("mapSourceToHeaderValues", () => {
  it("maps customer commercial headers", () => {
    expect(
      mapSourceToHeaderValues({
        partyIdField: "customer_id",
        partyId: "cust-1",
        currencyId: "aed",
        contactId: null,
        placeOfSupply: "DUBAI",
        partyTrn: "123",
      }),
    ).toEqual({
      customer_id: "cust-1",
      customer_trn: "123",
      currency_id: "aed",
      contact_id: OPTIONAL_SELECT_NONE,
      place_of_supply: "DUBAI",
    });
  });
});

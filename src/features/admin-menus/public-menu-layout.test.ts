import assert from "node:assert/strict";
import { it } from "node:test";

import { menuItemsInArea, menusInArea } from "./public-menu-layout.ts";
import type { PublicMenusResponse } from "./types";

it("renders a new backend-defined location in an existing area without a frontend key list", () => {
  const data: PublicMenusResponse = {
    locale: "vi",
    locations: [
      { key: "header-primary", label: "Chính", description: "", area: "header-navigation" },
      { key: "header-campaign", label: "Chiến dịch", description: "", area: "header-navigation" },
      { key: "footer-primary", label: "Footer", description: "", area: "footer-navigation" },
    ],
    menus: {
      "header-primary": { id: 1, key: "main", title: null, version: 1, items: [] },
      "header-campaign": {
        id: 2,
        key: "campaign",
        title: null,
        version: 1,
        items: [{ id: 3, type: "CUSTOM_URL", label: "Khuyến mãi", title: null, ariaLabel: null, href: "/campaign", target: "_self", rel: null, iconKey: null, children: [] }],
      },
    },
  };

  assert.deepEqual(menusInArea(data, "header-navigation").map((menu) => menu.key), ["main", "campaign"]);
  assert.deepEqual(menuItemsInArea(data, "header-navigation").map((item) => item.href), ["/campaign"]);
  assert.deepEqual(menusInArea(data, "footer-navigation"), []);
});

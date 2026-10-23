import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildAppearanceSettingsPayload } from "../appearance-payload.ts";
import { appearanceSettingsSchema } from "./appearance-schema.ts";

const validSettings = {
  siteName: "STU",
  siteShortName: "",
  siteDescription: "",
  siteTagline: "",
  siteUrl: "https://example.com",
  logoLightId: null,
  logoDarkId: null,
  logoIconId: null,
  faviconId: null,
  defaultOgImageId: null,
  socialLinks: [
    {
      platform: "github",
      url: "https://github.com/example",
      isActive: true,
      sortOrder: 0,
    },
  ],
  contactEmail: "hello@example.com",
  supportEmail: "",
  phone: "",
  address: "",
  workingHours: "",
  mapUrl: "",
  showLanguageFlags: true,
  translations: [],
} as const;

describe("appearance settings schema", () => {
  it("accepts valid default and translated settings", () => {
    assert.equal(appearanceSettingsSchema.safeParse(validSettings).success, true);
    const english = {
      locale: "en",
      siteName: "English name",
      siteShortName: "",
      siteTagline: "",
      siteDescription: "",
    };
    assert.equal(
      appearanceSettingsSchema.safeParse({ ...validSettings, translations: [english] }).success,
      true,
    );
  });

  it("does not send the default locale as a translation", () => {
    const values = appearanceSettingsSchema.parse({
      ...validSettings,
      translations: [
        {
          locale: "vi",
          siteName: "Tên mặc định cũ",
          siteShortName: "",
          siteTagline: "",
          siteDescription: "",
        },
        {
          locale: "en",
          siteName: "English name",
          siteShortName: "",
          siteTagline: "English tagline",
          siteDescription: "",
        },
      ],
    });

    assert.deepEqual(buildAppearanceSettingsPayload(values, "vi").translations, [
      {
        locale: "en",
        siteName: "English name",
        siteShortName: null,
        siteTagline: "English tagline",
        siteDescription: null,
      },
    ]);
  });

  it("reports each security and uniqueness rule independently", () => {
    const english = {
      locale: "en",
      siteName: "English name",
      siteShortName: "",
      siteTagline: "",
      siteDescription: "",
    };
    const cases = [
      {
        name: "insecure social URL",
        value: {
          ...validSettings,
          socialLinks: [
            { ...validSettings.socialLinks[0], url: "http://github.com/example" },
          ],
        },
        message: "httpsUrl",
      },
      {
        name: "duplicate social platform",
        value: {
          ...validSettings,
          socialLinks: [
            validSettings.socialLinks[0],
            { ...validSettings.socialLinks[0], url: "https://github.com/another" },
          ],
        },
        message: "duplicatePlatform",
      },
      {
        name: "duplicate translation locale",
        value: { ...validSettings, translations: [english, english] },
        message: "duplicateLocale",
      },
    ];

    for (const testCase of cases) {
      const result = appearanceSettingsSchema.safeParse(testCase.value);
      assert.equal(result.success, false, testCase.name);
      if (!result.success) {
        assert.ok(
          result.error.issues.some((issue) => issue.message === testCase.message),
          testCase.name,
        );
      }
    }
  });
});

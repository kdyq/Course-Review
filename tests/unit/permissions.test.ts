import { describe, expect, it } from "vitest";
import { canModerate, isAdmin, normalizeRole } from "@/lib/permissions";

describe("permissions", () => {
  it("识别管理员", () => {
    expect(isAdmin("ADMIN")).toBe(true);
    expect(isAdmin("STUDENT")).toBe(false);
    expect(isAdmin(undefined)).toBe(false);
  });

  it("审核员可以处理审核", () => {
    expect(canModerate("MODERATOR")).toBe(true);
    expect(canModerate("ADMIN")).toBe(true);
    expect(canModerate("STUDENT")).toBe(false);
  });

  it("未知角色回退为学生", () => {
    expect(normalizeRole("UNKNOWN")).toBe("STUDENT");
    expect(normalizeRole(null)).toBe("STUDENT");
  });
});

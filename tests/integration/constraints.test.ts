import { beforeEach, describe, expect, it } from "vitest";
import { importCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { createBaseData, createReview, createUser, truncateAll } from "./helpers";

beforeEach(async () => {
  await truncateAll();
});

describe("数据库约束与业务规则", () => {
  it("同一用户对同一班次只能创建一条评价映射", async () => {
    const { offering, user } = await createBaseData();
    await createReview(offering.id, user.id);

    const secondReview = await prisma.review.create({
      data: {
        offeringId: offering.id,
        difficulty: 3,
        workload: 3,
        recommendation: 4,
        assessment: [],
        content: "第二条用于测试唯一约束的评价内容。",
        status: "PUBLISHED",
      },
    });

    await expect(
      prisma.reviewAuthor.create({
        data: {
          reviewId: secondReview.id,
          userId: user.id,
          offeringId: offering.id,
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("同一用户对不同学期班次可以分别评价", async () => {
    const { course, instructor, offering, user } = await createBaseData();
    const term2 = await prisma.term.create({
      data: { name: `2026-2027-2-${user.id.slice(0, 4)}` },
    });
    const offering2 = await prisma.offering.create({
      data: {
        courseId: course.id,
        termId: term2.id,
        section: "01",
        instructors: { create: { instructorId: instructor.id } },
      },
    });

    const first = await createReview(offering.id, user.id);
    const second = await createReview(offering2.id, user.id);

    expect(first.id).not.toBe(second.id);
    const mappings = await prisma.reviewAuthor.count({ where: { userId: user.id } });
    expect(mappings).toBe(2);
  });

  it("同一用户对同一评价只能投一票", async () => {
    const { offering, user } = await createBaseData();
    const review = await createReview(offering.id, user.id);
    const voter = await createUser("voter");

    await prisma.reviewVote.create({
      data: { reviewId: review.id, userId: voter.id },
    });
    await expect(
      prisma.reviewVote.create({
        data: { reviewId: review.id, userId: voter.id },
      }),
    ).rejects.toMatchObject({ code: "P2002" });
  });

  it("同一用户对同一评价只能有一条未处理举报", async () => {
    const { offering, user } = await createBaseData();
    const review = await createReview(offering.id, user.id);
    const reporter = await createUser("reporter");

    const first = await prisma.report.create({
      data: {
        reviewId: review.id,
        reporterId: reporter.id,
        reason: "PRIVACY",
        status: "PENDING",
      },
    });

    await expect(
      prisma.report.create({
        data: {
          reviewId: review.id,
          reporterId: reporter.id,
          reason: "OTHER",
          status: "PENDING",
        },
      }),
    ).rejects.toMatchObject({ code: "P2002" });

    await prisma.report.update({
      where: { id: first.id },
      data: { status: "RESOLVED" },
    });

    const second = await prisma.report.create({
      data: {
        reviewId: review.id,
        reporterId: reporter.id,
        reason: "OTHER",
        status: "PENDING",
      },
    });
    expect(second.status).toBe("PENDING");
  });

  it("隐藏和删除的评价不参与已发布聚合", async () => {
    const { offering } = await createBaseData();
    for (let index = 0; index < 5; index += 1) {
      const author = await createUser(`published${index}`);
      await createReview(offering.id, author.id, { status: "PUBLISHED" });
    }
    const hiddenAuthor = await createUser("hidden");
    await createReview(offering.id, hiddenAuthor.id, { status: "HIDDEN" });
    const deletedAuthor = await createUser("deleted");
    await createReview(offering.id, deletedAuthor.id, { status: "DELETED" });

    const published = await prisma.review.aggregate({
      where: { offeringId: offering.id, status: "PUBLISHED" },
      _count: true,
      _avg: { recommendation: true },
    });
    expect(published._count).toBe(5);
    expect(published._avg.recommendation).toBe(4);
  });

  it("CSV 导入合并重复行，不重复创建课程和班次", async () => {
    const csv = [
      "course_code,course_name,credits,course_type,college,instructor,term,section",
      "IMP101,导入测试课程,3,ELECTIVE,导入学院,导入教师,2026-2027-1,01",
      "IMP101,导入测试课程,3,ELECTIVE,导入学院,导入教师,2026-2027-1,01",
    ].join("\n");

    const stats = await importCsv(csv);
    expect(stats.rows).toBe(2);

    const [courses, offerings, instructors, colleges, terms] = await Promise.all([
      prisma.course.count({ where: { code: "IMP101" } }),
      prisma.offering.count({
        where: { course: { code: "IMP101" } },
      }),
      prisma.instructor.count({ where: { name: "导入教师" } }),
      prisma.college.count({ where: { name: "导入学院" } }),
      prisma.term.count({ where: { name: "2026-2027-1" } }),
    ]);

    expect(courses).toBe(1);
    expect(offerings).toBe(1);
    expect(instructors).toBe(1);
    expect(colleges).toBe(1);
    expect(terms).toBe(1);
  });
});

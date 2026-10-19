import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export async function truncateAll(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditLog", "Notification", "Bookmark", "InstructorResponse", "Report",
      "ReviewTag", "Tag", "ReviewVote", "ReviewAuthor", "Review",
      "OfferingInstructor", "Offering", "Term", "Instructor", "Course", "College",
      "verification", "account", "session", "user"
    CASCADE
  `);
}

export async function createUser(label = "test"): Promise<{ id: string }> {
  const suffix = randomUUID().slice(0, 8);
  return prisma.user.create({
    data: {
      id: randomUUID(),
      name: `${label}-${suffix}`,
      email: `${label}-${suffix}@example.local`,
      username: `${label}${suffix}`,
      role: "STUDENT",
      status: "ACTIVE",
      emailVerified: true,
    },
    select: { id: true },
  });
}

export async function createBaseData() {
  const college = await prisma.college.create({
    data: { name: `测试学院-${randomUUID().slice(0, 6)}` },
  });
  const course = await prisma.course.create({
    data: {
      code: `T-${randomUUID().slice(0, 8)}`,
      name: "集成测试课程",
      credits: 3,
      type: "ELECTIVE",
      collegeId: college.id,
    },
  });
  const term = await prisma.term.create({
    data: { name: `2026-2027-1-${randomUUID().slice(0, 4)}` },
  });
  const instructor = await prisma.instructor.create({
    data: { name: "测试教师", collegeId: college.id },
  });
  const offering = await prisma.offering.create({
    data: {
      courseId: course.id,
      termId: term.id,
      section: "01",
      instructors: { create: { instructorId: instructor.id } },
    },
  });
  const user = await createUser("author");

  return {
    college,
    course,
    term,
    instructor,
    offering,
    user,
  };
}

export async function createReview(
  offeringId: string,
  userId: string,
  options: {
    status?: "PUBLISHED" | "PENDING" | "HIDDEN" | "DELETED";
    recommendation?: number;
  } = {},
) {
  const review = await prisma.review.create({
    data: {
      offeringId,
      difficulty: 3,
      workload: 3,
      recommendation: options.recommendation ?? 4,
      assessment: ["CLOSED_BOOK_EXAM"],
      content: "这是一条用于集成测试的评价内容。",
      status: options.status ?? "PUBLISHED",
    },
  });
  await prisma.reviewAuthor.create({
    data: { reviewId: review.id, userId, offeringId },
  });
  return review;
}

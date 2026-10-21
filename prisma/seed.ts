import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { hashPassword } from "better-auth/crypto";
import {
  CourseType,
  PrismaClient,
  ReportReason,
  ReportStatus,
  ReviewStatus,
  UserRole,
  UserStatus,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL 未配置");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function mulberry32(seed: number) {
  let value = seed;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20261019);
const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;
const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)];

const COLLEGES = ["计算机学院", "经济学院", "人文学院", "理学院"] as const;

const TERMS = [
  {
    name: "2025-2026-1",
    startsOn: new Date("2025-09-01"),
    endsOn: new Date("2026-01-15"),
    isCurrent: false,
  },
  {
    name: "2025-2026-2",
    startsOn: new Date("2026-02-20"),
    endsOn: new Date("2026-07-10"),
    isCurrent: false,
  },
  {
    name: "2026-2027-1",
    startsOn: new Date("2026-09-01"),
    endsOn: new Date("2027-01-15"),
    isCurrent: true,
  },
] as const;

const INSTRUCTORS = [
  { name: "王砚秋", college: "计算机学院", title: "教授" },
  { name: "林知夏", college: "计算机学院", title: "副教授" },
  { name: "顾清和", college: "计算机学院", title: "讲师" },
  { name: "周明远", college: "经济学院", title: "教授" },
  { name: "许南枝", college: "经济学院", title: "副教授" },
  { name: "陈嘉禾", college: "人文学院", title: "副教授" },
  { name: "赵行舟", college: "人文学院", title: "讲师" },
  { name: "苏遥", college: "人文学院", title: "讲师" },
  { name: "沈观澜", college: "理学院", title: "教授" },
  { name: "陆文启", college: "理学院", title: "副教授" },
] as const;

const COURSES = [
  {
    code: "CS101",
    name: "程序设计基础",
    credits: 4,
    type: CourseType.REQUIRED,
    college: "计算机学院",
    description: "从变量、控制流到函数和基础数据结构，适合作为第一门编程课。",
  },
  {
    code: "CS202",
    name: "数据结构",
    credits: 4,
    type: CourseType.REQUIRED,
    college: "计算机学院",
    description: "线性表、树、图和排序算法，配合上机实验。",
  },
  {
    code: "CS301",
    name: "操作系统",
    credits: 4,
    type: CourseType.REQUIRED,
    college: "计算机学院",
    description: "进程、内存、文件系统和并发，实验占比高。",
  },
  {
    code: "CS305",
    name: "计算机网络",
    credits: 3,
    type: CourseType.REQUIRED,
    college: "计算机学院",
    description: "从物理层到应用层，包含抓包和套接字实验。",
  },
  {
    code: "CS310",
    name: "数据库系统",
    credits: 3,
    type: CourseType.REQUIRED,
    college: "计算机学院",
    description: "关系模型、SQL、索引和事务。",
  },
  {
    code: "CS401",
    name: "机器学习导论",
    credits: 3,
    type: CourseType.ELECTIVE,
    college: "计算机学院",
    description: "监督学习基础、模型评估和课程项目。",
  },
  {
    code: "CS410",
    name: "软件工程",
    credits: 3,
    type: CourseType.ELECTIVE,
    college: "计算机学院",
    description: "需求、设计、测试和团队项目。",
  },
  {
    code: "CS420",
    name: "计算机图形学",
    credits: 3,
    type: CourseType.ELECTIVE,
    college: "计算机学院",
    description: "几何变换、光照和渲染基础。",
  },
  {
    code: "ECON101",
    name: "微观经济学",
    credits: 3,
    type: CourseType.ELECTIVE,
    college: "经济学院",
    description: "消费者、厂商和市场结构。",
  },
  {
    code: "ECON102",
    name: "宏观经济学",
    credits: 3,
    type: CourseType.ELECTIVE,
    college: "经济学院",
    description: "国民收入、通胀、失业和宏观政策。",
  },
  {
    code: "ECON204",
    name: "计量经济学",
    credits: 3,
    type: CourseType.ELECTIVE,
    college: "经济学院",
    description: "回归分析、模型设定和实证研究。",
  },
  {
    code: "ECON310",
    name: "金融学基础",
    credits: 2,
    type: CourseType.ELECTIVE,
    college: "经济学院",
    description: "现值、风险、资产定价和金融市场。",
  },
  {
    code: "ECON320",
    name: "博弈论导论",
    credits: 2,
    type: CourseType.ELECTIVE,
    college: "经济学院",
    description: "策略互动、纳什均衡和重复博弈。",
  },
  {
    code: "LIT118",
    name: "中国现代文学",
    credits: 2,
    type: CourseType.ELECTIVE,
    college: "人文学院",
    description: "现代文学文本细读与讨论。",
  },
  {
    code: "LIT220",
    name: "外国文学选读",
    credits: 2,
    type: CourseType.ELECTIVE,
    college: "人文学院",
    description: "从经典文本进入文学史问题。",
  },
  {
    code: "SOC101",
    name: "社会学概论",
    credits: 2,
    type: CourseType.GENERAL,
    college: "人文学院",
    description: "社会结构、身份、组织和日常生活。",
  },
  {
    code: "PHIL105",
    name: "哲学导论",
    credits: 2,
    type: CourseType.GENERAL,
    college: "人文学院",
    description: "知识、伦理、自由和存在的问题。",
  },
  {
    code: "HIST210",
    name: "中国近现代史",
    credits: 2,
    type: CourseType.GENERAL,
    college: "人文学院",
    description: "近现代中国的政治、社会与文化变迁。",
  },
  {
    code: "ART120",
    name: "艺术鉴赏",
    credits: 2,
    type: CourseType.GENERAL,
    college: "人文学院",
    description: "绘画、建筑和视觉文化入门。",
  },
  {
    code: "MATH101",
    name: "高等数学 A",
    credits: 5,
    type: CourseType.REQUIRED,
    college: "理学院",
    description: "极限、微分、积分和级数。",
  },
  {
    code: "MATH203",
    name: "线性代数",
    credits: 3,
    type: CourseType.REQUIRED,
    college: "理学院",
    description: "矩阵、向量空间、特征值和线性变换。",
  },
  {
    code: "PHYS101",
    name: "大学物理",
    credits: 4,
    type: CourseType.REQUIRED,
    college: "理学院",
    description: "力学、电磁学和波动基础。",
  },
  {
    code: "CHEM110",
    name: "普通化学",
    credits: 3,
    type: CourseType.REQUIRED,
    college: "理学院",
    description: "原子结构、化学键、热力学和反应。",
  },
  {
    code: "BIO120",
    name: "生命科学导论",
    credits: 2,
    type: CourseType.GENERAL,
    college: "理学院",
    description: "细胞、遗传、进化和生态。",
  },
  {
    code: "STAT201",
    name: "概率论与数理统计",
    credits: 3,
    type: CourseType.REQUIRED,
    college: "理学院",
    description: "随机变量、分布、估计和假设检验。",
  },
] as const;

const TAG_NAMES = [
  "干货多",
  "作业多",
  "不点名",
  "给分好",
  "论文多",
  "实验多",
  "讨论多",
  "硬核",
  "轻松",
  "考试原题",
] as const;

const ASSESSMENTS = [
  "CLOSED_BOOK_EXAM",
  "OPEN_BOOK_EXAM",
  "PAPER",
  "PROJECT",
  "LAB",
  "PRESENTATION",
  "ATTENDANCE",
  "PARTICIPATION",
] as const;

const REVIEW_TEMPLATES = [
  "课程节奏比较稳，每周花的时间大致可预期。老师会把重点和考试范围讲清楚，复习时不容易跑偏。",
  "作业量不算小，但和课堂内容贴得很紧。认真做完实验后，对概念的理解会明显深一层。",
  "课堂讨论很多，愿意开口的话收获会更大。论文题目可以自己选，老师会给出比较具体的修改意见。",
  "考试以计算和推导为主，平时分占比不低。建议把例题自己完整做一遍，不要只看答案。",
  "老师讲得很细，板书和课件配合得好。偶尔节奏偏快，课前预习一下会轻松很多。",
  "课程内容硬核，但给分比较实在。实验报告要求规范，提前开始做就不会堆到期末。",
  "点名不频繁，但课堂上的案例和补充材料值得听。期末是闭卷，范围比较明确。",
  "小组作业占比高，队友和选题会明显影响体验。建议尽早组队，把分工写清楚。",
  "老师愿意答疑，邮件和课后都能找到人。作业反馈很具体，不只是给一个分数。",
  "整体比较轻松，适合作为通识课。想拿高分仍然需要认真写论文，不能只靠出勤。",
  "实验和理论各占一半，动手能力提升明显。如果之前基础薄弱，前期会有一点吃力。",
  "课程材料组织得好，复习时按课件顺序过一遍就行。考试题量和时间都比较合理。",
] as const;

const EVALUATION_WORDS = [
  "讲解清楚",
  "节奏适中",
  "作业偏多",
  "给分友好",
  "实验扎实",
  "讨论充分",
  "考试明确",
  "内容硬核",
] as const;

async function main() {
  console.log("清空现有数据...");
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "AuditLog", "Notification", "Bookmark", "InstructorResponse", "Report",
      "ReviewTag", "Tag", "ReviewVote", "ReviewAuthor", "Review",
      "OfferingInstructor", "Offering", "Term", "Instructor", "Course", "College",
      "verification", "account", "session", "user"
    CASCADE
  `);

  console.log("创建学院、学期、教师和课程...");
  const colleges = await Promise.all(
    COLLEGES.map((name) => prisma.college.create({ data: { name } })),
  );
  const collegeId = new Map(colleges.map((college) => [college.name, college.id]));

  const terms = await Promise.all(TERMS.map((term) => prisma.term.create({ data: term })));
  const termByName = new Map(terms.map((term) => [term.name, term]));

  const instructors = await Promise.all(
    INSTRUCTORS.map((instructor) =>
      prisma.instructor.create({
        data: {
          name: instructor.name,
          title: instructor.title,
          collegeId: collegeId.get(instructor.college),
        },
      }),
    ),
  );
  const courses = await Promise.all(
    COURSES.map((course) =>
      prisma.course.create({
        data: {
          code: course.code,
          name: course.name,
          credits: course.credits,
          type: course.type,
          description: course.description,
          collegeId: collegeId.get(course.college),
        },
      }),
    ),
  );
  const tags = await Promise.all(
    TAG_NAMES.map((name, index) =>
      prisma.tag.create({
        data: { name, slug: `tag-${index + 1}` },
      }),
    ),
  );
  const tagByName = new Map(tags.map((tag) => [tag.name, tag]));

  console.log("创建用户...");
  const adminPassword = process.env.ADMIN_PASSWORD ?? "123456";
  const adminUsername = process.env.ADMIN_USERNAME ?? "guo";
  const adminEmail = process.env.ADMIN_EMAIL ?? "guo@local.invalid";

  const [adminHash, studentHash, seedHash] = await Promise.all([
    hashPassword(adminPassword),
    hashPassword("Student2026"),
    hashPassword("SeedUser2026"),
  ]);

  const adminId = randomUUID();
  await prisma.user.create({
    data: {
      id: adminId,
      name: "管理员",
      email: adminEmail,
      emailVerified: true,
      username: adminUsername,
      displayUsername: adminUsername,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: adminId,
          providerId: "credential",
          password: adminHash,
        },
      },
    },
  });

  const studentId = randomUUID();
  await prisma.user.create({
    data: {
      id: studentId,
      name: "手账同学",
      email: "student01@example.local",
      emailVerified: true,
      username: "student01",
      displayUsername: "student01",
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      accounts: {
        create: {
          id: randomUUID(),
          accountId: studentId,
          providerId: "credential",
          password: studentHash,
        },
      },
    },
  });

  const seedUserCount = 80;
  const seedUsers = Array.from({ length: seedUserCount }, (_, index) => {
    const suffix = String(index + 1).padStart(3, "0");
    return {
      id: randomUUID(),
      name: `种子同学 ${suffix}`,
      email: `seeduser${suffix}@example.local`,
      username: `seeduser${suffix}`,
      displayUsername: `seeduser${suffix}`,
      password: seedHash,
    };
  });

  await prisma.user.createMany({
    data: seedUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: true,
      username: user.username,
      displayUsername: user.displayUsername,
      role: UserRole.STUDENT,
      status: UserStatus.ACTIVE,
      createdAt: new Date(2026, 0, 1 + (Number(user.username.slice(-3)) % 45)),
      updatedAt: new Date(2026, 8, 1),
    })),
  });

  await prisma.account.createMany({
    data: seedUsers.map((user) => ({
      id: randomUUID(),
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: user.password,
      createdAt: new Date(2026, 0, 1),
      updatedAt: new Date(2026, 0, 1),
    })),
  });

  console.log("创建开课班次...");
  const currentTerm = termByName.get("2026-2027-1");
  if (!currentTerm) {
    throw new Error("缺少当前学期");
  }

  const offeringRecords: Array<{
    id: string;
    courseCode: string;
    courseName: string;
    termName: string;
    instructorName: string;
  }> = [];

  for (const course of courses) {
    const source = COURSES.find((item) => item.code === course.code);
    if (!source) continue;

    const courseInstructors = instructors.filter(
      (instructor) => instructor.collegeId === collegeId.get(source.college),
    );
    const primary =
      courseInstructors[course.code.charCodeAt(2) % courseInstructors.length] ?? instructors[0];
    const hasPreviousTerm = course.code.charCodeAt(1) % 2 === 0;

    const targetTerms = hasPreviousTerm
      ? [termByName.get("2025-2026-2"), currentTerm]
      : [currentTerm];

    for (const term of targetTerms) {
      if (!term) continue;
      const offering = await prisma.offering.create({
        data: {
          courseId: course.id,
          termId: term.id,
          section: "01",
          campus: "主校区",
          instructors: {
            create: {
              instructorId: primary.id,
              role: "PRIMARY",
            },
          },
        },
      });
      offeringRecords.push({
        id: offering.id,
        courseCode: course.code,
        courseName: course.name,
        termName: term.name,
        instructorName: primary.name,
      });
    }
  }

  console.log("创建评价、投票和举报...");
  const popularCodes = new Set(["CS301", "CS202", "ECON101", "LIT118", "SOC101", "MATH101"]);

  let reviewCount = 0;
  let voteCount = 0;
  const createdReviews: Array<{ id: string; authorId: string; offeringId: string }> = [];

  for (const [offeringIndex, offering] of offeringRecords.entries()) {
    let count: number;
    if (offering.courseCode === "BIO120" && offering.termName === "2026-2027-1") {
      count = 3;
    } else if (offering.courseCode === "ART120" && offering.termName === "2026-2027-1") {
      count = 0;
    } else if (popularCodes.has(offering.courseCode)) {
      count = randInt(6, 14);
    } else {
      count = randInt(0, 5);
    }

    for (let reviewIndex = 0; reviewIndex < count; reviewIndex += 1) {
      const author = seedUsers[(offeringIndex * 13 + reviewIndex * 7) % seedUsers.length];
      const difficulty = randInt(2, 5);
      const workload = randInt(1, 5);
      const recommendation = randInt(3, 5);
      const grading = randInt(2, 5);
      const teaching = randInt(3, 5);
      const assessment = Array.from(
        new Set([pick(ASSESSMENTS), pick(ASSESSMENTS), pick(ASSESSMENTS)]),
      );
      const tagNames = new Set<string>();
      if (workload >= 4) tagNames.add("作业多");
      if (difficulty >= 4) tagNames.add("硬核");
      if (recommendation >= 4) tagNames.add("给分好");
      if (recommendation >= 4 && workload <= 3) tagNames.add("轻松");
      if (assessment.includes("LAB")) tagNames.add("实验多");
      if (assessment.includes("PAPER")) tagNames.add("论文多");
      if (assessment.includes("ATTENDANCE")) tagNames.add("不点名");
      if (tagNames.size === 0) tagNames.add(pick(TAG_NAMES));

      const createdAt = new Date(2026, 0, 8 + ((offeringIndex * 19 + reviewIndex * 11) % 260));
      const status =
        reviewIndex === 0 && offeringIndex % 17 === 0
          ? ReviewStatus.PENDING
          : reviewIndex === 1 && offeringIndex % 23 === 0
            ? ReviewStatus.HIDDEN
            : ReviewStatus.PUBLISHED;

      const review = await prisma.review.create({
        data: {
          offeringId: offering.id,
          difficulty,
          workload,
          recommendation,
          grading,
          teaching,
          assessment,
          content: `${pick(REVIEW_TEMPLATES)} ${pick(EVALUATION_WORDS)}。`,
          status,
          createdAt,
          updatedAt: createdAt,
          editedAt: reviewIndex % 9 === 0 ? new Date(createdAt.getTime() + 86400000 * 3) : null,
          hiddenAt: status === ReviewStatus.HIDDEN ? createdAt : null,
          hiddenReason: status === ReviewStatus.HIDDEN ? "评价包含不适宜内容" : null,
        },
      });

      await prisma.reviewAuthor.create({
        data: { reviewId: review.id, userId: author.id, offeringId: offering.id },
      });

      const selectedTagIds = Array.from(tagNames)
        .map((name) => tagByName.get(name)?.id)
        .filter((id): id is string => Boolean(id));

      if (selectedTagIds.length > 0) {
        await prisma.reviewTag.createMany({
          data: selectedTagIds.map((tagId) => ({ reviewId: review.id, tagId })),
          skipDuplicates: true,
        });
      }

      const voterPool = seedUsers.filter((user) => user.id !== author.id);
      const voters = voterPool.slice(
        (offeringIndex + reviewIndex * 3) % 12,
        ((offeringIndex + reviewIndex * 3) % 12) + randInt(0, 10),
      );

      if (voters.length > 0) {
        await prisma.reviewVote.createMany({
          data: voters.map((voter) => ({ reviewId: review.id, userId: voter.id })),
          skipDuplicates: true,
        });
        await prisma.review.update({
          where: { id: review.id },
          data: { helpfulCount: voters.length },
        });
      }

      createdReviews.push({ id: review.id, authorId: author.id, offeringId: offering.id });
      reviewCount += 1;
      voteCount += voters.length;
    }
  }

  const reportableReviews = createdReviews.filter((_, index) => index % 37 === 5).slice(0, 4);
  for (const [index, review] of reportableReviews.entries()) {
    const reporter = seedUsers.find((user) => user.id !== review.authorId);
    if (!reporter) continue;
    await prisma.report.create({
      data: {
        reviewId: review.id,
        reporterId: reporter.id,
        reason: index % 2 === 0 ? ReportReason.PRIVACY : ReportReason.PERSONAL_ATTACK,
        detail: index % 2 === 0 ? "疑似包含个人联系方式。" : "疑似人身攻击。",
        status: ReportStatus.PENDING,
      },
    });
  }

  await prisma.auditLog.createMany({
    data: [
      {
        actorId: adminId,
        action: "COURSE_CREATE",
        targetType: "Course",
        metadata: { count: courses.length },
      },
      {
        actorId: adminId,
        action: "OFFERING_CREATE",
        targetType: "Offering",
        metadata: { count: offeringRecords.length },
      },
      {
        actorId: adminId,
        action: "SEED_DATA",
        targetType: "System",
        metadata: { reviews: reviewCount, votes: voteCount },
      },
    ],
  });

  console.log("");
  console.log("种子数据完成");
  console.log(
    `学院 ${colleges.length}，教师 ${instructors.length}，课程 ${courses.length}，班次 ${offeringRecords.length}`,
  );
  console.log(`用户 ${seedUsers.length + 2}，评价 ${reviewCount}，有用投票 ${voteCount}`);
  console.log("");
  console.log("种子账号：");
  console.log(`管理员：${adminUsername} / ${adminPassword}`);
  console.log("学生账号：student01 / Student2026");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

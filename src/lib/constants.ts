export const SITE_NAME = "课评手账";
export const SITE_NAME_EN = "COURSE ZINE";
export const SITE_DESCRIPTION =
  "学生匿名课程评价系统。记录难度、作业量和真实体验，帮下一届学生选课。";

export const THEME_STORAGE_KEY = "course-review-theme";
export const DEFAULT_THEME = "light" as const;

export const MIN_SAMPLE_SIZE = 5;
export const BAYES_M = 10;
export const EDIT_WINDOW_DAYS = 7;

export const REVIEW_CONTENT_MIN = 10;
export const REVIEW_CONTENT_MAX = 2000;
export const MAX_TAGS_PER_REVIEW = 5;

export const USERNAME_MIN_LENGTH = 5;
export const PASSWORD_MIN_LENGTH = 6;
export const USERNAME_PATTERN = /^[A-Za-z0-9]{5,}$/;
export const PASSWORD_PATTERN = /^[A-Za-z0-9@_]{6,}$/;

export const NAV_LINKS = [
  { href: "/courses", label: "翻课程" },
  { href: "/leaderboards", label: "榜单" },
  { href: "/write", label: "写一页" },
] as const;

export const MOBILE_NAV_LINKS = [
  { href: "/courses", label: "课程" },
  { href: "/leaderboards", label: "榜单" },
  { href: "/write", label: "写评价" },
  { href: "/me", label: "我的" },
] as const;

export const COURSE_TYPE_LABELS: Record<string, string> = {
  REQUIRED: "必修",
  ELECTIVE: "选修",
  GENERAL: "通识",
  PRACTICE: "实践",
};

export const REVIEW_STATUS_LABELS: Record<string, string> = {
  PENDING: "待审核",
  PUBLISHED: "已发布",
  HIDDEN: "已隐藏",
  DELETED: "已删除",
};

export const REPORT_REASON_LABELS: Record<string, string> = {
  PERSONAL_ATTACK: "人身攻击",
  PRIVACY: "泄露隐私",
  AD: "广告或引流",
  FALSE_INFO: "虚假信息",
  OFF_TOPIC: "与课程无关",
  OTHER: "其他",
};

export const REPORT_REASON_VALUES = [
  "PERSONAL_ATTACK",
  "PRIVACY",
  "AD",
  "FALSE_INFO",
  "OFF_TOPIC",
  "OTHER",
] as const;

export type ReportReasonValue = (typeof REPORT_REASON_VALUES)[number];

export const REPORT_STATUS_LABELS: Record<string, string> = {
  PENDING: "待处理",
  REVIEWING: "处理中",
  RESOLVED: "已解决",
  REJECTED: "已驳回",
};

export const ROLE_LABELS: Record<string, string> = {
  STUDENT: "学生",
  INSTRUCTOR: "教师",
  MODERATOR: "审核员",
  ADMIN: "管理员",
};

export const ASSESSMENT_OPTIONS = [
  { value: "CLOSED_BOOK_EXAM", label: "闭卷考试" },
  { value: "OPEN_BOOK_EXAM", label: "开卷考试" },
  { value: "PAPER", label: "课程论文" },
  { value: "PROJECT", label: "大作业" },
  { value: "LAB", label: "实验实践" },
  { value: "PRESENTATION", label: "口试或展示" },
  { value: "ATTENDANCE", label: "点名或出勤" },
  { value: "PARTICIPATION", label: "平时分" },
] as const;

export type AssessmentValue = (typeof ASSESSMENT_OPTIONS)[number]["value"];

export const ASSESSMENT_VALUES = ASSESSMENT_OPTIONS.map((item) => item.value) as [
  AssessmentValue,
  ...AssessmentValue[],
];

export const PRESET_TAGS = [
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

export const SCORE_LABELS = {
  difficulty: "难度",
  workload: "作业量",
  recommendation: "推荐度",
  grading: "给分友好度",
  teaching: "教学质量",
} as const;

export const SCORE_HINTS = {
  difficulty: "1 很轻松，5 很难",
  workload: "1 很少，5 很多",
  recommendation: "1 不推荐，5 强烈推荐",
  grading: "1 给分很严，5 给分很友好",
  teaching: "1 讲得吃力，5 讲得很好",
} as const;

export const RATE_LIMITS = {
  loginPerMinute: 10,
  registerPerHour: 5,
  reviewsPerHour: 5,
  reviewsPerDay: 20,
  editsPerDay: 10,
  votesPerHour: 60,
  reportsPerDay: 5,
  searchSuggestionsPerMinute: 60,
} as const;

export const NEW_ACCOUNT = {
  cooldownMinutes: 10,
  pendingReviewCount: 3,
} as const;

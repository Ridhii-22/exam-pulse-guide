export type SubjectRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type ChapterRow = {
  id: string;
  subject_id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type SyllabusVersionRow = {
  id: string;
  name: string;
  effective_year: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ChapterYearMappingRow = {
  id: string;
  chapter_id: string;
  syllabus_version_id: string;
  year: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type QuestionUploadItem = {
  question_text: string;
  subject: string;
  chapter: string;
  topic?: string;
  difficulty: string;
  options: string[];
  correct_answer: string;
  explanation?: string;
  year?: string;
  question_type: string;
};

export type BulkUploadResponse = {
  imported: number;
  skipped: number;
  errors: Array<{ row: number; message: string }>;
};

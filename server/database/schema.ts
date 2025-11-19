import { pgTable, uuid, text, timestamp, boolean, integer, jsonb } from 'drizzle-orm/pg-core'

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role').notNull().default('student'), // 'teacher' nebo 'student'
  createdAt: timestamp('created_at').defaultNow()
})

export const groups = pgTable('groups', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  qrCode: text('qr_code').notNull(),
  teacherId: uuid('teacher_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow()
})

export const goals = pgTable('goals', {
  id: uuid('id').primaryKey().defaultRandom(),
  groupId: uuid('group_id').references(() => groups.id).notNull(),
  title: text('title').notNull(),
  type: text('type').notNull(), // 'boolean' nebo 'percentage'
  targetCount: integer('target_count'), // pro percentage goals
  createdAt: timestamp('created_at').defaultNow()
})

export const studentProgress = pgTable('student_progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => users.id),
  groupId: uuid('group_id').references(() => groups.id),
  goalId: uuid('goal_id').references(() => goals.id),
  progress: integer('progress').default(0),
  completed: boolean('completed').default(false),
  needsHelp: boolean('needs_help').default(false),
  lastUpdated: timestamp('last_updated').defaultNow()
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => users.id),
  groupId: uuid('group_id').references(() => groups.id),
  content: text('content').notNull(),
  isRelevant: boolean('is_relevant').default(false),
  metadata: jsonb('metadata'), // pro uložení AI analýzy
  createdAt: timestamp('created_at').defaultNow()
})

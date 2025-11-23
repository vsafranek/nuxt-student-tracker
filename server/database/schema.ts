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
  assignmentMode: text('assignment_mode').notNull().default('uniform'),
  sharedAssignment: text('shared_assignment'),
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
  groupMemberId: uuid('group_member_id').references(() => groupMembers.id),
  progress: integer('progress').default(0),
  completed: boolean('completed').default(false),
  needsHelp: boolean('needs_help').default(false),
  lastUpdated: timestamp('last_updated').defaultNow()
})

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  studentId: uuid('student_id').references(() => users.id),
  groupId: uuid('group_id').references(() => groups.id),
  groupMemberId: uuid('group_member_id').references(() => groupMembers.id),
  content: text('content').notNull(),
  isRelevant: boolean('is_relevant').default(false),
  role: text('role').notNull().default('assistant'),
  metadata: jsonb('metadata'), // pro uložení AI analýzy
  createdAt: timestamp('created_at').defaultNow()
})

export const groupMembers = pgTable('group_members', {
  id: uuid('id').primaryKey().defaultRandom(),
  deviceId: text('device_id').notNull(), // Unique device identifier from localStorage
  groupId: uuid('group_id').references(() => groups.id).notNull(),
  nickname: text('nickname').notNull(),
  needsHelp: boolean('needs_help').default(false),
  helpRequestedAt: timestamp('help_requested_at'),
  lastActiveAt: timestamp('last_active_at').defaultNow(),
  joinedAt: timestamp('joined_at').defaultNow(),
  lastMessageContent: text('last_message_content'),
  lastMessageIsRelevant: boolean('last_message_is_relevant'),
  lastMessageGoalIndex: integer('last_message_goal_index'),
  lastMessageProgress: integer('last_message_progress'),
  lastMessageReason: text('last_message_reason'),
  lastMessageAt: timestamp('last_message_at')
})

export const appSettings = pgTable('app_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  teacherId: uuid('teacher_id').references(() => users.id).notNull().unique(),
  inactivityTimeoutMinutes: integer('inactivity_timeout_minutes').notNull().default(3),
  allowDirectAnswers: boolean('allow_direct_answers').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
})
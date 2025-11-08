import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('search_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').nullable().references('id').inTable('users').onDelete('SET NULL')
    table.string('query').notNullable()
    table.jsonb('query_understanding').nullable()
    table.integer('results_count').defaultTo(0)
    table.jsonb('filters').defaultTo('{}')
    table.string('session_id').nullable()
    table.string('ip_address').nullable()
    table.string('user_agent').nullable()
    table.timestamps(true, true)

    // Indexes for analytics
    table.index('user_id')
    table.index('created_at')
    table.index('query')
    table.index('session_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('search_logs')
}
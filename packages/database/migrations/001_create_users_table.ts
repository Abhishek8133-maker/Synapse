import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.string('email').notNullable().unique()
    table.string('name').nullable()
    table.string('avatar_url').nullable()
    table.jsonb('preferences').defaultTo('{}')
    table.timestamps(true, true)

    table.index('email')
    table.index('created_at')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('users')
}
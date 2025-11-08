import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('collections', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.string('name').notNullable()
    table.text('description').nullable()
    table.string('color').defaultTo('#3b82f6')
    table.string('icon').defaultTo('folder')
    table.boolean('is_public').defaultTo(false)
    table.timestamps(true, true)

    table.index('user_id')
    table.index('name')
    table.index('created_at')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('collections')
}
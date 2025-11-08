import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('thought_collections', (table) => {
    table.uuid('thought_id').notNullable().references('id').inTable('thoughts').onDelete('CASCADE')
    table.uuid('collection_id').notNullable().references('id').inTable('collections').onDelete('CASCADE')
    table.timestamps(true, true)

    // Primary key on both columns for many-to-many relationship
    table.primary(['thought_id', 'collection_id'])

    // Indexes for performance
    table.index('thought_id')
    table.index('collection_id')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('thought_collections')
}
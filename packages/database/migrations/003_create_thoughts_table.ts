import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  return knex.schema.createTable('thoughts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'))
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE')
    table.enum('type', ['product', 'quote', 'article', 'todo', 'note', 'image', 'video']).notNullable()
    table.string('title').notNullable()
    table.text('content').notNullable()
    table.jsonb('raw_content').nullable()
    table.jsonb('metadata').defaultTo('{}')
    table.string('source_url').nullable()
    table.string('source_favicon').nullable()
    table.specificType('tags', 'text[]').defaultTo('{}')
    table.string('embedding_id').nullable() // Reference to vector DB
    table.boolean('is_archived').defaultTo(false)
    table.boolean('is_favorite').defaultTo(false)
    table.timestamps(true, true)

    // Indexes for performance
    table.index('user_id')
    table.index('type')
    table.index('created_at')
    table.index('updated_at')
    table.index('is_archived')
    table.index('is_favorite')
    table.index('source_url')

    // GIN index for array and jsonb operations
    table.index('tags', 'gin')
    table.index('metadata', 'gin')

    // Full-text search index
    table.index('title', 'btree')
    table.index('content', 'btree')
  })
}

export async function down(knex: Knex): Promise<void> {
  return knex.schema.dropTable('thoughts')
}
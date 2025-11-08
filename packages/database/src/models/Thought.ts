import { db } from '../db'
import { Thought, ThoughtType, ThoughtMetadata } from '@synapse/shared-types'

export class ThoughtModel {
  static async findById(id: string): Promise<Thought | null> {
    const thought = await db('thoughts').where('id', id).first()
    return thought || null
  }

  static async findByUserId(
    userId: string,
    options: {
      limit?: number
      offset?: number
      type?: ThoughtType
      tags?: string[]
      isArchived?: boolean
      isFavorite?: boolean
    } = {}
  ): Promise<Thought[]> {
    const query = db('thoughts')
      .where('user_id', userId)
      .where('is_archived', options.isArchived ?? false)
      .orderBy('created_at', 'desc')

    if (options.type) {
      query.where('type', options.type)
    }

    if (options.isFavorite !== undefined) {
      query.where('is_favorite', options.isFavorite)
    }

    if (options.tags && options.tags.length > 0) {
      query.whereRaw('? = ANY(tags)', [options.tags])
    }

    if (options.limit) {
      query.limit(options.limit)
    }

    if (options.offset) {
      query.offset(options.offset)
    }

    return query
  }

  static async create(thoughtData: {
    user_id: string
    type: ThoughtType
    title: string
    content: string
    raw_content?: any
    metadata?: ThoughtMetadata
    source_url?: string
    source_favicon?: string
    tags?: string[]
  }): Promise<Thought> {
    const [thought] = await db('thoughts')
      .insert({
        ...thoughtData,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*')

    return thought
  }

  static async update(
    id: string,
    thoughtData: Partial<Thought>
  ): Promise<Thought | null> {
    const [thought] = await db('thoughts')
      .where('id', id)
      .update({
        ...thoughtData,
        updated_at: new Date(),
      })
      .returning('*')

    return thought || null
  }

  static async updateTags(id: string, tags: string[]): Promise<boolean> {
    const updatedCount = await db('thoughts')
      .where('id', id)
      .update({
        tags,
        updated_at: new Date(),
      })

    return updatedCount > 0
  }

  static async addToFavorites(id: string): Promise<boolean> {
    const updatedCount = await db('thoughts')
      .where('id', id)
      .update({
        is_favorite: true,
        updated_at: new Date(),
      })

    return updatedCount > 0
  }

  static async removeFromFavorites(id: string): Promise<boolean> {
    const updatedCount = await db('thoughts')
      .where('id', id)
      .update({
        is_favorite: false,
        updated_at: new Date(),
      })

    return updatedCount > 0
  }

  static async archive(id: string): Promise<boolean> {
    const updatedCount = await db('thoughts')
      .where('id', id)
      .update({
        is_archived: true,
        updated_at: new Date(),
      })

    return updatedCount > 0
  }

  static async unarchive(id: string): Promise<boolean> {
    const updatedCount = await db('thoughts')
      .where('id', id)
      .update({
        is_archived: false,
        updated_at: new Date(),
      })

    return updatedCount > 0
  }

  static async delete(id: string): Promise<boolean> {
    const deletedCount = await db('thoughts').where('id', id).del()
    return deletedCount > 0
  }

  static async search(
    userId: string,
    query: string,
    options: {
      limit?: number
      offset?: number
      types?: ThoughtType[]
      tags?: string[]
    } = {}
  ): Promise<Thought[]> {
    const dbQuery = db('thoughts')
      .where('user_id', userId)
      .where('is_archived', false)
      .where((builder) => {
        builder
          .where('title', 'ilike', `%${query}%`)
          .orWhere('content', 'ilike', `%${query}%`)
          .orWhereRaw('? = ANY(tags)', [query])
      })

    if (options.types && options.types.length > 0) {
      dbQuery.whereIn('type', options.types)
    }

    if (options.tags && options.tags.length > 0) {
      dbQuery.whereRaw('tags && ?', [options.tags])
    }

    dbQuery.orderBy('created_at', 'desc')

    if (options.limit) {
      dbQuery.limit(options.limit)
    }

    if (options.offset) {
      dbQuery.offset(options.offset)
    }

    return dbQuery
  }

  static async getStats(userId: string): Promise<{
    total: number
    byType: Record<ThoughtType, number>
    favorites: number
    archived: number
  }> {
    const stats = await db('thoughts')
      .where('user_id', userId)
      .select(
        db.raw('COUNT(*) as total'),
        db.raw('SUM(CASE WHEN is_favorite = true THEN 1 ELSE 0 END) as favorites'),
        db.raw('SUM(CASE WHEN is_archived = true THEN 1 ELSE 0 END) as archived'),
        db.raw('type')
      )
      .groupBy('type')

    const result = {
      total: 0,
      byType: {} as Record<ThoughtType, number>,
      favorites: 0,
      archived: 0,
    }

    stats.forEach((stat) => {
      result.total += parseInt(stat.total)
      result.byType[stat.type as ThoughtType] = parseInt(stat.total)
      if (stat.favorites > 0) result.favorites = parseInt(stat.favorites)
      if (stat.archived > 0) result.archived = parseInt(stat.archived)
    })

    return result
  }

  static async findRecent(
    userId: string,
    limit: number = 10
  ): Promise<Thought[]> {
    return db('thoughts')
      .where('user_id', userId)
      .where('is_archived', false)
      .orderBy('created_at', 'desc')
      .limit(limit)
  }

  static async findFavorites(
    userId: string,
    limit: number = 20
  ): Promise<Thought[]> {
    return db('thoughts')
      .where('user_id', userId)
      .where('is_favorite', true)
      .where('is_archived', false)
      .orderBy('updated_at', 'desc')
      .limit(limit)
  }
}
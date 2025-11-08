import { db } from '../db'
import { User } from '@synapse/shared-types'

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    const user = await db('users').where('id', id).first()
    return user || null
  }

  static async findByEmail(email: string): Promise<User | null> {
    const user = await db('users').where('email', email).first()
    return user || null
  }

  static async create(userData: {
    email: string
    name?: string
    avatar_url?: string
    preferences?: Record<string, any>
  }): Promise<User> {
    const [user] = await db('users')
      .insert({
        ...userData,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returning('*')

    return user
  }

  static async update(id: string, userData: Partial<User>): Promise<User | null> {
    const [user] = await db('users')
      .where('id', id)
      .update({
        ...userData,
        updated_at: new Date(),
      })
      .returning('*')

    return user || null
  }

  static async delete(id: string): Promise<boolean> {
    const deletedCount = await db('users').where('id', id).del()
    return deletedCount > 0
  }

  static async findOrCreate(userData: {
    email: string
    name?: string
    avatar_url?: string
    preferences?: Record<string, any>
  }): Promise<User> {
    let user = await this.findByEmail(userData.email)

    if (!user) {
      user = await this.create(userData)
    }

    return user
  }
}
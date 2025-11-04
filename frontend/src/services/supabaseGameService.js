// src/services/supabaseGameService.js
import { supabase } from '../config/supabase'

export const supabaseGameService = {
  getUserStats: async (userId) => {
    try {
      // Verificar que Supabase esté configurado
      if (!supabase || !userId) {
        throw new Error('Supabase no configurado o usuario no válido')
      }

      // Primero intentamos usar la función PostgreSQL si existe
      const { data, error } = await supabase
        .rpc('get_user_stats', { user_id_param: userId })

      if (!error && data && data.length > 0) {
        return {
          highestScore: data[0].highest_score || 0,
          totalGames: data[0].total_games || 0,
          averageScore: data[0].average_score || 0,
          lastScores: data[0].last_scores || []
        }
      }

      // Fallback: consulta manual
      return await getUserStatsFallback(userId)
    } catch (error) {
      console.error('Error fetching user stats:', error)
      // Devolver valores por defecto en caso de error
      return {
        highestScore: 0,
        totalGames: 0,
        averageScore: 0,
        lastScores: []
      }
    }
  },

  saveScore: async (userId, gameData) => {
    try {
      if (!supabase || !userId) {
        throw new Error('Supabase no configurado o usuario no válido')
      }

      const { data, error } = await supabase
        .from('game_scores')
        .insert([
          {
            user_id: userId,
            game_name: gameData.gameName || 'esquiva_islas',
            score: gameData.score,
            duration: gameData.duration || 0,
            created_at: new Date().toISOString()
          }
        ])
        .select()

      if (error) throw error
      return data[0]
    } catch (error) {
      console.error('Error saving score:', error)
      throw error
    }
  }
}

// Función fallback
const getUserStatsFallback = async (userId) => {
  try {
    const { data: scores, error } = await supabase
      .from('game_scores')
      .select('score, created_at')
      .eq('user_id', userId)
      .eq('game_name', 'esquiva_islas')
      .order('created_at', { ascending: false })

    if (error) throw error

    const highestScore = scores && scores.length > 0 ? Math.max(...scores.map(s => s.score)) : 0
    const totalGames = scores ? scores.length : 0
    const averageScore = scores && scores.length > 0 
      ? Math.round(scores.reduce((sum, item) => sum + item.score, 0) / scores.length)
      : 0
    const lastScores = scores ? scores.slice(0, 5).map(item => item.score) : []

    return { highestScore, totalGames, averageScore, lastScores }
  } catch (error) {
    console.error('Error in fallback:', error)
    return {
      highestScore: 0,
      totalGames: 0,
      averageScore: 0,
      lastScores: []
    }
  }
}
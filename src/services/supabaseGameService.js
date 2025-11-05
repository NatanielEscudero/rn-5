// src/services/supabaseGameService.js - VERSIÓN CORREGIDA
import { supabase } from '../config/supabase'

export const supabaseGameService = {
  getUserStats: async (userId) => {
    try {
      console.log('🔍 Getting stats for user:', userId);
      
      if (!supabase || !userId) {
        return getDefaultStats();
      }

      // Consultar puntuaciones del usuario
      const { data: scores, error } = await supabase
        .from('game_scores')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching scores:', error);
        return getDefaultStats();
      }

      console.log('📊 Scores found:', scores?.length || 0);

      // Calcular estadísticas
      const scoreValues = scores ? scores.map(s => s.score || 0) : [];
      const highestScore = scoreValues.length > 0 ? Math.max(...scoreValues) : 0;
      const totalGames = scoreValues.length;
      const averageScore = scoreValues.length > 0 
        ? Math.round(scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length)
        : 0;
      const lastScores = scoreValues.slice(0, 5);

      return { 
        highestScore, 
        totalGames, 
        averageScore, 
        lastScores 
      };
      
    } catch (error) {
      console.error('❌ Error in getUserStats:', error);
      return getDefaultStats();
    }
  },

  saveScore: async (userId, gameData) => {
    try {
      console.log('💾 Saving score for user:', userId);
      
      if (!supabase) {
        throw new Error('Supabase no configurado');
      }

      if (!userId) {
        throw new Error('Usuario no válido');
      }

      // PREPARAR DATOS CORRECTAMENTE
      const scoreData = {
        user_id: userId, // Esto debe ser UUID
        score: parseInt(gameData.score) || 0,
        duration: parseInt(gameData.duration) || 0,
        created_at: new Date().toISOString()
      };

      // Solo agregar game_name si la columna existe
      if (gameData.gameName) {
        scoreData.game_name = gameData.gameName;
      }

      console.log('📤 Inserting score data:', scoreData);

      // Intentar inserción simple
      const { data, error } = await supabase
        .from('game_scores')
        .insert([scoreData])
        .select();

      if (error) {
        console.error('❌ Insert error:', error);
        
        // Si falla, intentar sin SELECT (puede ser problema de RLS)
        const { error: simpleError } = await supabase
          .from('game_scores')
          .insert([scoreData]);
          
        if (simpleError) {
          throw simpleError;
        }
        
        console.log('✅ Score saved (without select)');
        return { id: 'local', ...scoreData };
      }

      console.log('✅ Score saved successfully:', data);
      return data[0];
      
    } catch (error) {
      console.error('❌ Error saving score:', error);
      throw error;
    }
  },

  // Método para diagnosticar la tabla
  diagnoseTable: async () => {
    try {
      const { data, error } = await supabase
        .from('game_scores')
        .select('*')
        .limit(1);

      return {
        success: !error,
        error: error?.message,
        sampleData: data?.[0]
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
};

const getDefaultStats = () => ({
  highestScore: 0,
  totalGames: 0,
  averageScore: 0,
  lastScores: []
});
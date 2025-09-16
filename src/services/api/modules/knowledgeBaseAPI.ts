import { invokeTauri } from '@/utils/tauriWrapper';
import type { KnowledgeBase } from '@/types';

export class KnowledgeBaseAPI {
  static async createKnowledgeBase(
    name: string,
    icon?: string,
    description?: string
  ): Promise<string> {
    try {
      return await invokeTauri('create_knowledge_base', { name, icon, description });
    } catch (error) {
      console.error('[KnowledgeBaseAPI] createKnowledgeBase failed:', error);
      throw error;
    }
  }

  static async getKnowledgeBases(): Promise<KnowledgeBase[]> {
    try {
      return await invokeTauri('get_knowledge_bases');
    } catch (error) {
      console.error('[KnowledgeBaseAPI] getKnowledgeBases failed:', error);
      throw error;
    }
  }

  static async getAllKnowledgeBases(): Promise<KnowledgeBase[]> {
    return this.getKnowledgeBases();
  }

  static async updateKnowledgeBase(
    id: string,
    name?: string,
    icon?: string,
    description?: string
  ): Promise<void> {
    try {
      await invokeTauri('update_knowledge_base', { id, name, icon, description });
    } catch (error) {
      console.error('[KnowledgeBaseAPI] updateKnowledgeBase failed:', error);
      throw error;
    }
  }

  static async deleteKnowledgeBase(id: string): Promise<void> {
    try {
      await invokeTauri('delete_knowledge_base', { id });
    } catch (error) {
      console.error('[KnowledgeBaseAPI] deleteKnowledgeBase failed:', error);
      throw error;
    }
  }

  static async searchKnowledgeBases(query: string): Promise<KnowledgeBase[]> {
    try {
      return await invokeTauri('search_knowledge_bases', { query });
    } catch (error) {
      console.error('[KnowledgeBaseAPI] searchKnowledgeBases failed:', error);
      throw error;
    }
  }
}

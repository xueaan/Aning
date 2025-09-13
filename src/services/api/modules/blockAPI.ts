import { invoke } from '@tauri-apps/api/core';
import type { Block } from '@/types';

export class BlockAPI {
  static async createBlock(pageId: string, blockType: string, content: string, parentId?: string, orderIndex?: number): Promise<string> {
    try {
      // Parameter validation
      if (!pageId || pageId.trim() === '') {
        throw new Error('Page ID is required and cannot be empty');
      }
      if (!blockType || blockType.trim() === '') {
        throw new Error('Block type is required and cannot be empty');
      }
      if (content === null || content === undefined) {
        throw new Error('Content is required (can be empty string)');
      }
      if (orderIndex !== undefined && orderIndex < 0) {
        throw new Error('Order index must be non-negative');
      }
      
      return await invoke('create_block', { 
        pageId: pageId.trim(), 
        blockType: blockType.trim(), 
        content, 
        parentId: parentId?.trim() || null, 
        orderIndex: orderIndex || 0 
      });
    } catch (error) {
      console.error('[BlockAPI] createBlock failed:', error);
      throw error;
    }
  }

  static async getBlocks(pageId: string, parentId?: string): Promise<Block[]> {
    try {
      // Parameter validation
      if (!pageId || pageId.trim() === '') {
        throw new Error('Page ID is required and cannot be empty');
      }
      
      return await invoke('get_blocks', { 
        pageId: pageId.trim(), 
        parentId: parentId?.trim() || null 
      });
    } catch (error) {
      console.error('[BlockAPI] getBlocks failed:', error);
      throw error;
    }
  }

  static async getBlockById(id: string): Promise<Block | null> {
    try {
      return await invoke('get_block_by_id', { id });
    } catch (error) {
      console.error('[BlockAPI] getBlockById failed:', error);
      throw error;
    }
  }

  static async updateBlock(id: string, content?: string, parentId?: string, orderIndex?: number): Promise<void> {
    try {
      // Parameter validation
      if (!id || id.trim() === '') {
        throw new Error('Block ID is required and cannot be empty');
      }
      if (content === undefined && parentId === undefined && orderIndex === undefined) {
        throw new Error('At least one field (content, parentId, or orderIndex) must be provided for update');
      }
      if (orderIndex !== undefined && orderIndex < 0) {
        throw new Error('Order index must be non-negative');
      }
      
      await invoke('update_block', { 
        id: id.trim(), 
        content, 
        parentId: parentId?.trim() || null, 
        orderIndex: orderIndex 
      });
    } catch (error) {
      console.error('[BlockAPI] updateBlock failed:', error);
      throw error;
    }
  }

  static async deleteBlock(id: string): Promise<void> {
    try {
      await invoke('delete_block', { id });
    } catch (error) {
      console.error('[BlockAPI] deleteBlock failed:', error);
      throw error;
    }
  }

  static async searchBlocks(pageId: string, query: string): Promise<Block[]>;
  static async searchBlocks(query: string, knowledgeBaseId?: string): Promise<Block[]>;
  static async searchBlocks(queryOrPageId: string, knowledgeBaseIdOrQuery?: string): Promise<Block[]> {
    try {
      // Handle overloaded method signatures
      if (knowledgeBaseIdOrQuery === undefined) {
        // Single parameter - global search
        return await invoke('search_blocks', { query: queryOrPageId });
      } else {
        // Two parameters - page-specific search
        return await invoke('search_blocks', { pageId: queryOrPageId, query: knowledgeBaseIdOrQuery });
      }
    } catch (error) {
      console.error('[BlockAPI] searchBlocks failed:', error);
      throw error;
    }
  }

  static async moveBlock(blockId: string, newParentId?: string, newOrderIndex: number = 0): Promise<void> {
    try {
      await invoke('move_block', { blockId, newParentId, newOrderIndex });
    } catch (error) {
      console.error('[BlockAPI] moveBlock failed:', error);
      throw error;
    }
  }
}
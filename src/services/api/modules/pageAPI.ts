import { invoke } from '@tauri-apps/api/core';
import type { Page } from '@/types';

export class PageAPI {
  static async createPage(knowledgeBaseId: string, title: string, parentId?: string, orderIndex?: number): Promise<string> {
    try {
      // Parameter validation
      if (!knowledgeBaseId || knowledgeBaseId.trim() === '') {
        throw new Error('Knowledge base ID is required and cannot be empty');
      }
      if (!title || title.trim() === '') {
        throw new Error('Page title is required and cannot be empty');
      }
      if (orderIndex !== undefined && orderIndex < 0) {
        throw new Error('Order index must be non-negative');
      }
      
      return await invoke('create_page', { 
        knowledgeBaseId: knowledgeBaseId.trim(), 
        title: title.trim(), 
        parentId: parentId?.trim() || null, 
        orderIndex: orderIndex || 0 
      });
    } catch (error) {
      console.error('[PageAPI] createPage failed:', error);
      throw error;
    }
  }

  static async getPages(knowledgeBaseId: string, parentId?: string): Promise<Page[]> {
    try {
      // Parameter validation
      if (!knowledgeBaseId || knowledgeBaseId.trim() === '') {
        throw new Error('Knowledge base ID is required and cannot be empty');
      }
      
      return await invoke('get_pages', { 
        knowledgeBaseId: knowledgeBaseId.trim(), 
        parentId: parentId?.trim() || null 
      });
    } catch (error) {
      console.error('[PageAPI] getPages failed:', error);
      throw error;
    }
  }

  static async getAllPages(knowledgeBaseId: string): Promise<Page[]> {
    try {
      return await invoke('get_all_pages', { knowledgeBaseId: knowledgeBaseId });
    } catch (error) {
      console.error('[PageAPI] getAllPages failed:', error);
      throw error;
    }
  }

  static async getPageById(id: string): Promise<Page | null> {
    try {
      return await invoke('get_page_by_id', { id });
    } catch (error) {
      console.error('[PageAPI] getPageById failed:', error);
      throw error;
    }
  }

  static async updatePage(id: string, title?: string, parentId?: string, orderIndex?: number): Promise<void> {
    try {
      // Parameter validation
      if (!id || id.trim() === '') {
        throw new Error('Page ID is required and cannot be empty');
      }
      if (title === undefined && parentId === undefined && orderIndex === undefined) {
        throw new Error('At least one field (title, parentId, or orderIndex) must be provided for update');
      }
      if (title !== undefined && title.trim() === '') {
        throw new Error('Page title cannot be empty');
      }
      if (orderIndex !== undefined && orderIndex < 0) {
        throw new Error('Order index must be non-negative');
      }
      
      await invoke('update_page', { 
        id: id.trim(), 
        title: title?.trim(), 
        parentId: parentId?.trim() || null, 
        orderIndex: orderIndex 
      });
    } catch (error) {
      console.error('[PageAPI] updatePage failed:', error);
      throw error;
    }
  }

  static async deletePage(id: string): Promise<void> {
    try {
      await invoke('delete_page', { id });
    } catch (error) {
      console.error('[PageAPI] deletePage failed:', error);
      throw error;
    }
  }

  static async searchPages(knowledgeBaseId: string, query: string): Promise<Page[]> {
    try {
      return await invoke('search_pages', { knowledgeBaseId: knowledgeBaseId, query });
    } catch (error) {
      console.error('[PageAPI] searchPages failed:', error);
      throw error;
    }
  }

  static async movePage(pageId: string, newParentId?: string, newOrderIndex: number = 0): Promise<void> {
    try {
      await invoke('move_page', { pageId: pageId, newParentId: newParentId, newOrderIndex: newOrderIndex });
    } catch (error) {
      console.error('[PageAPI] movePage failed:', error);
      throw error;
    }
  }

  static async getPageBreadcrumb(pageId: string): Promise<Page[]> {
    try {
      return await invoke('get_page_breadcrumb', { pageId: pageId });
    } catch (error) {
      console.error('[PageAPI] getPageBreadcrumb failed:', error);
      throw error;
    }
  }

  static async updatePageContent(pageId: string, _content: string, title?: string): Promise<void> {
    try {
      if (title !== undefined) {
        await this.updatePage(pageId, title);
      }
      // Content is typically handled through blocks, so this might delegate to block operations
      // For now, we'll keep it simple
    } catch (error) {
      console.error('[PageAPI] updatePageContent failed:', error);
      throw error;
    }
  }

  static async getPageContent(pageId: string): Promise<{ title: string; content: string }> {
    try {
      const page = await this.getPageById(pageId);
      if (!page) {
        throw new Error('Page not found');
      }
      return {
        title: page.title,
        content: '' // Content would typically come from blocks
      };
    } catch (error) {
      console.error('[PageAPI] getPageContent failed:', error);
      throw error;
    }
  }
}
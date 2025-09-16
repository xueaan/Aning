import { AiProviderType, AiConfig, AiAgent } from '@/types/aiConfig';
import { safeAiInvoke } from '@/utils/tauriWrapper';

// 数据库中AI提供商的结构
interface DbAiProvider {
  id?: number;
  provider: string;
  api_key: string;
  base_url?: string;
  model: string;
  temperature: number;
  max_tokens: number;
  system_prompt?: string;
  enabled: number; // 0 or 1
  is_current: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

// 数据库中AI智能体的结构
interface DbAiAgent {
  id?: number;
  agent_id: string;
  name: string;
  description: string;
  icon: string;
  system_prompt: string;
  temperature: number;
  max_tokens: number;
  provider?: string;
  model?: string;
  is_builtin: number; // 0 or 1
  is_current: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

/**
 * AI配置数据库同步服务
 */
export class AiConfigSync {
  // ===== AI提供商同步方法 =====

  /**
   * 保存AI提供商配置到数据库
   */
  static async saveAiProvider(
    provider: AiProviderType,
    config: AiConfig,
    isCurrent = false
  ): Promise<void> {
    const dbProvider: DbAiProvider = {
      provider,
      api_key: config.apiKey || '',
      base_url: config.baseURL,
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      system_prompt: config.systemPrompt,
      enabled: config.enabled ? 1 : 0,
      is_current: isCurrent ? 1 : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await safeAiInvoke('save_ai_provider', { provider: dbProvider });
  }

  /**
   * 从数据库获取所有AI提供商配置
   */
  static async getAiProviders(): Promise<{ [key in AiProviderType]?: AiConfig }> {
    const dbProviders: DbAiProvider[] =
      (await safeAiInvoke('get_ai_providers', undefined, [])) || [];
    const result: { [key in AiProviderType]?: AiConfig } = {};

    dbProviders.forEach((dbProvider) => {
      const providerType = dbProvider.provider as AiProviderType;
      result[providerType] = {
        provider: providerType,
        apiKey: dbProvider.api_key,
        baseURL: dbProvider.base_url,
        model: dbProvider.model,
        temperature: dbProvider.temperature,
        maxTokens: dbProvider.max_tokens,
        systemPrompt: dbProvider.system_prompt,
        enabled: dbProvider.enabled === 1,
      };
    });

    return result;
  }

  /**
   * 获取特定AI提供商配置
   */
  static async getAiProvider(provider: AiProviderType): Promise<AiConfig | null> {
    const dbProvider: DbAiProvider | null = await safeAiInvoke('get_ai_provider', {
      providerName: provider,
    });

    if (!dbProvider) {
      return null;
    }

    return {
      provider,
      apiKey: dbProvider.api_key,
      baseURL: dbProvider.base_url,
      model: dbProvider.model,
      temperature: dbProvider.temperature,
      maxTokens: dbProvider.max_tokens,
      systemPrompt: dbProvider.system_prompt,
      enabled: dbProvider.enabled === 1,
    };
  }

  /**
   * 删除AI提供商配置
   */
  static async deleteAiProvider(provider: AiProviderType): Promise<void> {
    await safeAiInvoke('delete_ai_provider', { providerName: provider });
  }

  /**
   * 设置当前AI提供商
   */
  static async setCurrentAiProvider(provider: AiProviderType): Promise<void> {
    await safeAiInvoke('set_current_ai_provider', { providerName: provider });
  }

  /**
   * 获取当前选中的AI提供商
   */
  static async getCurrentAiProvider(): Promise<AiProviderType | null> {
    const dbProviders: DbAiProvider[] =
      (await safeAiInvoke('get_ai_providers', undefined, [])) || [];
    const currentProvider = dbProviders.find((p) => p.is_current === 1);
    return currentProvider ? (currentProvider.provider as AiProviderType) : null;
  }

  // ===== AI智能体同步方法 =====

  /**
   * 保存AI智能体到数据库
   */
  static async saveAiAgent(agent: AiAgent, isCurrent = false): Promise<void> {
    const dbAgent: DbAiAgent = {
      agent_id: agent.id,
      name: agent.name,
      description: agent.description,
      icon: agent.icon,
      system_prompt: agent.systemPrompt,
      temperature: agent.temperature,
      max_tokens: agent.maxTokens,
      provider: agent.provider,
      model: agent.model,
      is_builtin: agent.isBuiltIn ? 1 : 0,
      is_current: isCurrent ? 1 : 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await safeAiInvoke('save_ai_agent', { agent: dbAgent });
  }

  /**
   * 从数据库获取所有AI智能体
   */
  static async getAiAgents(): Promise<AiAgent[]> {
    const dbAgents: DbAiAgent[] = (await safeAiInvoke('get_ai_agents', undefined, [])) || [];

    return dbAgents.map((dbAgent) => ({
      id: dbAgent.agent_id,
      name: dbAgent.name,
      description: dbAgent.description,
      icon: dbAgent.icon,
      systemPrompt: dbAgent.system_prompt,
      temperature: dbAgent.temperature,
      maxTokens: dbAgent.max_tokens,
      provider: dbAgent.provider as AiProviderType | undefined,
      model: dbAgent.model,
      isBuiltIn: dbAgent.is_builtin === 1,
      createdAt: new Date(dbAgent.created_at).getTime(),
      updatedAt: new Date(dbAgent.updated_at).getTime(),
    }));
  }

  /**
   * 获取特定AI智能体
   */
  static async getAiAgent(agentId: string): Promise<AiAgent | null> {
    const dbAgent: DbAiAgent | null = await safeAiInvoke<DbAiAgent>(
      'get_ai_agent',
      { agentId },
      undefined
    );

    if (!dbAgent) {
      return null;
    }

    return {
      id: dbAgent.agent_id,
      name: dbAgent.name,
      description: dbAgent.description,
      icon: dbAgent.icon,
      systemPrompt: dbAgent.system_prompt,
      temperature: dbAgent.temperature,
      maxTokens: dbAgent.max_tokens,
      provider: dbAgent.provider as AiProviderType | undefined,
      model: dbAgent.model,
      isBuiltIn: dbAgent.is_builtin === 1,
      createdAt: new Date(dbAgent.created_at).getTime(),
      updatedAt: new Date(dbAgent.updated_at).getTime(),
    };
  }

  /**
   * 删除AI智能体
   */
  static async deleteAiAgent(agentId: string): Promise<void> {
    await safeAiInvoke('delete_ai_agent', { agentId });
  }

  /**
   * 设置当前AI智能体
   */
  static async setCurrentAiAgent(agentId: string): Promise<void> {
    await safeAiInvoke('set_current_ai_agent', { agentId });
  }

  /**
   * 获取当前选中的AI智能体ID
   */
  static async getCurrentAiAgent(): Promise<string | null> {
    const dbAgents: DbAiAgent[] = (await safeAiInvoke('get_ai_agents', undefined, [])) || [];
    const currentAgent = dbAgents.find((a) => a.is_current === 1);
    return currentAgent ? currentAgent.agent_id : null;
  }

  // ===== 数据迁移和同步方法 =====

  /**
   * 将localStorage中的AI配置迁移到数据库
   */
  static async migrateFromLocalStorage(aiConfig: any): Promise<void> {
    try {
      // 迁移AI提供商配置
      if (aiConfig && typeof aiConfig === 'object') {
        const currentProvider = aiConfig.currentProvider;

        // 遍历所有提供商配置
        for (const [providerKey, config] of Object.entries(aiConfig)) {
          if (
            providerKey === 'currentProvider' ||
            providerKey === 'agents' ||
            providerKey === 'currentAgentId'
          ) {
            continue;
          }

          const providerType = providerKey as AiProviderType;
          const aiConfigData = config as AiConfig;

          if (aiConfigData && aiConfigData.provider) {
            await this.saveAiProvider(providerType, aiConfigData, providerType === currentProvider);
          }
        }

        // 迁移AI智能体配置
        if (aiConfig.agents && Array.isArray(aiConfig.agents)) {
          const currentAgentId = aiConfig.currentAgentId;

          for (const agent of aiConfig.agents) {
            await this.saveAiAgent(agent, agent.id === currentAgentId);
          }
        }
      }
    } catch (error) {
      console.error('AI配置迁移失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库加载完整的AI配置
   */
  static async loadFullAiConfig(): Promise<{
    providers: { [key in AiProviderType]?: AiConfig };
    currentProvider: AiProviderType | null;
    agents: AiAgent[];
    currentAgentId: string | null;
  }> {
    const [providers, currentProvider, agents, currentAgentId] = await Promise.all([
      this.getAiProviders(),
      this.getCurrentAiProvider(),
      this.getAiAgents(),
      this.getCurrentAiAgent(),
    ]);

    return {
      providers,
      currentProvider,
      agents,
      currentAgentId,
    };
  }

  /**
   * 检查是否需要数据迁移
   */
  static async needsMigration(): Promise<boolean> {
    try {
      const dbProviders: DbAiProvider[] =
        (await safeAiInvoke('get_ai_providers', undefined, [])) || [];
      // 如果数据库中没有任何提供商配置，则需要迁移
      return dbProviders.length === 0;
    } catch (error) {
      console.error('检查数据迁移状态失败', error);
      return true; // 出错时也进行迁移
    }
  }
}

// 导出所有状态管理
export { useAppStore } from './appStore';

// 业务模块 stores
export { useNoteStore } from './noteStore';
export { useTimelineStore } from './timelineStore';
export { useKnowledgeStore, useKnowledgeOperations } from './knowledgeStore';
export { useHomeStore } from './homeStore';
export { useMindBoardStore } from './mindBoardStore';
export { useTaskBoxStore } from './taskBoxStore';
export { useHabitStore } from './habitStore';
export { usePasswordStore } from './passwordStore';
export { useDialogueContextStore } from './dialogueContextStore';
export { useCardBoxStore } from './cardBoxStore';

// 知识库子模块 stores
export { useKnowledgeBaseStore } from './knowledge/knowledgeBaseStore';
export { usePageStore } from './knowledge/pageStore';
export { useSearchStore } from './knowledge/searchStore';
export { useEditorStore } from './knowledge/editorStore';

// 导出类型 (只导出实际导出的接口)
export type { KnowledgeStore } from './knowledgeStore';
export type { TaskBoxStore } from './taskBoxStore';
export type { HabitStore } from './habitStore';
export type { PasswordStore } from './passwordStore';
export type { HomeStore } from './homeStore';
export type { DialogueContextStore } from './dialogueContextStore';
export type { CardBox, Card, CardBoxUpdate, CardUpdate } from './cardBoxStore';


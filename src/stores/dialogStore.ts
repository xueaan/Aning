import { create } from 'zustand';

interface DialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

interface DialogStore extends DialogState {
  show: (options: Partial<DialogState>) => void;
  hide: () => void;
  confirm: () => void;
  cancel: () => void;
}

export const useDialogStore = create<DialogStore>((set, get) => ({
  isOpen: false,
  title: '确认',
  message: '',
  confirmText: '确定',
  cancelText: '取消',
  type: 'info',
  onConfirm: () => {},
  onCancel: () => {},

  show: (options) => {
    set({
      isOpen: true,
      title: options.title || '确认',
      message: options.message || '',
      confirmText: options.confirmText || '确定',
      cancelText: options.cancelText || '取消',
      type: options.type || 'info',
      onConfirm: options.onConfirm || (() => {}),
      onCancel: options.onCancel || (() => {}),
    });
  },

  hide: () => {
    set({ isOpen: false });
  },

  confirm: () => {
    const { onConfirm } = get();
    onConfirm();
    set({ isOpen: false });
  },

  cancel: () => {
    const { onCancel } = get();
    onCancel();
    set({ isOpen: false });
  },
}));

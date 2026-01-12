export type PlaybookCategory = 'research' | 'build' | 'optimize' | 'monitor';

export type FormFieldType = 'text' | 'textarea' | 'select' | 'multi-text';

export interface FormField {
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  description?: string;
  defaultValue?: string;
}

export interface PlaybookOption {
  label: string;
  value: string;
  // 用户填写的表单字段
  formFields?: FormField[];
  // 旧的方式（兼容性保留 - 用于简单的无参数 playbook）
  defaultPrompt?: string;
}

export interface Playbook {
  id: string;
  title: string;
  description: string;
  category: PlaybookCategory;
  agentName: string;
  autoActions: string[];
  outputs: string[];
  complexity: 'easy' | 'medium' | 'hard';
  tags: string[];
  options?: PlaybookOption[];
}


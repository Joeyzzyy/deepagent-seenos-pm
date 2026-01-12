"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormField, PlaybookOption } from "@/data/playbooks/types";
import { X, Plus } from "lucide-react";
import { useContextMenu } from "@/providers/ContextProvider";

interface PlaybookFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playbookId: string;  // Playbook 的 id
  playbookTitle: string;
  playbookDescription: string;
  option: PlaybookOption;
  onSubmit: (prompt: string) => void;
}

export function PlaybookFormDialog({
  open,
  onOpenChange,
  playbookId,
  playbookTitle,
  playbookDescription,
  option,
  onSubmit,
}: PlaybookFormDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [multiTextValues, setMultiTextValues] = useState<Record<string, string[]>>({});
  const { contextData } = useContextMenu();

  // 域名相关字段名列表
  const domainFieldNames = ['my_domain', 'domain', 'website', 'site', 'my_site', 'user_domain'];

  // 初始化表单默认值，优先从 Context 读取域名
  useEffect(() => {
    if (open && option.formFields) {
      const initialData: Record<string, any> = {};
      const userDomain = contextData.onSite.brandInfo.domain;

      option.formFields.forEach((field) => {
        // 优先检查是否是域名字段，且 Context 中有域名
        if (domainFieldNames.includes(field.name) && userDomain) {
          initialData[field.name] = userDomain;
        } else if (field.defaultValue) {
          initialData[field.name] = field.defaultValue;
        }
      });
      setFormData(initialData);
    }
  }, [open, option.formFields, contextData.onSite.brandInfo.domain]);

  const handleSubmit = () => {
    // 构建参数对象
    const params: Record<string, any> = {};
    
    option.formFields?.forEach((field) => {
      let value = formData[field.name];
      
      // 处理 multi-text 类型
      if (field.type === 'multi-text') {
        const items = [...(multiTextValues[field.name] || [])];
        // 如果输入框里有未添加的值，也包含进去
        const tempValue = formData[`${field.name}_temp`];
        if (tempValue && tempValue.trim()) {
          items.push(tempValue.trim());
        }
        value = items.length > 0 ? items : [];
      }
      
      // 如果没有值，使用默认值
      if (!value && field.defaultValue) {
        value = field.defaultValue;
      }
      
      params[field.name] = value || '';
    });
    
    // 构建 prompt（让 Agent 自己识别应该调用哪个 playbook）
    if (option.formFields) {
      // 生成简洁的任务描述 prompt
      let prompt = `Execute playbook: ${playbookTitle}\n\n`;
      
      // 添加参数
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value) && value.length > 0) {
          prompt += `${key}:\n${value.map((v, i) => `${i + 1}. ${v}`).join('\n')}\n\n`;
        } else if (value) {
          prompt += `${key}: ${value}\n`;
        }
      });
      
      console.log('[PLAYBOOK] Sending prompt:', prompt);
      onSubmit(prompt);
    } else if (option.defaultPrompt) {
      // 简单 playbook
      onSubmit(option.defaultPrompt);
    }
    
    // 重置表单
    setFormData({});
    setMultiTextValues({});
    onOpenChange(false);
  };

  const handleMultiTextAdd = (fieldName: string) => {
    const currentValues = multiTextValues[fieldName] || [];
    const newValue = formData[`${fieldName}_temp`] || '';
    if (newValue.trim()) {
      setMultiTextValues({
        ...multiTextValues,
        [fieldName]: [...currentValues, newValue.trim()],
      });
      setFormData({ ...formData, [`${fieldName}_temp`]: '' });
    }
  };

  const handleMultiTextRemove = (fieldName: string, index: number) => {
    const currentValues = multiTextValues[fieldName] || [];
    setMultiTextValues({
      ...multiTextValues,
      [fieldName]: currentValues.filter((_, i) => i !== index),
    });
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';

    switch (field.type) {
      case 'text':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <Input
              id={field.name}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              required={field.required}
            />
          </div>
        );

      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) =>
                setFormData({ ...formData, [field.name]: e.target.value })
              }
              required={field.required}
              rows={4}
            />
          </div>
        );

      case 'select':
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <Select
              value={value}
              onValueChange={(newValue) =>
                setFormData({ ...formData, [field.name]: newValue })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || "Select an option"} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'multi-text':
        const items = multiTextValues[field.name] || [];
        return (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {field.description && (
              <p className="text-xs text-muted-foreground">{field.description}</p>
            )}
            <div className="flex gap-2">
              <Input
                id={field.name}
                placeholder={field.placeholder}
                value={formData[`${field.name}_temp`] || ''}
                onChange={(e) =>
                  setFormData({ ...formData, [`${field.name}_temp`]: e.target.value })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleMultiTextAdd(field.name);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleMultiTextAdd(field.name)}
              >
                <Plus size={16} />
              </Button>
            </div>
            {items.length > 0 && (
              <div className="space-y-1 mt-2">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm p-2 bg-muted rounded"
                  >
                    <span className="flex-1">{item}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMultiTextRemove(field.name, index)}
                    >
                      <X size={14} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // 检查是否有表单字段
  const hasFormFields = option.formFields && option.formFields.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{playbookTitle}</DialogTitle>
          <DialogDescription>{playbookDescription}</DialogDescription>
        </DialogHeader>

        {hasFormFields ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="space-y-4 py-4"
          >
            {option.formFields!.map((field) => renderField(field))}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Start Analysis</Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This Playbook will execute automatically without additional input.
            </p>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Start Analysis</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


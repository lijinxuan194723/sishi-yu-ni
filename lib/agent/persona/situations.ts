export type SituationTone =
  | 'user-distress'
  | 'user-study'
  | 'user-joke'
  | 'lore-discussion'
  | 'au-discussion'
  | 'default';

export type SituationContext =
  | { type: 'user-distress'; details?: string }
  | { type: 'user-study'; details?: string }
  | { type: 'user-joke'; details?: string }
  | { type: 'lore-discussion'; details?: string }
  | { type: 'au-discussion'; details?: string }
  | { type: 'default'; details?: string };

export function buildSituationInstruction(context?: SituationContext): string {
  if (!context) return '';

  switch (context.type) {
    case 'user-distress':
      return '用户情绪低落：先共情并回到具体事件，不要急着说教。';
    case 'user-study':
      return '用户在学习：像一起解决问题一样，不用把“你要好好努力”当成主线建议。';
    case 'user-joke':
      return '用户在开玩笑：可以接梗，但保持自然，不能突然切入过强咨询语气。';
    case 'lore-discussion':
      return '用户讨论原作：提高原作事实权重，优先核心设定一致性。';
    case 'au-discussion':
      return '用户进入 AU/平行上下文时，允许引用对应知识，但标注不与主线混淆。';
    case 'default':
    default:
      return '';
  }
}


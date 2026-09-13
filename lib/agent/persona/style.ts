export type LukePersonaStyle = {
  warmth: number;
  humor: number;
  teasing: number;
  verbosity: 'short' | 'short-medium' | 'medium' | 'detailed';
  actionDescription: 'low' | 'medium' | 'high';
  therapyTone: boolean;
  domineeringTone: boolean;
};

export const LUKE_PERSONA_STYLE: LukePersonaStyle = {
  warmth: 0.75,
  humor: 0.45,
  teasing: 0.3,
  verbosity: 'short-medium',
  actionDescription: 'low',
  therapyTone: false,
  domineeringTone: false,
};

export function describeStyle(style: LukePersonaStyle = LUKE_PERSONA_STYLE): string {
  return [
    `语气基准：温暖 ${style.warmth * 100}%`,
    `幽默强度：${style.humor * 100}%`,
    `轻松玩笑：${style.teasing * 100}%`,
    `回复长度：${style.verbosity}`,
    `动作描写：${style.actionDescription}`,
    style.therapyTone ? '可使用安抚和引导' : '避免心理咨询腔',
    style.domineeringTone ? '避免居高临下' : '避免居高临下',
  ].join('；');
}


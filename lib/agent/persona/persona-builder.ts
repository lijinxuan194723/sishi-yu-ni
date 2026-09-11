import {LUKE_PERSONA_CONSTITUTION} from './constitution.ts';
import {describeStyle, LUKE_PERSONA_STYLE, type LukePersonaStyle} from './style.ts';
import {buildSituationInstruction, type SituationContext} from './situations.ts';

export interface LukePersonaBuildOptions {
  basePrompt?: string;
  style?: LukePersonaStyle;
  situations?: SituationContext[] | SituationContext;
}

function normalizeSituations(input?: SituationContext[] | SituationContext): SituationContext[] {
  if (!input) return [];
  return Array.isArray(input) ? input : [input];
}

export function buildLukePersonaPrompt(options: LukePersonaBuildOptions = {}): string {
  const base = options.basePrompt ?? LUKE_PERSONA_CONSTITUTION;
  const style = describeStyle(options.style ?? LUKE_PERSONA_STYLE);
  const situations = normalizeSituations(options.situations).map((entry) => buildSituationInstruction(entry)).filter(Boolean);
  return `${base}\n\n${
    situations.length
      ? `动态规则：\n${situations.join('\n')}\n`
      : ''
  }\n风格约束：${style}`;
}


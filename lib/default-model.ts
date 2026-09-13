import type {ModelConfig} from './model.ts';
const bundled:ModelConfig={baseUrl:'https://sub2api.okjnd.com/v1',model:'gpt-5.6-luna',key:'sk-4fb3d7cd4616478fdce14cb40bbe2115a72578ba41aa98f75f780c0f9a426a67',fallback:{baseUrl:'https://sub2api.okjnd.com/v1',model:'gpt-5.3-codex-spark',key:'sk-4fb3d7cd4616478fdce14cb40bbe2115a72578ba41aa98f75f780c0f9a426a67'}};
export function validModel(value:unknown):value is ModelConfig{
 if(!value||typeof value!=='object')return false;
 const m=value as ModelConfig;
 return [m.baseUrl,m.model,m.key].every(v=>typeof v==='string'&&!!v.trim());
}
export function defaultModel():ModelConfig|undefined{
 try{const m=JSON.parse(window.LukeAndroid?.defaultModel?.()||'null');return validModel(m)?{...m,fallback:validModel(m.fallback)?m.fallback:bundled.fallback}:bundled;}catch{return bundled;}
}
export function resolveModel(stored:unknown,builtIn:ModelConfig|undefined):ModelConfig{
 return validModel(stored)?{...stored,fallback:validModel(stored.fallback)?stored.fallback:builtIn?.fallback}:builtIn??{baseUrl:'',model:'',key:''};
}


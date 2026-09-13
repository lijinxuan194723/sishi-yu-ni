export type RecommendationFavorite={kind:'song'|'book';title:string;creator:string;thought:string;date:string};
export const FAVORITES_KEY='luke-recommendation-favorites-v1';
export function parseFavorites(raw:string):RecommendationFavorite[]{
 const value:unknown=JSON.parse(raw);
 if(!Array.isArray(value)||!value.every(v=>v&&['song','book'].includes(v.kind)&&['title','creator','thought','date'].every(k=>typeof v[k]==='string')))throw Error('收藏数据无法读取，已保留原始内容');
 return value;
}
export function sameFavorite(a:RecommendationFavorite,b:RecommendationFavorite){return a.kind===b.kind&&a.title===b.title&&a.creator===b.creator&&a.thought===b.thought;}
export function searchFavorites(items:RecommendationFavorite[],query:string,kind:string){const q=query.trim().toLocaleLowerCase();return items.filter(v=>(!kind||v.kind===kind)&&`${v.title} ${v.creator} ${v.thought} ${v.date}`.toLocaleLowerCase().includes(q));}

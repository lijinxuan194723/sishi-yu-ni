// Song titles and performers transcribed from the user's playlist screenshot.
export const songs=[
 ['如愿','王菲'],['开到荼蘼','王菲'],['人间蜉蝣','未知音素 / 徐深'],
 ['荒','曹昆'],['企鹅','曹昆'],['但求疼','谭维维'],['烈火','曹昆'],['渡','任和'],
 ['土坡上的狗尾草 (Live版)','谭维维 / 王赫野'],['野子','苏运莹'],['风吹丹顶鹤','葛东琪'],
 ['野人','孟维来'],['象人 (Live)','张驰'],['西门少年','李宇春'],
 ['曾经我也想过一了百了 (Live)','陈乐一 / 陆珂豪 / 小伍 / 阿圣 / 马万万'],
 ['盛夏光年 (Live)','陈冰'],['茫','李润祺'],['棕旨','Ice Paper / FOX胡天渝'],
 ['去远方','付俊乐'],['去追一只鹿','万象凡音 / 小时姑娘'],['红尘之客','管健嘉晨'],
 ['走向世界尽头的企鹅和背向人群的小丑','河图'],['天狗','太一'],
 ['美好的事可不可以发生在我身上 (Live版)','华晨宇'],['白痴','王菲'],['主角','王菲'],
 ['哀人 (i)','门尼'],['无名指 (The Rust)','门尼'],['抑人 (e)','银河快递 / 门尼'],
 ['罗曼蒂克乌托邦 (Utopia)','门尼'],
] as const;

export function shuffledSongs(previous=-1){
 const order=songs.map((_,i)=>i);
 for(let i=order.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[order[i],order[j]]=[order[j],order[i]];}
 if(order[0]===previous)[order[0],order[1]]=[order[1],order[0]];
 return order;
}


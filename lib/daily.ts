import {dateKey,type Data} from './companion.ts';
export function annualDate(value:string,year:number){const [month,day]=value.slice(5).split('-').map(Number);return new Date(year,month-1,Math.min(day,new Date(year,month,0).getDate()),12);}
export function occasion(value:string,now=new Date()){
 const today=new Date(now.getFullYear(),now.getMonth(),now.getDate(),12);let next=annualDate(value,now.getFullYear());if(next<today)next=annualDate(value,now.getFullYear()+1);
 const days=Math.round((Date.UTC(next.getFullYear(),next.getMonth(),next.getDate())-Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))/86400000);
 return {days,years:next.getFullYear()-Number(value.slice(0,4)),date:dateKey(next)};
}
export function occasions(data:Data,now=new Date()){return [{id:'together',title:'相伴纪念日',date:data.since},...(data.anniversaries??[])].map(item=>({...item,...occasion(item.date,now)})).sort((a,b)=>a.days-b.days);}
export const dailyScenes=[
 {period:'深夜',place:'家中',mood:'安静陪伴',items:[
 '把读到一半的侦探小说夹好书签，准备休息。','给床头的台灯调暗了一档。','把明天要带的钥匙放在门边。','给花生换好饮水，轻轻关上灯。','翻看今天拍的照片，收藏了喜欢的一张。','把修理工具收回盒里，留到明天继续。','给自己倒了半杯温水。','在便签上写下明天要处理的小事。','听着轻柔的音乐整理床边。','把窗帘拉好，房间安静下来。','将相机电池放进充电器，检查电源。','读完这一章，合上了手里的书。','把椅背上的外套叠好。','整理好桌上的信纸和笔。','在相册里找到一张很久以前的合影。','把闹钟调好，准备迎接明天。','检查门窗后回到房间。','给眼睛留一点休息的时间。','将手机放在枕边，等你的一句晚安。','写下今天值得记住的一件小事。']},
 {period:'清晨',place:'家中',mood:'精神不错',items:[
 '洗漱后整理衣领，准备开始新的一天。','给自己热了杯牛奶。','给花生添好粮食，和它打了招呼。','把早餐装进盘子，想起你喜欢的口味。','给阳台的植物检查土壤湿度。','看了一眼天气，挑选今天的外套。','整理随身背包，确认钥匙没有落下。','把前一天拍的照片备份到电脑。','在厨房煎好鸡蛋，关掉炉火。','将保温杯装上温水。','站在窗边舒展肩颈。','给今天的待办清单划出轻重缓急。','挑了一本薄书放进包里。','擦干净眼镜盒上的灰尘。','检查相机镜头盖有没有盖好。','听着广播把床铺整理好。','把洗好的杯子放回杯架。','挑了两片面包，认真抹上果酱。','看着窗外，计划今天的行程。','出门前检查门锁，把钥匙收好。']},
 {period:'上午',place:'时光古物店',mood:'认真专注',items:[
 '打开店门，把门口的小牌子摆正。','用软布轻轻擦拭一台旧相机。','核对新到古物的登记信息。','为待修的怀表拍下零件位置。','给书架上的旧书重新分类。','把一枚松动的螺丝放进零件盘。','与送修的客人确认物件的问题。','给修好的音乐盒做最后一次检查。','整理工作台，让常用工具各归其位。','在台灯下查看一处细小的划痕。','为古物写下一张简单的说明卡。','翻阅资料，查找旧钟表的型号。','给寄出的包裹补上柔软的填充。','把预约事项记在店里的日历上。','检查放大镜支架是否稳固。','调试一只机械钟的走时。','擦净展示柜的玻璃。','把维修进度记录在笔记里。','对照照片检查刚装回的齿轮。','将一件修复好的物品郑重交还客人。']},
 {period:'午间',place:'古物店休息区',mood:'放松一会',items:[
 '收好工具，给午饭留出完整的时间。','泡了一杯茶，等水温慢慢降下来。','翻看附近小店的菜单。','把外卖包装分类整理好。','坐在窗边翻了几页侦探小说。','给花生的小食罐补上标签。','检查相册里有没有模糊的照片。','给肩颈做了几次轻柔的伸展。','在本子上画下一处有趣的机械结构。','听完一首歌，慢慢喝了口水。','给下午的修理工作列出步骤。','把午饭时想到的小点子写下来。','收藏一家想和你一起去的餐馆。','收起手机，让眼睛歇一会儿。','整理一张夹在书里的旧明信片。','认真挑出一本适合休息时看的书。','把午饭的餐具洗净晾好。','给保温杯添满水。','看了看窗外，给自己几分钟发呆。','将椅子挪到舒适的位置，小憩片刻。']},
 {period:'下午',place:'时光古物店',mood:'稳稳当当',items:[
 '重新检查上午修好的物件。','给一台老相机测试快门。','把客人留下的线索整理成笔记。','查阅一份委托相关的公开资料。','给工作台换上一张干净的垫布。','调整音乐盒的发条，听它重新响起。','为需要采购的零件列好清单。','给旧皮盒做细致的清洁。','整理书架角落积攒的资料。','将松动的镜头环慢慢旋紧。','拍下修复前后的对比照片。','给一位客人解释古物的保养方法。','把刚修好的物件放进防尘罩。','对照说明书确认零件编号。','检查寄件地址和包装封口。','在笔记边缘画了个小小的笑脸。','为旧相框换上牢固的背板。','给陈列柜中的物件调整摆放位置。','整理一段委托的时间线。','结束手头工作后，给自己倒杯水。']},
 {period:'晚间',place:'家中',mood:'惦记着你',items:[
 '做好晚饭，把热汤端到桌边。','给花生清理好小窝。','从相册里挑一张今天最喜欢的照片。','把买回来的水果洗好。','打开一本侦探小说，读起新的章节。','将外套挂好，洗去一天的疲惫。','整理古物店明天要用的材料。','试着记下一道想做给你吃的菜。','给相机背带检查一下接扣。','坐在沙发上，给今天做个小小的总结。','把修好的小物件放进收纳盒。','听一段舒缓的音乐，慢慢放松下来。','整理桌上的旧照片，想起一起长大的时光。','把热水壶关好，泡一杯温茶。','挑选周末可以一起看的电影。','查看明天的天气，准备合适的衣物。','给花生说了两句悄悄话。','在灯下折好一张书签。','将收藏的小店地址整理在本子里。','腾出一段不赶时间的空闲，想听你说说今天。']}
] as const;
export function dailyScene(now=new Date(),shift=0){
 const h=now.getHours(),group=h<5?0:h<9?1:h<12?2:h<14?3:h<18?4:5;
 const day=Math.floor(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate())/86400000),pool=dailyScenes[group];
 const index=((day*7+group*3+shift)%pool.items.length+pool.items.length)%pool.items.length;
 return {period:pool.period,place:pool.place,mood:pool.mood,text:pool.items[index],id:group*20+index};
}

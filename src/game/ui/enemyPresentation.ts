export interface EnemyPresentationInput {viewportWidth:number;viewportHeight:number;fieldHeight:number;authoredDimension:number;isElite:boolean;isBoss:boolean;fitScale:number}
export interface EnemyPresentation {overviewDimension:number;localScale:number;bossCap:number}
export function enemyPresentation(i:EnemyPresentationInput):EnemyPresentation {
 const phone=Math.min(i.viewportWidth,i.viewportHeight)<600,desktop=!phone&&i.viewportWidth>=1024;
 const [minimum,maximum]=desktop?[32,48]:phone?[20,30]:[24,36];
 const bossCap=Math.max(0,Math.min(desktop?144:96,i.fieldHeight*(desktop?0.4:0.3)));
 const eliteMaximum=maximum*1.2;
 let dimension=i.isBoss?Math.min(bossCap,Math.max(eliteMaximum*1.25,i.authoredDimension)):Math.max(minimum,Math.min(i.isElite?eliteMaximum:maximum,i.authoredDimension));
 if(!i.isBoss)dimension=Math.min(dimension,bossCap*.8);
 return {overviewDimension:dimension,localScale:dimension/(Math.max(1,i.authoredDimension)*Math.max(.0001,i.fitScale)),bossCap};
}

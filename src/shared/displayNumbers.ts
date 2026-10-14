const formats=[0,1,2].map(maximumFractionDigits=>new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits}));
export function formatQuantity(value:number,digits:0|1|2=0):string {
 if(!Number.isFinite(value))return '—';
 const rounded=Number(value.toFixed(digits));
 return formats[digits].format(Object.is(rounded,-0)?0:rounded);
}
export const formatCount=(value:number):string=>formatQuantity(value,0);
export const formatPercent=(value:number):string=>`${formatQuantity(value,2)}%`;

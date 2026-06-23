export const notificationKeys={all:["notifications"]as const,list:(page:number)=>[...notificationKeys.all,"list",page]as const,count:()=>[...notificationKeys.all,"count"]as const};

export const reviewKeys={all:["reviews"] as const,list:(scope:string,id?:number)=>[...reviewKeys.all,scope,id] as const};

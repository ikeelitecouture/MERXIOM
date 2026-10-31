export const API = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');
export function token(){return localStorage.getItem('merxiom_token')||''}
export async function api<T=any>(path:string, init:RequestInit={}):Promise<T>{
  const headers:Record<string,string>={'Content-Type':'application/json',...(init.headers as Record<string,string>||{})};if(token())headers.Authorization=`Bearer ${token()}`;
  const response=await fetch(`${API}${path}`,{...init,headers,credentials:'include'});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||data.message||`Request failed (${response.status})`);return data as T;
}
export function money(value:number){return new Intl.NumberFormat('en-NG',{style:'currency',currency:'NGN',maximumFractionDigits:0}).format(value||0)}

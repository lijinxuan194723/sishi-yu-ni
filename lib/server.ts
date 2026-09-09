export function userId(request:Request){const id=request.headers.get('oai-authenticated-user-id');if(!id&&process.env.NODE_ENV==='development'&&new URL(request.url).hostname==='localhost')return 'local-preview';if(!id)throw new Error('UNAUTHORIZED');return id;}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin&&request.headers.get('content-type')?.startsWith('application/json');}
export function json(value:unknown,status=200){return Response.json(value,{status,headers:{'Cache-Control':'no-store'}});}


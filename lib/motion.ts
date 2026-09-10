import {flushSync} from 'react-dom';

type ViewTransitionLike={finished?:Promise<unknown>};
type TransitionDocument=Document&{startViewTransition?:(update:()=>void)=>ViewTransitionLike};

export function prefersReducedMotion(){return typeof window!=='undefined'&&window.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;}

export function smoothDomUpdate(update:()=>void){
 if(typeof document==='undefined'||prefersReducedMotion()){update();return;}
 const doc=document as TransitionDocument;
 if(!doc.startViewTransition){update();return;}
 try{doc.startViewTransition(()=>flushSync(update));}catch{update();}
}

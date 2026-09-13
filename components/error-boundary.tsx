'use client';
import {Component, type ErrorInfo, type ReactNode} from 'react';

type Props={children:ReactNode};
type State={failed:boolean;error?:Error};

export class ErrorBoundary extends Component<Props,State>{
 state:State={failed:false};
 static getDerivedStateFromError(error:Error){return {failed:true,error};}
 componentDidCatch(error:Error,info:ErrorInfo){console.error('四时与你页面错误',error,info); try{window.LukeAndroid?.pageReady?.();}catch{}}
 render(){
  if(!this.state.failed)return this.props.children;
  return <main className="app-error" role="alert"><h1>页面暂时没准备好</h1><p>已保存的聊天和手记不会因重新打开而清除，未保存内容可能无法恢复。</p>{this.state.error?.message&&<small className="app-error-detail">错误：{this.state.error.message}</small>}<button className="primary" onClick={()=>location.reload()}>重新打开</button></main>;
 }
}

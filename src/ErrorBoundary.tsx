import React from 'react';
export default class ErrorBoundary extends React.Component<{children: React.ReactNode},{err:any}>{
  constructor(p:any){ super(p); this.state={err:null}; }
  static getDerivedStateFromError(err:any){ return {err}; }
  render(){ return this.state.err
    ? <pre style={{color:'white',background:'#111',padding:16,whiteSpace:'pre-wrap'}}>{String(this.state.err?.stack||this.state.err)}</pre>
    : this.props.children; }
}

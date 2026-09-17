/**
 * Fake PeerJS for node tests — an in-memory "cloud" that pairs
 * host/guest DataConnections and delivers JSON messages async.
 *
 * Served to the app through a data: URL (see peer-loader.mjs) so the
 * host and guest phones share exactly one instance of this module.
 */
const FakeNet = { instances: new Map() };

function fire(target, ev, arg){ (target.h[ev]||[]).forEach(fn=>fn.call(target, arg)); }

class FakeConn {
  constructor(){ this.h={}; this.open=false; this.remote=null; }
  on(ev,fn){ (this.h[ev]=this.h[ev]||[]).push(fn); }
  send(d){
    if(!this.open || !this.remote || !this.remote.open) return;
    const copy = JSON.parse(JSON.stringify(d));
    setTimeout(()=>{ if(this.remote && this.remote.open) fire(this.remote,'data',copy); }, 0);
  }
  close(){
    if(!this.open) return;
    this.open=false; fire(this,'close');
    if(this.remote && this.remote.open){ this.remote.open=false; fire(this.remote,'close'); }
  }
}

function connectFlow(localPeer, id){
  const local = new FakeConn();
  localPeer._conns.push(local);
  setTimeout(()=>{
    const remotePeer = FakeNet.instances.get(id);
    if(!remotePeer || !remotePeer.open){ fire(localPeer,'error',{type:'peer-unavailable'}); return; }
    const remoteConn = new FakeConn();
    local.remote = remoteConn; remoteConn.remote = local;
    remotePeer._conns.push(remoteConn);
    fire(remotePeer,'connection',remoteConn);
    local.open = true;  fire(local,'open');
    remoteConn.open = true; fire(remoteConn,'open');
  }, 0);
  return local;
}

class FakePeer {
  constructor(id){
    this.id = id || ('g-'+Math.random().toString(36).slice(2,10));
    this.h={}; this._conns=[]; this.open=false;
    FakeNet.instances.set(this.id, this);
    setTimeout(()=>{ this.open=true; fire(this,'open',this.id); }, 0);
  }
  on(ev,fn){ (this.h[ev]=this.h[ev]||[]).push(fn); }
  destroy(){
    this.open=false;
    FakeNet.instances.delete(this.id);
    this._conns.forEach(c=>c.close());
    this._conns=[];
  }
  reconnect(){}
  connect(id){ return connectFlow(this, id); }
}

// __esModule marker → Vite-SSR interop keeps `default` unwrapped
export const __esModule = true;
export default FakePeer;
export { FakeNet, FakeConn };

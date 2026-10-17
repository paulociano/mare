'use strict';
/* MARÉ procedural bathymetry. Decorative enhancement of the semantic hub.
   One Three.js scene, one ShaderMaterial, no textures, no gameplay dependencies. */
(async()=>{
  const host=document.querySelector('[data-ocean-scene]');
  if(!host||typeof window.WebGL2RenderingContext==='undefined')return;
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
  const small=window.matchMedia('(max-width: 720px)');
  const motionOff=()=>reduced.matches||
   document.documentElement.dataset.mareMotion==='reduce'||
   document.documentElement.dataset.mareFocus==='on';
  if(motionOff()||small.matches||navigator.connection?.saveData)return;
  let THREE;
  try{
    // Pinned ESM build. CDN failure leaves the CSS ocean artwork intact.
    THREE=await import('https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js');
  }catch{return;}
  if(!host.isConnected||motionOff()||small.matches)return;
  let renderer;
  try{renderer=new THREE.WebGLRenderer({alpha:true,antialias:false,powerPreference:'low-power'});}
  catch{return;}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
  renderer.setClearColor(0x000000,0);
  renderer.domElement.setAttribute('aria-hidden','true');
  renderer.domElement.setAttribute('role','presentation');
  host.append(renderer.domElement);
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(47,1,.1,30);
  camera.position.set(0,.15,5.1);
  const geometry=new THREE.PlaneGeometry(6.5,5.2,72,56);
  const material=new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,
    uniforms:{uTime:{value:0}},
    vertexShader:[
      'uniform float uTime;',
      'varying vec2 vUv;',
      'varying float vHeight;',
      'void main(){',
      'vUv=uv;',
      'vec3 p=position;',
      'float wave=sin(p.x*2.4+uTime*.36)*.105;',
      'wave+=sin(p.y*3.5+p.x*1.4-uTime*.25)*.064;',
      'wave+=cos((p.x-p.y)*5.0+uTime*.18)*.025;',
      'p.z+=wave;vHeight=wave;',
      'gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0);',
      '}'
    ].join('\n'),
    fragmentShader:[
      'precision mediump float;',
      'uniform float uTime;',
      'varying vec2 vUv;',
      'varying float vHeight;',
      'void main(){',
      'vec2 uv=vUv;vec2 q=uv-.5;',
      'float warped=uv.y+sin(uv.x*7.5+uTime*.17)*.065;',
      'warped+=sin(uv.x*15.0-uv.y*5.0-uTime*.24)*.014;',
      'warped+=vHeight*.28;',
      'float contour=pow(1.0-abs(sin(warped*72.0)),23.0);',
      'float fine=pow(1.0-abs(sin(warped*145.0)),36.0);',
      'float ridge=exp(-length(q*vec2(1.4,1.1))*2.0);',
      'float bloom=pow(max(0.0,1.0-length((uv-vec2(.6,.55))*vec2(1.25,1.0))),2.4);',
      'vec3 base=mix(vec3(.018,.105,.16),vec3(.065,.30,.33),uv.x*.68+ridge*.28);',
      'base+=vec3(.055,.22,.20)*bloom;',
      'base+=vec3(.25,.64,.55)*contour*(.12+.42*ridge);',
      'base+=vec3(.12,.30,.28)*fine*.13;',
      'float edge=1.0-smoothstep(.25,.98,length(q*vec2(1.03,.98)));',
      'gl_FragColor=vec4(base,edge*.95);',
      '}'
    ].join('\n')
  });
  const mesh=new THREE.Mesh(geometry,material);
  mesh.rotation.set(-.08,-.16,-.07);
  scene.add(mesh);
  let disposed=false,visible=true,frame=0,last=0,lastTime=0,targetX=0;
  const resize=()=>{
    if(disposed)return;
    const width=Math.max(1,host.clientWidth),height=Math.max(1,host.clientHeight);
    renderer.setSize(width,height,false);
    camera.aspect=width/height;
    camera.updateProjectionMatrix();
  };
  resize();
  const resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(resize):null;
  resizeObserver?.observe(host);
  window.addEventListener('resize',resize,{passive:true});
  const draw=now=>{
    frame=0;
    if(disposed||!visible||document.hidden||reduced.matches)return;
    if(now-last>=33){
      const delta=Math.min(.05,(now-lastTime)/1000||0);
      lastTime=now;last=now;
      material.uniforms.uTime.value+=delta;
      camera.position.x+=(targetX-camera.position.x)*.035;
      renderer.render(scene,camera);
    }
    frame=requestAnimationFrame(draw);
  };
  const start=()=>{
    if(disposed||frame||!visible||document.hidden||motionOff())return;
    last=0;lastTime=0;frame=requestAnimationFrame(draw);
  };
  const stop=()=>{if(frame)cancelAnimationFrame(frame);frame=0;};
  const onPointerMove=event=>{
    const rect=host.getBoundingClientRect();
    targetX=Math.max(-.22,Math.min(.22,((event.clientX-rect.left)/Math.max(1,rect.width)-.5)*.35));
  };
  const onVisibility=()=>document.hidden?stop():start();
  const onMotion=()=>motionOff()?stop():start();
  const intersection=typeof IntersectionObserver==='function'
    ?new IntersectionObserver(entries=>{visible=entries.some(entry=>entry.isIntersecting);visible?start():stop();},{threshold:0})
    :null;
  intersection?.observe(host);
  const hero=host.closest('.mare-studio-hero');
  hero?.addEventListener('pointermove',onPointerMove,{passive:true});
  document.addEventListener('visibilitychange',onVisibility);
  reduced.addEventListener?.('change',onMotion);
  window.addEventListener('mare:accessibility',onMotion);
  const dispose=()=>{
    if(disposed)return;
    disposed=true;stop();intersection?.disconnect();resizeObserver?.disconnect();
    hero?.removeEventListener('pointermove',onPointerMove);
    window.removeEventListener('resize',resize);
    document.removeEventListener('visibilitychange',onVisibility);
    reduced.removeEventListener?.('change',onMotion);
    window.removeEventListener('mare:accessibility',onMotion);
    geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove();
  };
  renderer.domElement.addEventListener('webglcontextlost',event=>{
    event.preventDefault();dispose();
  },{once:true});
  window.addEventListener('pagehide',dispose,{once:true});
  start();
})().catch(()=>{/* GPU enhancement must never block playing. */});
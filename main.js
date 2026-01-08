(() => {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  function resize(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resize);
  resize();

  const world = {w: 2500, h: 1600};

  const camera = {x: world.w/2, y: world.h/2, zoom: 1};

  // simple map objects
  const house = {x: 800, y: 700, w: 140, h: 100};
  const lake = {x: 1600, y: 600, rx: 220, ry: 120};

  // input
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  // drag to pan
  let dragging = false, dragStart = null;
  canvas.addEventListener('mousedown', e => { dragging = true; dragStart = {x:e.clientX, y:e.clientY}; });
  window.addEventListener('mouseup', () => { dragging = false; dragStart = null; });
  window.addEventListener('mousemove', e => {
    if(!dragging) return;
    const dx = (e.clientX - dragStart.x) / camera.zoom;
    const dy = (e.clientY - dragStart.y) / camera.zoom;
    camera.x -= dx; camera.y -= dy;
    dragStart = {x:e.clientX, y:e.clientY};
  });

  // wheel to zoom
  canvas.addEventListener('wheel', e => {
    e.preventDefault();
    const delta = -e.deltaY * 0.001;
    camera.zoom = Math.max(0.4, Math.min(2.5, camera.zoom * (1+delta)));
  }, {passive:false});

  function worldToScreen(px, py){
    const sx = (px - camera.x) * camera.zoom + canvas.width/2;
    const sy = (py - camera.y) * camera.zoom + canvas.height/2;
    return {x:sx,y:sy};
  }

  function drawGrid(){
    const size = 64 * camera.zoom;
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    // vertical
    const topLeft = worldToScreen(0,0);
    const step = 64;
    for(let x=0;x<=world.w;x+=step){
      const s = worldToScreen(x,0);
      ctx.beginPath(); ctx.moveTo(s.x,0); ctx.lineTo(s.x,canvas.height); ctx.stroke();
    }
    for(let y=0;y<=world.h;y+=step){
      const s = worldToScreen(0,y);
      ctx.beginPath(); ctx.moveTo(0,s.y); ctx.lineTo(canvas.width,s.y); ctx.stroke();
    }
  }

  function drawHouse(obj){
    const s = worldToScreen(obj.x, obj.y);
    const w = obj.w * camera.zoom; const h = obj.h * camera.zoom;
    // body
    ctx.fillStyle = '#d2691e';
    ctx.fillRect(s.x - w/2, s.y - h/2, w, h);
    // roof
    ctx.fillStyle = '#8b0000';
    ctx.beginPath();
    ctx.moveTo(s.x - w/2 - 6, s.y - h/2);
    ctx.lineTo(s.x + w/2 + 6, s.y - h/2);
    ctx.lineTo(s.x, s.y - h/2 - (h/1.2));
    ctx.closePath(); ctx.fill();
    // door
    ctx.fillStyle = '#3b2f2f';
    const dw = w*0.2, dh = h*0.45;
    ctx.fillRect(s.x - dw/2, s.y + h/2 - dh, dw, dh);
    // windows
    ctx.fillStyle = '#bfefff';
    const wx = w*0.22, wy = h*0.22;
    ctx.fillRect(s.x - w*0.3 - wx/2, s.y - wy/2, wx, wy);
    ctx.fillRect(s.x + w*0.3 - wx/2, s.y - wy/2, wx, wy);
  }

  function drawLake(obj){
    const s = worldToScreen(obj.x, obj.y);
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, obj.rx*camera.zoom, obj.ry*camera.zoom, 0, 0, Math.PI*2);
    ctx.fillStyle = '#2a9df4'; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.stroke();
  }

  function clampCamera(){
    const halfW = canvas.width/2 / camera.zoom;
    const halfH = canvas.height/2 / camera.zoom;
    camera.x = Math.max(halfW, Math.min(world.w - halfW, camera.x));
    camera.y = Math.max(halfH, Math.min(world.h - halfH, camera.y));
  }

  function update(dt){
    const speed = 500; // world px / sec
    let vx=0, vy=0;
    if(keys['arrowleft'] || keys['a']) vx -= 1;
    if(keys['arrowright'] || keys['d']) vx += 1;
    if(keys['arrowup'] || keys['w']) vy -= 1;
    if(keys['arrowdown'] || keys['s']) vy += 1;
    if(vx||vy){
      const len = Math.hypot(vx,vy) || 1; vx/=len; vy/=len;
      camera.x += vx * speed * dt / camera.zoom;
      camera.y += vy * speed * dt / camera.zoom;
    }
    clampCamera();
  }

  function render(){
    ctx.save();
    // clear
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // sky/backdrop
    ctx.fillStyle = '#cfeefb';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // draw ground (large rectangle)
    const tl = worldToScreen(0,0);
    const br = worldToScreen(world.w, world.h);
    ctx.fillStyle = '#dff7d8';
    ctx.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);

    drawGrid();
    drawLake(lake);
    drawHouse(house);

    ctx.restore();
  }

  let last = performance.now();
  function loop(now){
    const dt = (now - last)/1000; last = now;
    update(dt);
    render();
    // update HUD
    const coords = document.getElementById('coords');
    coords.textContent = `x:${Math.round(camera.x)} y:${Math.round(camera.y)} zoom:${camera.zoom.toFixed(2)}`;
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

})();

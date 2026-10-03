document.addEventListener('DOMContentLoaded', function(){
  // Mobile navigation
  const menu=document.querySelector('.menu-toggle');
  const mobile=document.querySelector('.mobile-nav');
  if(menu && mobile){
    menu.addEventListener('click',()=>{
      const open=mobile.classList.toggle('open');
      menu.setAttribute('aria-expanded',String(open));
    });
    mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
      mobile.classList.remove('open');
      menu.setAttribute('aria-expanded','false');
    }));
  }

  // Horizontal rails
  document.querySelectorAll('.scroll-btn').forEach(btn=>btn.addEventListener('click',()=>{
    const rail=document.getElementById(btn.dataset.target);
    if(!rail)return;
    const amount=Math.min(rail.clientWidth*.78,430);
    rail.scrollBy({left:Number(btn.dataset.dir)*amount,behavior:'smooth'});
  }));
  document.querySelectorAll('.rail,.gallery-rail').forEach(rail=>{
    let down=false,start=0,left=0;
    rail.addEventListener('pointerdown',e=>{down=true;start=e.clientX;left=rail.scrollLeft;rail.setPointerCapture?.(e.pointerId);rail.style.cursor='grabbing'});
    rail.addEventListener('pointermove',e=>{if(down)rail.scrollLeft=left-(e.clientX-start)});
    ['pointerup','pointercancel','pointerleave'].forEach(t=>rail.addEventListener(t,()=>{down=false;rail.style.cursor='grab'}));
  });

  const year=document.getElementById('year'); if(year)year.textContent=new Date().getFullYear();

  // Book Now -> Zotel booking page
  const bookingUrl='https://www.zotel.ai/g-hotels?hotelID=1024&checkinDay=06&checkinMonth=10&checkinYear=2026&nights=1&num_adults=2&num_children=0';
  document.querySelectorAll('a,button').forEach(el=>{
    const label=(el.textContent||el.getAttribute('aria-label')||'').trim().toLowerCase();
    if(label.includes('book now') || label.includes('book your stay')){
      el.setAttribute('href',bookingUrl);
      el.addEventListener('click',e=>{
        if(el.tagName.toLowerCase()==='button') e.preventDefault();
        window.open(bookingUrl,'_blank','noopener,noreferrer');
      });
    }
  });

  // Customer enquiry -> WhatsApp with clean, emoji-friendly formatting
  const form=document.getElementById('enquiryForm');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      const name=document.getElementById('enquiryName')?.value.trim()||'';
      const phone=document.getElementById('enquiryWhatsapp')?.value.trim()||'';
      const message=document.getElementById('enquiryMessage')?.value.trim()||'';
      if(!name || !phone){
        alert('Please enter your name and WhatsApp number.');
        return;
      }
      const text=[
        '🏡 *MERINA VILLA – NEW ENQUIRY*',
        '',
        '👤 *Guest Name:* '+name,
        '📱 *WhatsApp Number:* '+phone,
        message ? '💬 *Enquiry:* '+message : '',
        '',
        '📌 Please contact me regarding my enquiry.',
        '🙏 Thank you!'
      ].filter(Boolean).join('\\n');
      const url='https://wa.me/917010597696?text='+encodeURIComponent(text);
      window.open(url,'_blank','noopener,noreferrer');
    });
  }

  // Continuous auto-scroll for every image rail (desktop + mobile).
  // The rail contains 3 identical copies. We move continuously from the
  // middle copy toward the left (which makes the images visually travel
  // left -> right), then wrap by exactly one copy width. This never reaches
  // the end of the duplicated content, so it cannot stop after one pass.
  document.querySelectorAll('.rail,.gallery-rail').forEach(rail=>{
    const originals=Array.from(rail.children);
    if(!originals.length) return;

    rail.querySelectorAll('[data-auto-clone="true"]').forEach(el=>el.remove());
    rail.style.scrollSnapType='none';
    rail.style.scrollBehavior='auto';
    rail.style.overflowX='auto';

    // Always keep three complete copies. This is important for sections with
    // only one, two, or three images.
    for(let copy=1; copy<3; copy++){
      originals.forEach(el=>{
        const clone=el.cloneNode(true);
        clone.dataset.autoClone='true';
        rail.appendChild(clone);
      });
    }

    let cycleWidth=0;
    let rafId=0;
    let lastTime=0;
    let paused=false;
    let resizeTimer=0;

    const getGap=()=>{
      const cs=getComputedStyle(rail);
      return parseFloat(cs.columnGap || cs.gap || '20') || 20;
    };

    const measure=()=>{
      const first=originals[0];
      const last=originals[originals.length-1];
      if(!first || !last) return 0;
      // Width from the first original to the end of the last original,
      // plus the gap before the next repeated copy.
      return (last.offsetLeft + last.offsetWidth - first.offsetLeft) + getGap();
    };

    const startPosition=()=>{
      cycleWidth=measure();
      if(cycleWidth>0){
        // Start at copy #2. There is one complete copy on either side,
        // giving plenty of room to scroll forever in either direction.
        rail.scrollLeft=cycleWidth;
      }
    };

    const getSpeed=()=>{
      const first=originals[0];
      if(!first) return 80;
      // One card advances every 2 seconds.
      const distance=Math.max(120, first.getBoundingClientRect().width + getGap());
      return distance/2;
    };

    const tick=(time)=>{
      if(!lastTime) lastTime=time;
      const dt=Math.min(64,time-lastTime)/1000;
      lastTime=time;

      if(!paused && cycleWidth>0){
        rail.scrollLeft -= getSpeed()*dt;

        // Seamless wrap. Because the content is duplicated exactly, adding
        // one cycle width produces the same visual frame with no pause.
        if(rail.scrollLeft <= 0){
          rail.scrollLeft += cycleWidth;
        }
      }
      rafId=requestAnimationFrame(tick);
    };

    const pause=()=>{paused=true;};
    const resume=()=>{
      paused=false;
      lastTime=performance.now();
    };

    // Manual dragging temporarily pauses the automatic movement.
    rail.addEventListener('pointerdown',pause);
    rail.addEventListener('pointerup',resume);
    rail.addEventListener('pointercancel',resume);
    rail.addEventListener('touchend',resume,{passive:true});

    window.addEventListener('resize',()=>{
      clearTimeout(resizeTimer);
      resizeTimer=setTimeout(()=>{
        const old=cycleWidth;
        cycleWidth=measure();
        if(cycleWidth>0 && old>0){
          // Preserve the same position within the repeated cycle after a
          // responsive resize instead of allowing the carousel to drift.
          const relative=((rail.scrollLeft % old)+old)%old;
          rail.scrollLeft=cycleWidth+Math.min(relative,cycleWidth-1);
        }else{
          startPosition();
        }
      },150);
    });

    startPosition();
    cancelAnimationFrame(rafId);
    rafId=requestAnimationFrame(tick);
  });

  // View photos -> full-screen lightbox
  const lightbox=document.getElementById('lightbox');
  const image=document.getElementById('lightboxImage');
  const caption=document.getElementById('lightboxCaption');
  const close=document.getElementById('lightboxClose');
  const prev=document.getElementById('lightboxPrev');
  const next=document.getElementById('lightboxNext');
  const links=Array.from(document.querySelectorAll('.view-photos[data-image]'));
  let index=0;
  function openPhoto(i){
    if(!lightbox || !image || !links.length)return;
    index=(i+links.length)%links.length;
    const link=links[index];
    image.src=link.getAttribute('data-image');
    image.alt=link.getAttribute('data-caption')||'Marina Villa photo';
    if(caption)caption.textContent=link.getAttribute('data-caption')||'';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden','false');
    document.body.classList.add('lightbox-open');
  }
  function closePhoto(){
    if(!lightbox)return;
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden','true');
    document.body.classList.remove('lightbox-open');
    if(image)image.removeAttribute('src');
  }
  links.forEach((link,i)=>link.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();openPhoto(i);}));
  close?.addEventListener('click',e=>{e.preventDefault();closePhoto();});
  prev?.addEventListener('click',e=>{e.preventDefault();openPhoto(index-1);});
  next?.addEventListener('click',e=>{e.preventDefault();openPhoto(index+1);});
  lightbox?.addEventListener('click',e=>{if(e.target===lightbox)closePhoto();});
  document.addEventListener('keydown',e=>{
    if(!lightbox?.classList.contains('open'))return;
    if(e.key==='Escape')closePhoto();
    if(e.key==='ArrowLeft')openPhoto(index-1);
    if(e.key==='ArrowRight')openPhoto(index+1);
  });
});

/* Responsive Google My Maps framing and estimate date minimum. */
(() => {
 const frame=document.getElementById('serviceMap');
 const compact=window.matchMedia('(max-width: 640px)');
 function frameMap(){if(!frame)return;const url=new URL(frame.src);const zoom=compact.matches?'9':'10';if(url.searchParams.get('z')!==zoom){url.searchParams.set('z',zoom);frame.src=url.href;}}
 frameMap();compact.addEventListener('change',frameMap);
 const date=document.getElementById('preferredDate');if(date){const now=new Date();date.min=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');}
})();

/* Keep preferred dates in the estimate form current. Service coverage uses Google My Maps. */
(() => { const preferredDate=document.getElementById('preferredDate'); if(preferredDate){const now=new Date();preferredDate.min=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');} })();

(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const r of document.querySelectorAll('link[rel="modulepreload"]'))t(r);new MutationObserver(r=>{for(const o of r)if(o.type==="childList")for(const l of o.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&t(l)}).observe(document,{childList:!0,subtree:!0});function s(r){const o={};return r.integrity&&(o.integrity=r.integrity),r.referrerPolicy&&(o.referrerPolicy=r.referrerPolicy),r.crossOrigin==="use-credentials"?o.credentials="include":r.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function t(r){if(r.ep)return;r.ep=!0;const o=s(r);fetch(r.href,o)}})();function $(e,n){return e.arrivalTime!==n.arrivalTime?e.arrivalTime-n.arrivalTime:e.inputIndex-n.inputIndex}function A(e,n){if(e.length===0)return{metrics:[],avgTurnaround:0,avgWaiting:0,avgResponse:0};const s=new Map;for(const a of n)if(a.pid!==null){const c=s.get(a.pid)||[];c.push(a),s.set(a.pid,c)}let t=0,r=0,o=0;const l=e.map(a=>{const c=s.get(a.id)||[],T=c.length>0?c[0].start:a.arrivalTime,d=c.length>0?c[c.length-1].end:a.arrivalTime,u=d-a.arrivalTime,p=u-a.burstTime,g=T-a.arrivalTime;return t+=u,r+=p,o+=g,{process:a,firstStartTime:T,completionTime:d,turnaroundTime:u,waitingTime:p,responseTime:g}}),i=e.length;return{metrics:l,avgTurnaround:t/i,avgWaiting:r/i,avgResponse:o/i}}function F(e){if(e.length===0)return{timeline:[],metrics:[],avgTurnaround:0,avgWaiting:0,avgResponse:0};const n=[...e].sort($),s=[];let t=0;for(const a of n)a.arrivalTime>t&&(s.push({pid:null,start:t,end:a.arrivalTime}),t=a.arrivalTime),s.push({pid:a.id,start:t,end:t+a.burstTime}),t+=a.burstTime;const{metrics:r,avgTurnaround:o,avgWaiting:l,avgResponse:i}=A(e,s);return{timeline:s,metrics:r,avgTurnaround:o,avgWaiting:l,avgResponse:i}}function k(e){if(e.length===0)return{timeline:[],metrics:[],avgTurnaround:0,avgWaiting:0,avgResponse:0};const n=[...e],s=[];let t=0;for(;n.length>0;){const a=n.filter(d=>d.arrivalTime<=t);if(a.length===0){const d=Math.min(...n.map(u=>u.arrivalTime));s.push({pid:null,start:t,end:d}),t=d;continue}a.sort((d,u)=>d.burstTime!==u.burstTime?d.burstTime-u.burstTime:$(d,u));const c=a[0];s.push({pid:c.id,start:t,end:t+c.burstTime}),t+=c.burstTime;const T=n.findIndex(d=>d.id===c.id);n.splice(T,1)}const{metrics:r,avgTurnaround:o,avgWaiting:l,avgResponse:i}=A(e,s);return{timeline:s,metrics:r,avgTurnaround:o,avgWaiting:l,avgResponse:i}}function H(e){if(e.length===0)return{timeline:[],metrics:[],avgTurnaround:0,avgWaiting:0,avgResponse:0};const n=new Map;for(const a of e)n.set(a.id,a.burstTime);const s=[];let t=0;for(;;){const a=e.filter(m=>m.arrivalTime<=t&&(n.get(m.id)??0)>0);if(a.length===0){const m=e.filter(v=>(n.get(v.id)??0)>0&&v.arrivalTime>t);if(m.length===0)break;const f=Math.min(...m.map(v=>v.arrivalTime));s.push({pid:null,start:t,end:f}),t=f;continue}a.sort((m,f)=>{const v=n.get(m.id),h=n.get(f.id);return v!==h?v-h:$(m,f)});const c=a[0],T=n.get(c.id),d=t+T,u=e.filter(m=>m.arrivalTime>t&&m.arrivalTime<d),p=Array.from(new Set(u.map(m=>m.arrivalTime))).sort((m,f)=>m-f);let g=!1;for(const m of p){const f=m-t,v=T-f,h=u.filter(E=>E.arrivalTime===m);if(Math.min(...h.map(E=>E.burstTime))<v){s.push({pid:c.id,start:t,end:m}),n.set(c.id,v),t=m,g=!0;break}}g||(s.push({pid:c.id,start:t,end:d}),n.set(c.id,0),t=d)}const{metrics:r,avgTurnaround:o,avgWaiting:l,avgResponse:i}=A(e,s);return{timeline:s,metrics:r,avgTurnaround:o,avgWaiting:l,avgResponse:i}}function W(e,n){if(e.length===0)return{timeline:[],metrics:[],avgTurnaround:0,avgWaiting:0,avgResponse:0};const s=new Map;for(const u of e)s.set(u.id,u.burstTime);const t=new Set,r=[],o=[];let l=0;const i=u=>{const p=e.filter(g=>!t.has(g.id)&&g.arrivalTime<=u);p.sort($);for(const g of p)t.add(g.id),r.push(g)};for(i(l);t.size<e.length||r.length>0;){if(r.length===0){const v=e.filter(b=>!t.has(b.id));if(v.length===0)break;const h=Math.min(...v.map(b=>b.arrivalTime));o.push({pid:null,start:l,end:h}),l=h,i(l);continue}const u=r.shift(),p=s.get(u.id),g=Math.min(n,p),m=l+g;o.push({pid:u.id,start:l,end:m});const f=p-g;s.set(u.id,f),l=m,i(l),f>0&&r.push(u)}const{metrics:a,avgTurnaround:c,avgWaiting:T,avgResponse:d}=A(e,o);return{timeline:o,metrics:a,avgTurnaround:c,avgWaiting:T,avgResponse:d}}const q=new Set(["FCFS","SJF","SRTF","RR"]);function O(e,n,s){var o;const t=[];q.has(n)||t.push(`Unknown algorithm: "${n}". Supported algorithms are FCFS, SJF, SRTF, RR.`),n==="RR"&&(!Number.isInteger(s)||s<=0)&&t.push(`Round-robin quantum must be a positive integer (received: ${s}).`),e.length===0&&t.push("At least one process must be provided.");const r=new Set;for(let l=0;l<e.length;l++){const i=e[l],a=(o=i.id)!=null&&o.trim()?`Process "${i.id.trim()}"`:`Process at position ${l+1}`;if(!i.id||i.id.trim()==="")t.push(`Process ID cannot be empty (at row ${l+1}).`);else{const c=i.id.trim();r.has(c)?t.push(`Duplicate process ID: "${c}". All process IDs must be unique.`):r.add(c)}(!Number.isInteger(i.arrivalTime)||i.arrivalTime<0)&&t.push(`${a} arrival time must be a nonnegative integer (received: ${i.arrivalTime}).`),(!Number.isInteger(i.burstTime)||i.burstTime<=0)&&t.push(`${a} CPU burst must be a positive integer (received: ${i.burstTime}).`)}return t.length>0?{valid:!1,errors:t}:{valid:!0}}const y=["#2563eb","#0d9488","#d97706","#7c3aed","#059669","#db2777","#4f46e5","#ea580c","#0284c7","#9333ea"];function D(e,n){const s=n.indexOf(e);if(s>=0)return y[s%y.length];let t=0;for(let r=0;r<e.length;r++)t=e.charCodeAt(r)+((t<<5)-t);return y[Math.abs(t)%y.length]}function U(e,n,s){if(e.innerHTML="",n.length===0){e.innerHTML='<p class="empty-hint">No timeline to display.</p>';return}const t=document.createElement("div");t.className="gantt-wrapper";const r=document.createElement("div");r.className="gantt-bar",r.setAttribute("role","img"),r.setAttribute("aria-label","CPU execution Gantt chart");const o=document.createElement("div");o.className="gantt-axis";for(let l=0;l<n.length;l++){const i=n[l],a=i.end-i.start,c=document.createElement("div");if(c.className="gantt-block",c.style.flex=`${a} 0 0%`,i.pid===null)c.classList.add("gantt-block-idle"),c.setAttribute("title",`CPU Idle: [${i.start}, ${i.end}) (${a} units)`),c.innerHTML=`<span class="gantt-label">Idle</span><span class="gantt-duration">${a}</span>`;else{c.classList.add("gantt-block-proc");const p=D(i.pid,s);c.style.backgroundColor=p,c.setAttribute("title",`${i.pid}: [${i.start}, ${i.end}) (${a} units)`),c.innerHTML=`<span class="gantt-label">${J(i.pid)}</span><span class="gantt-duration">${a}</span>`}r.appendChild(c);const d=document.createElement("div");d.className="gantt-tick",d.style.flex=`${a} 0 0%`;const u=document.createElement("span");if(u.className="tick-start",u.textContent=i.start.toString(),d.appendChild(u),l===n.length-1){const p=document.createElement("span");p.className="tick-end",p.textContent=i.end.toString(),d.appendChild(p)}o.appendChild(d)}t.appendChild(r),t.appendChild(o),e.appendChild(t)}function J(e){const n=document.createElement("div");return n.textContent=e,n.innerHTML}function S(e){return Number.isInteger(e)?e.toString():Number(e.toFixed(2)).toString()}function V(e,n){if(e.innerHTML="",n.metrics.length===0){e.innerHTML='<p class="empty-hint">No simulation results to display.</p>';return}const s=document.createElement("div");s.className="table-responsive";const t=document.createElement("table");t.className="metrics-table",t.setAttribute("aria-label","Scheduling simulation results");const r=document.createElement("thead");r.innerHTML=`
    <tr>
      <th scope="col">Process ID</th>
      <th scope="col">Arrival Time</th>
      <th scope="col">CPU Burst</th>
      <th scope="col">First Start</th>
      <th scope="col">Completion</th>
      <th scope="col">Turnaround</th>
      <th scope="col">Waiting</th>
      <th scope="col">Response</th>
    </tr>
  `,t.appendChild(r);const o=document.createElement("tbody");for(const i of n.metrics){const a=document.createElement("tr");a.innerHTML=`
      <td class="font-medium">${_(i.process.id)}</td>
      <td>${i.process.arrivalTime}</td>
      <td>${i.process.burstTime}</td>
      <td>${i.firstStartTime}</td>
      <td>${i.completionTime}</td>
      <td>${i.turnaroundTime}</td>
      <td>${i.waitingTime}</td>
      <td>${i.responseTime}</td>
    `,o.appendChild(a)}t.appendChild(o);const l=document.createElement("tfoot");l.innerHTML=`
    <tr class="summary-row">
      <th scope="row" colspan="5" class="summary-title">Average</th>
      <td class="summary-value" title="Average Turnaround Time">${S(n.avgTurnaround)}</td>
      <td class="summary-value" title="Average Waiting Time">${S(n.avgWaiting)}</td>
      <td class="summary-value" title="Average Response Time">${S(n.avgResponse)}</td>
    </tr>
  `,t.appendChild(l),s.appendChild(t),e.appendChild(s)}function _(e){const n=document.createElement("div");return n.textContent=e,n.innerHTML}const N=[{id:"P1",arrivalTime:0,burstTime:8},{id:"P2",arrivalTime:1,burstTime:4},{id:"P3",arrivalTime:2,burstTime:2},{id:"P4",arrivalTime:4,burstTime:1}],G=[{id:"P1",arrivalTime:2,burstTime:3},{id:"P2",arrivalTime:2,burstTime:1},{id:"P3",arrivalTime:8,burstTime:2},{id:"P4",arrivalTime:9,burstTime:1}],I=document.getElementById("process-tbody"),K=document.getElementById("btn-add-process"),j=document.getElementById("btn-load-a"),z=document.getElementById("btn-load-b"),w=document.getElementById("algo-select"),Q=document.getElementById("quantum-field"),M=document.getElementById("quantum-input"),X=document.getElementById("btn-run"),R=document.getElementById("validation-errors"),C=document.getElementById("results-section"),Y=document.getElementById("gantt-container"),Z=document.getElementById("metrics-container");let L=1;function x(e="",n=0,s=1){const t=document.createElement("tr");return t.className="proc-row",t.innerHTML=`
    <td>
      <input
        type="text"
        class="form-control proc-id"
        aria-label="Process ID"
        value="${re(e)}"
        placeholder="e.g. P1"
      />
    </td>
    <td>
      <input
        type="number"
        class="form-control proc-arrival"
        aria-label="Arrival Time"
        min="0"
        step="1"
        value="${n}"
      />
    </td>
    <td>
      <input
        type="number"
        class="form-control proc-burst"
        aria-label="CPU Burst"
        min="1"
        step="1"
        value="${s}"
      />
    </td>
    <td>
      <button type="button" class="btn btn-danger-outline btn-remove-row" aria-label="Remove process">
        Remove
      </button>
    </td>
  `,t.querySelector(".btn-remove-row").addEventListener("click",()=>{t.remove()}),t}function P(e){I.innerHTML="";for(const n of e)I.appendChild(x(n.id,n.arrivalTime,n.burstTime));L=e.length+1}function ee(){return Array.from(I.querySelectorAll(".proc-row")).map((n,s)=>{const t=n.querySelector(".proc-id"),r=n.querySelector(".proc-arrival"),o=n.querySelector(".proc-burst"),l=t?t.value.trim():"",i=r&&r.value!==""?Number(r.value):NaN,a=o&&o.value!==""?Number(o.value):NaN;return{id:l,arrivalTime:i,burstTime:a,inputIndex:s}})}function B(){const e=w.value==="RR";Q.style.display=e?"flex":"none"}function te(){const e=ee(),n=w.value,s=M.value!==""?Number(M.value):NaN,t=O(e,n,s);if(!t.valid){R.style.display="block",R.innerHTML=`
      <strong>Validation Error${t.errors.length>1?"s":""}:</strong>
      <ul>
        ${t.errors.map(o=>`<li>${ne(o)}</li>`).join("")}
      </ul>
    `,C.style.display="none";return}R.style.display="none",R.innerHTML="";let r;switch(n){case"FCFS":r=F(e);break;case"SJF":r=k(e);break;case"SRTF":r=H(e);break;case"RR":r=W(e,s);break;default:return}C.style.display="block",U(Y,r.timeline,e.map(o=>o.id)),V(Z,r),C.scrollIntoView({behavior:"smooth",block:"nearest"})}function ne(e){const n=document.createElement("div");return n.textContent=e,n.innerHTML}function re(e){return e.replace(/"/g,"&quot;")}K.addEventListener("click",()=>{const e=x(`P${L}`,0,1);L++,I.appendChild(e);const n=e.querySelector(".proc-id");n&&n.focus()});j.addEventListener("click",()=>{P(N)});z.addEventListener("click",()=>{P(G)});w.addEventListener("change",B);X.addEventListener("click",te);P(N);B();

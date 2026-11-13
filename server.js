require('dotenv').config();
const express = require('express');
const path = require('path');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const port = Number(process.env.PORT || 3000);
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const jwtSecret = process.env.APP_JWT_SECRET;
const appOrigin = process.env.APP_ORIGIN || `http://localhost:${port}`;
const googleClient = new OAuth2Client(googleClientId);
app.use(express.json({ limit: '32kb' }));
app.use(express.static(__dirname));

const agents = [
  { id:'task-management-agent', name:'Task Management Agent', role:'Tasks and priorities', responsibility:'Creates, prioritizes, and tracks personal and work tasks; flags deadlines and follow-ups.', capabilities:['task.create','task.prioritize','task.complete'] },
  { id:'finance-agent', name:'Finance Agent', role:'Budgets and expenses', responsibility:'Categorizes expenses, tracks budget limits, and prepares bill reminders from user-provided data.', capabilities:['finance.summary','finance.expense.create','finance.budget.review'] },
  { id:'document-agent', name:'Document Agent', role:'Documents and expiry dates', responsibility:'Organizes document records and tracks renewal or expiry reminders.', capabilities:['document.list','document.reminder.create','document.reminder.complete'] },
  { id:'shopping-agent', name:'Shopping Agent', role:'Lists and recommendations', responsibility:'Maintains shopping lists and can prepare recommendations when product data is connected.', capabilities:['shopping.list','shopping.item.create','shopping.item.remove'] },
  { id:'scheduling-agent', name:'Scheduling Agent', role:'Appointments and reminders', responsibility:'Organizes appointments, time blocks, and reminder suggestions.', capabilities:['schedule.list','schedule.event.create','schedule.coordinate'] },
  { id:'central-coordinator', name:'Central Coordinator', role:'Multi-agent planning', responsibility:'Breaks a request into steps, routes each step to specialist agents, and returns a reviewable plan.', capabilities:['agent.list','agent.plan','dashboard.overview'] }
];
const data = {
  tasks:[
    {id:crypto.randomUUID(),title:'Review Q4 project proposal',category:'Work',due:'Today',done:true,owner:'task-management-agent'},
    {id:crypto.randomUUID(),title:'Reply to Maya about Saturday',category:'Personal',due:'Today',done:true,owner:'task-management-agent'},
    {id:crypto.randomUUID(),title:'Pick up prescription',category:'Errand',due:'Today',done:false,owner:'task-management-agent'},
    {id:crypto.randomUUID(),title:'Pay electricity bill',category:'Home',due:'Tomorrow',done:false,owner:'finance-agent'},
    {id:crypto.randomUUID(),title:'Plan weekend groceries',category:'Shopping',due:'Today',done:false,owner:'shopping-agent'}
  ],
  events:[
    {id:crypto.randomUUID(),time:'11:30 AM',title:'Weekly team check-in',detail:'Google Meet · 30 min',category:'Work'},
    {id:crypto.randomUUID(),time:'2:00 PM',title:'Dental check-up',detail:'Bright Smile Clinic · 45 min',category:'Personal'},
    {id:crypto.randomUUID(),time:'4:30 PM',title:'Focus time',detail:'Finish proposal edits · 1 hour',category:'Focus'}
  ],
  expenses:[
    {id:crypto.randomUUID(),category:'Groceries',amount:8450,date:'Nov 10'},
    {id:crypto.randomUUID(),category:'Transport',amount:3200,date:'Nov 8'},
    {id:crypto.randomUUID(),category:'Dining',amount:5680,date:'Nov 6'},
    {id:crypto.randomUUID(),category:'Utilities',amount:4250,date:'Nov 4'},
    {id:crypto.randomUUID(),category:'Other',amount:3100,date:'Nov 2'}
  ],
  budget:40000,
  documents:[
    {id:crypto.randomUUID(),name:'Vehicle insurance',type:'Policy renewal',date:'Dec 5, 2026'},
    {id:crypto.randomUUID(),name:'Passport',type:'Expiry',date:'Mar 12, 2027'}
  ],
  shopping:['Oat milk','Fresh berries','Dish soap','Coffee beans']
};
const workspaces = new Map();

app.get('/api/config',(req,res)=>res.json({googleClientId:googleClientId||null}));
app.post('/api/auth/google',async(req,res)=>{
  if(!googleClientId||!jwtSecret)return res.status(503).json({error:'Google sign-in is not configured. Set GOOGLE_CLIENT_ID and APP_JWT_SECRET in .env.'});
  if(req.get('origin')!==appOrigin)return res.status(403).json({error:`Sign-in requests must come from ${appOrigin}.`});
  const credential=req.body&&req.body.credential;
  if(typeof credential!=='string')return res.status(400).json({error:'Missing Google credential.'});
  try{
    const ticket=await googleClient.verifyIdToken({idToken:credential,audience:googleClientId});
    const p=ticket.getPayload();
    if(!p||!p.sub||!p.email_verified)return res.status(401).json({error:'Google account could not be verified.'});
    const token=jwt.sign({sub:p.sub,email:p.email,name:p.name||p.email,picture:p.picture||null},jwtSecret,{expiresIn:'8h',issuer:'daylight-local'});
    res.json({token,user:{id:p.sub,email:p.email,name:p.name||p.email,picture:p.picture||null}});
  }catch(err){res.status(401).json({error:'Google sign-in verification failed.'});}
});
function requireAuth(req,res,next){
  if(!jwtSecret)return res.status(503).json({error:'Authentication is not configured.'});
  const header=req.get('authorization')||'';const token=header.startsWith('Bearer ')?header.slice(7):'';
  try{req.user=jwt.verify(token,jwtSecret,{issuer:'daylight-local'});if(!workspaces.has(req.user.sub))workspaces.set(req.user.sub,structuredClone(data));req.workspace=workspaces.get(req.user.sub);next();}catch(e){res.status(401).json({error:'Sign in with Google to continue.'});}
}
app.get('/api/health',(req,res)=>res.json({ok:true,service:'Daylight API'}));
app.get('/api/agents',requireAuth,(req,res)=>res.json({agents}));
app.post('/api/agents/:id/run',requireAuth,(req,res)=>{
  const agent=agents.find(a=>a.id===req.params.id);if(!agent)return res.status(404).json({error:'Agent not found.'});
  const request=String(req.body?.request||'').trim();if(!request)return res.status(400).json({error:'Provide a request.'});
  const routed=agent.id==='central-coordinator'?agents.slice(0,5).map(a=>({agentId:a.id,agentName:a.name,step:`Review relevant ${a.role.toLowerCase()} information`})):[{agentId:agent.id,agentName:agent.name,step:`Handle request related to ${agent.role.toLowerCase()}`}];
  res.json({request,status:'suggested',summary:`${agent.name} prepared a draft plan for review. No external action was taken.`,steps:routed});
});
app.get('/api/overview',requireAuth,(req,res)=>{const d=req.workspace;const spent=d.expenses.reduce((n,e)=>n+e.amount,0);res.json({user:{name:req.user.name,email:req.user.email},tasks:{total:d.tasks.length,done:d.tasks.filter(t=>t.done).length},schedule:d.events,finance:{spent,budget:d.budget,remaining:d.budget-spent,expenses:d.expenses},documents:d.documents,agents:agents.map(({id,name,role})=>({id,name,role}))})});
app.get('/api/tasks',requireAuth,(req,res)=>res.json({tasks:req.workspace.tasks}));
app.post('/api/tasks',requireAuth,(req,res)=>{const title=String(req.body?.title||'').trim();if(!title)return res.status(400).json({error:'Task title is required.'});const item={id:crypto.randomUUID(),title,category:String(req.body.category||'Personal'),due:String(req.body.due||'Today'),done:false,owner:'task-management-agent'};req.workspace.tasks.unshift(item);res.status(201).json({task:item})});
app.patch('/api/tasks/:id',requireAuth,(req,res)=>{const task=req.workspace.tasks.find(t=>t.id===req.params.id);if(!task)return res.status(404).json({error:'Task not found.'});if(typeof req.body.done==='boolean')task.done=req.body.done;if(typeof req.body.title==='string')task.title=req.body.title.trim();res.json({task})});
app.get('/api/finance/summary',requireAuth,(req,res)=>{const d=req.workspace;const spent=d.expenses.reduce((n,e)=>n+e.amount,0);const categories={};for(const e of d.expenses)categories[e.category]=(categories[e.category]||0)+e.amount;res.json({currency:'INR',period:'current month',spent,budget:d.budget,remaining:d.budget-spent,expenses:d.expenses,categories})});
app.post('/api/finance/expenses',requireAuth,(req,res)=>{const category=String(req.body?.category||'Other').trim();const amount=Number(req.body?.amount);if(!Number.isFinite(amount)||amount<=0)return res.status(400).json({error:'Enter a positive amount.'});const item={id:crypto.randomUUID(),category,amount,date:new Date().toLocaleDateString('en-IN',{month:'short',day:'numeric'})};req.workspace.expenses.unshift(item);res.status(201).json({expense:item})});
app.get('/api/documents',requireAuth,(req,res)=>res.json({documents:req.workspace.documents}));
app.post('/api/documents',requireAuth,(req,res)=>{const name=String(req.body?.name||'').trim();if(!name)return res.status(400).json({error:'Document name is required.'});const item={id:crypto.randomUUID(),name,type:String(req.body.type||'Reminder'),date:String(req.body.date||'Date not set')};req.workspace.documents.push(item);res.status(201).json({document:item})});
app.delete('/api/documents/:id',requireAuth,(req,res)=>{const d=req.workspace;const n=d.documents.length;d.documents=d.documents.filter(x=>x.id!==req.params.id);if(n===d.documents.length)return res.status(404).json({error:'Document not found.'});res.json({ok:true})});
app.get('/api/schedule',requireAuth,(req,res)=>res.json({events:req.workspace.events}));
app.post('/api/schedule',requireAuth,(req,res)=>{const title=String(req.body?.title||'').trim();if(!title)return res.status(400).json({error:'Event title is required.'});const item={id:crypto.randomUUID(),time:String(req.body.time||'Time TBD'),title,detail:String(req.body.detail||'Added locally'),category:String(req.body.category||'Personal')};req.workspace.events.push(item);res.status(201).json({event:item})});
app.get('/api/shopping',requireAuth,(req,res)=>res.json({items:req.workspace.shopping}));
app.post('/api/shopping',requireAuth,(req,res)=>{const name=String(req.body?.name||'').trim();if(!name)return res.status(400).json({error:'Item name is required.'});req.workspace.shopping.push(name);res.status(201).json({items:req.workspace.shopping})});
app.delete('/api/shopping/:name',requireAuth,(req,res)=>{const name=req.params.name;req.workspace.shopping=req.workspace.shopping.filter(x=>x!==name);res.json({items:req.workspace.shopping})});
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'index.html')));
app.listen(port,()=>console.log(`Daylight is running at http://localhost:${port}`));

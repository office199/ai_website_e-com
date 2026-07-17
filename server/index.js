const express = require('express');
const app = express();
app.use(express.json());
app.use((req,res,next)=>{res.header('Access-Control-Allow-Origin','*');next()});

const products = [
 {id:1,name:'The Essential Blazer',category:'women',price:148,stock:18},
 {id:2,name:'Relaxed Studio Shirt',category:'men',price:82,stock:32},
 {id:3,name:'Soft Knit Set',category:'baby',price:48,stock:24},
 {id:4,name:'Weekend Denim',category:'kids',price:62,stock:12}
];
let carts = {}, wishlists = {}, orders = [{id:'MO-10428',userId:'demo',total:230,status:'Processing',createdAt:'2025-03-08'}];
const find = id => products.find(p=>p.id === Number(id));

app.get('/api/health',(_,res)=>res.json({ok:true,service:'MODÉ API'}));
app.get('/api/products',(req,res)=>{const list=req.query.category?products.filter(p=>p.category===req.query.category):products;res.json(list)});
app.get('/api/products/:id',(req,res)=>{const p=find(req.params.id);p?res.json(p):res.status(404).json({error:'Product not found'})});
app.get('/api/cart/:userId',(req,res)=>res.json(carts[req.params.userId]||[]));
app.post('/api/cart/:userId',(req,res)=>{const p=find(req.body.productId);if(!p)return res.status(404).json({error:'Product not found'});const cart=carts[req.params.userId]||[];const row=cart.find(x=>x.productId===p.id);row?row.quantity+=req.body.quantity||1:cart.push({productId:p.id,quantity:req.body.quantity||1,product:p});carts[req.params.userId]=cart;res.status(201).json(cart)});
app.patch('/api/cart/:userId/:productId',(req,res)=>{const row=(carts[req.params.userId]||[]).find(x=>x.productId===+req.params.productId);if(!row)return res.status(404).json({error:'Item not found'});row.quantity=req.body.quantity;res.json(row)});
app.delete('/api/cart/:userId/:productId',(req,res)=>{carts[req.params.userId]=(carts[req.params.userId]||[]).filter(x=>x.productId!==+req.params.productId);res.status(204).end()});
app.get('/api/wishlist/:userId',(req,res)=>res.json(wishlists[req.params.userId]||[]));
app.post('/api/wishlist/:userId',(req,res)=>{const p=find(req.body.productId);if(!p)return res.status(404).json({error:'Product not found'});const list=wishlists[req.params.userId]||[];if(!list.some(x=>x.id===p.id))list.push(p);wishlists[req.params.userId]=list;res.status(201).json(list)});
app.delete('/api/wishlist/:userId/:productId',(req,res)=>{wishlists[req.params.userId]=(wishlists[req.params.userId]||[]).filter(x=>x.id!==+req.params.productId);res.status(204).end()});
app.get('/api/orders/:userId',(req,res)=>res.json(orders.filter(o=>o.userId===req.params.userId)));
app.post('/api/orders',(req,res)=>{const order={id:`MO-${10429+orders.length}`,userId:req.body.userId,total:req.body.total,status:'Processing',createdAt:new Date().toISOString().slice(0,10)};orders.push(order);carts[order.userId]=[];res.status(201).json(order)});
// Admin endpoints should be guarded by auth middleware in production.
app.get('/api/admin/metrics',(_,res)=>res.json({revenue:24892,orders:384,customers:1204,conversion:3.8}));
app.get('/api/admin/orders',(_,res)=>res.json(orders));
app.post('/api/admin/products',(req,res)=>{const p={id:products.length+1,...req.body};products.push(p);res.status(201).json(p)});
app.patch('/api/admin/products/:id',(req,res)=>{const p=find(req.params.id);if(!p)return res.status(404).json({error:'Product not found'});Object.assign(p,req.body);res.json(p)});
app.delete('/api/admin/products/:id',(req,res)=>{const index=products.findIndex(p=>p.id===+req.params.id);if(index<0)return res.status(404).json({error:'Product not found'});products.splice(index,1);res.status(204).end()});
app.listen(process.env.PORT||4000,()=>console.log('MODÉ API listening on :4000'));
